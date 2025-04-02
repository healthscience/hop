'use strict'
/**
*  HOP bring to life
*
*
* @class HOP
* @package    HOP
* @copyright  Copyright (c) 2024 James Littlejohn
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
import DmlRoute from './dml/index.js'
import HolepunchHOP from 'holepunch-hop'

class HOP extends EventEmitter {

  constructor(options) {
    super()
    this.hoptoken = ''
    this.options = options
    this.MessagesFlow = new MessageFlow()
    this.DataNetwork = new HolepunchHOP()
    this.wsocket = {}
    this.socketCount = 0
    this.BBRoute = {}
    this.SafeRoute = {}
    this.LibRoute = {}
    this.DmlRoute = {}
    this.startPtoPnetwork()
    this.sockcount = 0
  }

  /**
  * start holepunch data infrastructure
  * @method startPtoPnetwork
  *
  */
  startPtoPnetwork = async function  () {
    this.LibRoute = new LibraryRoute(this.DataNetwork)
    this.SafeRoute = new SfRoute(this.DataNetwork)
    this.DmlRoute = new DmlRoute(this.DataNetwork)
    this.BBRoute = new BBRoute(this.LibRoute)
    await this.listenNetwork()
    await this.listenBeebee()
    await this.listenLibrary()
    await this.listenLibrarySF()
    await this.listenSF()
    this.hopConnect()
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
  
      this.sockcount++ 
      this.wsocket = ws
      this.DataNetwork.setWebsocket(ws)
      this.LibRoute.setWebsocket(ws)
      this.SafeRoute.setWebsocket(ws)
      this.BBRoute.setWebsocket(ws)
      this.wsocket.id = uuidv4()

      this.wsocket.on('message', async (msg) => {
        const o = JSON.parse(msg)
        // check keys / pw and startup HOP if all secure
        if (o.type.trim() === 'hop-auth') {
          this.messageAuth()
        } else {
          if (this.hoptoken === o.jwt)
          // listen of close messages
          if (o.type.trim() === 'close') {
            this.closeHOP()
          } else {
            await this.messageResponder(o)
          }
        }
      })

      this.wsocket.on('close', ws => {
        console.log('close ws direct')
        process.exit(0)
      })

      this.wsocket.on('error', ws => {
        console.log('socket eeeerrrorrrr')
      })
      
    })

    process.on('unhandledRejection', function(err) {
     console.log(err)
    })

  }

  /**
  * listener from BeeBee router
  * @method listenBeebee
  *
  */
  listenBeebee = async function () {
    this.BBRoute.on('safeflow-query', async (data) => {
      await this.SafeRoute.newSafeflow(data)
    })
  }  
  
  /**
  * listener from Library SF router
  * @method listenLibrarySF
  *
  */
  listenLibrarySF = async function () {
    this.LibRoute.on('safeflow-query', async (data) => {
      await this.SafeRoute.newSafeflow(data)
    })
    this.LibRoute.on('safeflow-update', async (data) => {
      await this.SafeRoute.updateSafeflow(data)
    })
    this.LibRoute.on('safeflow-systems', async (data) => {
      await this.SafeRoute.setSafeflowSystems(data)
    })
  } 

  /**
  * listener from Library router
  * @method listenLibrary
  *
  */
  listenLibrary = async function () {
    this.LibRoute.on('library-data', async (data) => {
      // need to inform beebee and prepare HQB for SF
      let bbMessage = {}
      bbMessage.type = 'bbai-reply'
      bbMessage.reftype = 'ignore'
      bbMessage.action = 'library'
      bbMessage.data = data
      await this.BBRoute.bbAIpath(bbMessage)
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
    this.SafeRoute.on('library-systems', async (data) => {
      await this.LibRoute.libManager.systemsContracts()
    })

    this.DataNetwork.on('hcores-active', () => {
      this.hoptoken =  uuidv4()
      let authMessage = {}
      authMessage.type = 'account'
      authMessage.action = 'hop-verify'
      authMessage.data = { auth: true, jwt: this.hoptoken }
      this.sendSocketMessage(JSON.stringify(authMessage))
      // allow other components have access to data
      this.processListen()
    })

  }    

  /**
  * listen holepunch
  * @method processListen
  *
  */
  processListen = async function () {
    this.BBRoute.liveBBAI.listenHolepunchLive()
    this.LibRoute.libManager.startLibrary()
  }

  /**
  * listen ptop network messages
  * @method listenNetwork
  *
  */
  listenNetwork = async function () {
    this.DataNetwork.on('peer-topeer', (data) => {
      if (data.data.display === 'html') {
        // route to beebee for text message back to peer & prep bentobox
        this.BBRoute.liveBBAI.networkPeerdirect(data)
        // return vis data, like from SafeFlow
        this.SafeRoute.networkSFpeerdata(data.data) 
      } else if (data.display === 'safeflow') {
        // return vis data, like from SafeFlow
        this.SafeRoute.networkSFpeerdata(data) 
      }
    })

    this.DataNetwork.on('peer-cuespace', (data) => {
      this.BBRoute.liveBBAI.networkPeerSpace(data)
    })
  
    this.DataNetwork.on('peer-incoming-save', async (data) => {
      // save direct to library account contract, when save that will inform beeebee in BentoboxDS
      let libMessageout = {}
      libMessageout.type = 'library'
      libMessageout.action = 'account'
      libMessageout.reftype = 'new-peer'
      libMessageout.privacy = 'private'
      libMessageout.task = 'PUT'
      libMessageout.data = data
      libMessageout.bbid = ''
      await this.LibRoute.libManager.libraryManage(libMessageout)
    })
  
    this.DataNetwork.on('peer-reconnect-topic-notify', (data) => {
      let peerId = {}
      peerId.type = 'network-notification'
      peerId.action = 'warm-peer-topic'
      peerId.data = data
      this.sendSocketMessage(JSON.stringify(peerId))
    })

    this.DataNetwork.on('peer-topic-save', async (data) => {
      let libMessageout = {}
      libMessageout.type = 'library'
      libMessageout.action = 'account'
      libMessageout.reftype = 'new-peer-topic'
      libMessageout.privacy = 'private'
      libMessageout.task = 'PUT'
      libMessageout.data = data
      libMessageout.bbid = ''
      await this.LibRoute.libManager.libraryManage(libMessageout)
    })

    this.DataNetwork.on('peer-topic-update', async (data) => {
      let libMessageout = {}
      libMessageout.type = 'library'
      libMessageout.action = 'account'
      libMessageout.reftype = 'new-peer-topic'
      libMessageout.privacy = 'private'
      libMessageout.task = 'UPDATE'
      libMessageout.data = data
      libMessageout.bbid = ''
      await this.LibRoute.libManager.libraryManage(libMessageout)
    })

    this.DataNetwork.on('peer-codename-update', async (data) => {
      let libMessageout = {}
      libMessageout.type = 'library'
      libMessageout.action = 'account'
      libMessageout.reftype = 'update-peer-name'
      libMessageout.privacy = 'private'
      libMessageout.task = 'UPDATE'
      libMessageout.data = data
      libMessageout.bbid = ''
      await this.LibRoute.libManager.libraryManage(libMessageout)
    })

    this.DataNetwork.on('beebee-publib-notification', (data) => {
      let peerId = {}
      peerId.type = 'network-notification'
      peerId.action = 'network-library-n1'
      peerId.data = data
      this.sendSocketMessage(JSON.stringify(peerId))
    })

    this.DataNetwork.on('peer-live-notify', (data) => {
      let peerNotify = {}
      peerNotify.type = 'account'
      peerNotify.action = 'network-peer-live'
      peerNotify.data = data
      this.sendSocketMessage(JSON.stringify(peerNotify))
    })

    this.DataNetwork.on('peer-disconnect-notify', (data) => {
      let peerNotify = {}
      peerNotify.type = 'account'
      peerNotify.action = 'network-peer-disconnect'
      peerNotify.data = data
      this.sendSocketMessage(JSON.stringify(peerNotify))
    })


    this.DataNetwork.on('invite-live-peer', (data) => {
      let peerId = {}
      peerId.type = 'account'
      peerId.action = 'invite-live-accepted'
      peerId.data = data
      this.sendSocketMessage(JSON.stringify(peerId))
    })

    this.DataNetwork.on('drive-save-large', (data) => {
      this.sendSocketMessage(JSON.stringify(data))
    })
  }  

  /**
  * response to verify auth
  * @method messageAuth
  *
  */
  messageAuth = (o) => {
    // TODO  schnorr sig verifty and setup
    // bring store to life
    this.DataNetwork.startStores()
    // once store setup, then info BBox HOP ready
    /* this.hoptoken =  uuidv4()
    let authMessage = {}
    authMessage.type = 'account'
    authMessage.action = 'hop-verify'
    authMessage.data = { auth: true, jwt: this.hoptoken }
    this.sendSocketMessage(JSON.stringify(authMessage)) */
    // auth verified -- get AI agent options
    this.BBRoute.liveBBAI.hopLearn.openOrchestra()
  }

  /**
  * listen for outputs from SafeFlow
  * @method messageResponder
  *
  */
  //  = function (o) {
    messageResponder = async (o) => {
    let messageRoute = this.MessagesFlow.messageIn(o)
    if (messageRoute.type === 'bbai-reply') {
      await this.BBRoute.bbAIpath(messageRoute)
    } else if (messageRoute.type === 'safeflow') {
      this.SafeRoute.routeMessage(messageRoute)
    } else if (messageRoute.type === 'library') {
      await this.LibRoute.libManager.libraryManage(messageRoute)
      // this.LibRoute.libManager.libraryPath(messageRoute)
    } else if (messageRoute.type === 'bentobox') {
      this.LibRoute.libManager.bentoPath(messageRoute)
    } else if (messageRoute.type === 'network') {
      this.DataNetwork.networkPath(messageRoute)
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
  closeHOP = async function () {
    console.log('clos HOP beebee ')
    // inform network peer has closed.
    await this.DataNetwork.networkPath({ type: 'network', action: 'peer-closed' })
    // process.exit(1)
  }

}

export default HOP
let options = {}
options.port = 9888
new HOP(options)
