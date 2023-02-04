'use strict'
/**
*  HOP bring to life
*
*
* @class HOP
* @package    HOP
* @copyright  Copyright (c) 2022 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import util from 'util'
import EventEmitter from 'events'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
const _dirname = typeof __dirname !== 'undefined'
  ? __dirname
  : dirname(fileURLToPath(import.meta.url))
import { createServer } from 'https'
import fs from 'fs'
import { WebSocketServer } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import MessageFlow from 'hop-message'
import SfRoute from './safeflow/index.js'
import LibraryRoute from './library/index.js'
import BBRoute from './bbai/index.js'
import HolepunchHOP from 'holepunch-hop'

class HOP extends EventEmitter {

  constructor(options) {
    super()
    this.options = options
    this.DataRoute = new HolepunchHOP()
    this.SafeRoute = new SfRoute(this.DataRoute)
    this.LibRoute = new LibraryRoute(this.DataRoute)
    this.BBRoute = new BBRoute()
    this.MessagesFlow = new MessageFlow()
    // this.DataRoute.DriveFiles.setupHyperdrive()
    // this.DataRoute.BeeData.setupHyperbee()
    this.hopConnect()
    this.wsocket = {}
    this.socketCount = 0
    this.listenSF()
  }

  /**
  * server & websocket
  * @method hopConnect
  *
  */
   hopConnect = function () {

    const options = {
      key: fs.readFileSync(_dirname + '/key.pem'),
      cert: fs.readFileSync(_dirname + '/cert.pem')
    }

    const server = createServer(options, (request, response) => {
      // process HTTPS request. Since we're writing just WebSockets
      // server we don't have to implement anything.
    })

    server.on('error', function(e) {
      console.log('problem with request: ' + e.stack);
    })

    server.listen(this.options.port, () => {
      console.log('listening on *:' + this.options.port)
      console.log(process.env.npm_package_version)
    })

    const wsServer = new WebSocketServer({ server })

    // WebSocket server
    wsServer.on('connection', async (ws) => {
      this.wsocket = ws
      this.DataRoute.setWebsocket(ws)
      this.LibRoute.setWebsocket(ws)
      this.SafeRoute.setWebsocket(ws)
      this.BBRoute.setWebsocket(ws)
      // this.socketCount++
      // console.log('peer connected websocket')
      // console.log(wsServer.clients)
      // wsServer.clients.forEach(element => console.log(Object.keys(element)))
      // console.log(wsServer.clients.size)
      this.wsocket.id = uuidv4()

      this.wsocket.on('message', (msg) => {
        const o = JSON.parse(msg)
        // console.log('message into HOP')
        // console.log(o)
        this.messageResponder(o)
      })

      this.wsocket.on('close', ws => {
        console.log('close ws direct')
        // process.exit(0)
      })

      this.wsocket.on('error', ws => {
          console.log('socket eeeerrrorrrr')
          // process.exit(1)
      })
      
    })

    process.on('unhandledRejection', function(err) {
    console.log(err)
    })

  }
  
  /**
  * listener from SafeFLOW router
  * @method listenSF
  *
  */
  listenSF = async function () {
    this.SafeRoute.on('sfauth', async (data) => {
      await this.setupHolepunch()
      data.type = 'auth-hop'
      this.wsocket.send(JSON.stringify(data))
    })
  }    

  /**
  * setup hyperspace
  * @method setupHolepunch
  *
  */
   setupHolepunch = async function () {
    // console.log('start holepunch')
    // await this.DataRoute.startHyperspace()
  }

  /**
  * listen for outputs from SafeFlow
  * @method messageResponder
  *
  */
  messageResponder = function (o) {
    let messageRoute = this.MessagesFlow.messageIn(o)
    // console.log(messageRoute)
    if (messageRoute.type === 'safeflow') {
      this.SafeRoute.routeMessage(messageRoute)
    } else if (messageRoute.type === 'library') {
      this.LibRoute.libraryPath(messageRoute)
    } else if (messageRoute.type === 'bentospace') {
      this.LibRoute.bentoPath(messageRoute)
    } else if (messageRoute.type === 'bbai-reply') {
      this.BBRoute.bbAIpath(messageRoute)
    }
  }

  /**
  * server & websocket
  * @method sendSocketMessage
  *
  */
  sendSocketMessage = function (message) {
    this.wsocket.send(message)
  }
  
  /**
  * close the connection
  * @method closeHOP
  *
  */
  closeHOP = function () {
    process.exit(1)
  }

}

export default HOP
// let options = {}
// options.port = 9888
// let hopSF = new liveHOP(options)

// export default new HOP(options)