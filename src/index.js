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
import crypto from 'crypto'
import { WebSocketServer } from 'ws'
import { v4 as uuidv4 } from 'uuid'
import throttledQueue from 'throttled-queue'
import MessageFlow from 'hop-message'
import SfRoute from './safeflow/index.js'
import LibraryRoute from './library/index.js'
import LibComposer from 'librarycomposer'
import HyperspaceWorker from './dataapi/hyperSpace.js'

class HOP extends EventEmitter {

  constructor(options) {
    super()
    this.options = options
    console.log('{{HOP}}')
    console.log(this.options)
    this.DataRoute = new HyperspaceWorker()
    this.SafeRoute = new SfRoute()
    this.LibRoute = new LibraryRoute(this.DataRoute.liveHyperspace)
    this.liveLibrary = new LibComposer()
    this.MessagesFlow = new MessageFlow()
    this.hopConnect()
    this.sfListeners()
    this.wsocket = {}
  }

  /**
  * server & websocket
  * @method hopConnect
  *
  */
   hopConnect = function () {

    // this.sfListeners()

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
      console.log('listening on *:9888')
      console.log(process.env.npm_package_version)
    })

    const wsServer = new WebSocketServer({ server })

    // WebSocket server
    wsServer.on('connection', (ws) => {
      this.wsocket = ws
      this.LibRoute.setWebsocket(ws)
      // console.log('peer connected websocket')
      // console.log(wsServer.clients)
      // wsServer.clients.forEach(element => console.log(Object.keys(element)))
      // console.log(wsServer.clients.size)
      this.wsocket.id = uuidv4()

      this.wsocket.on('message', msg => {
        console.log('mesageINto socket')
        const o = JSON.parse(msg)
        console.log(o)
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
  * listen for outputs from SafeFlow
  * @method messageResponder
  *
  */
  messageResponder = async function (o) {

    let messageRoute = this.MessagesFlow.messageIn(o)
    console.log(messageRoute)
    if (messageRoute.type === 'safeflow') {
      this.SafeRoute.routeMessage(messageRoute)
    } else if (messageRoute.type === 'library') {
      this.LibRoute.libraryPath(messageRoute)
    }
  }

  /**
  * listen for outputs from SafeFlow
  * @method sfListeners
  *
  */
   sfListeners = async function () {
    // callbacks for datastores
    function resultsCallback (entity, data) {
      let resultMatch = {}
      if (data !== null) {
        resultMatch.entity = entity
        resultMatch.data = data
      } else {
        resultMatch.entity = entity
        resultMatch.data = false
      }
      this.SafeRoute.resultsFlow(resultMatch)
    }
  
    // listenr for data back from ECS
    this.SafeRoute.on('selfauth', (data) => {
      console.log('self uath listener')
      data.type = 'auth-hop'
      this.wsocket.send(JSON.stringify(data))
    })
    this.SafeRoute.on('displayEntity', (data) => {
      data.type = 'newEntity'
      this.wsocket.send(JSON.stringify(data))
    })
    // let deCount = this.SafeRoute.listenerCount('displayEntity')
    this.SafeRoute.on('displayEntityRange', (data) => {
      data.type = 'newEntityRange'
      this.wsocket.send(JSON.stringify(data))
    })
    this.SafeRoute.on('displayUpdateEntity', (data) => {
      data.type = 'updateEntity'
      this.wsocket.send(JSON.stringify(data))
    })
    this.SafeRoute.on('displayUpdateEntityRange', (data) => {
      data.type = 'updateEntityRange'
      this.wsocket.send(JSON.stringify(data))
    })
    this.SafeRoute.on('displayEmpty', (data) => {
      data.type = 'displayEmpty'
      this.wsocket.send(JSON.stringify(data))
    })
    this.SafeRoute.on('updateModule', async (data) => {
      let moduleRefContract = liveLibrary.liveComposer.moduleComposer(data, 'update')
      const savedFeedback = await this.DataRoute.liveHyperspace.savePubliclibrary(moduleRefContract)
    })
    this.SafeRoute.on('storePeerResults', async (data) => {
      const checkResults = await HyperspaceWorker.saveHOPresults(data)
    })
  
    this.SafeRoute.on('checkPeerResults', async (data) => {
      const checkResults = await HyperspaceWorker.peerResults(data)
      resultsCallback(data, checkResults)
    })
  
    this.SafeRoute.on('kbledgerEntry', async (data) => {
      const savedFeedback = await HyperspaceWorker.saveKBLentry(data)
    })
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