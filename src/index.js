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
// import DataRoute from './dataapi/index.js'

class HOP extends EventEmitter {

  constructor(options) {
    super()
    this.options = options
    console.log('{{HOP}}')
    console.log(this.options)
    this.hopConnect()
  }

  /**
  * server & websocket
  * @method hopConnect
  *
  */
   hopConnect = function () {

  const SafeRoute = new SfRoute()
  const LibRoute = new LibraryRoute()
  // const DataRoute = new DataRoute()

  const MessagesFlow = new MessageFlow()

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
  wsServer.on('connection', function ws(ws, req) {
    // console.log('peer connected websocket')
    // console.log(wsServer.clients)
    // wsServer.clients.forEach(element => console.log(Object.keys(element)))
    // console.log(wsServer.clients.size)
    ws.id = uuidv4()

    ws.on('message', async msg => {
      const o = JSON.parse(msg)
      let messageRoute = MessagesFlow.messageIn(o)
      if (messageRoute.type === 'safeflow') {
        this.SafeRoute.messageRoute(messageRoute)
      }
    })

    ws.on('close', ws => {
      console.log('close ws direct')
      jwtList = []
      pairSockTok = {}
      liveHOPflow = {}
      setFlow = false
      // process.exit(0)
    })

    ws.on('error', ws => {
        console.log('socket eeeerrrorrrr')
        // process.exit(1)
      })
    })

    process.on('unhandledRejection', function(err) {
    console.log(err)
    })
  }
}

export default HOP
// let options = {}
// options.port = 9888
// let hopSF = new liveHOP(options)

// export default new HOP(options)