'use strict'
/**
*  HOP bring to be
*
*
* @class HOP
* @package    HOP
* @copyright  Copyright (c) 2025 James Littlejohn
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
import { Encryption } from 'hop-crypto/encryption'
import AnchorDawn from './anchor/dawn.js'
import MessageFlow from 'hop-message'
import SfRoute from './safeflow/index.js'
import LibraryRoute from './library/index.js'
import BBRoute from './bbai/index.js'
import DmlRoute from './dml/index.js'
import HeliRoute from './heliclock/index.js'
import BesearchRoute from 'besearch-hop'
import HolepunchHOP from 'holepunch-hop'
import HeliLocation from 'heliclock-hop'
import { hopSwarm } from 'hop-resonagent'
import { Cue, ConsilienceWeave } from 'cues-hop';

class HOP extends EventEmitter {

  constructor(options) {
    console.log('hop be')
    console.log(options)
    super()
    this.wiring = {}
    this.hoptoken = ''
    this.options = options
    this.heliLocation = new HeliLocation()
    this.HeliClock = {}
    this.anchorDawn = new AnchorDawn(this.options.storename)
    this.MessagesFlow = new MessageFlow()
    this.hopCrypto = {}
    this.DataNetwork = {}
    this.resonAgents = hopSwarm
    this.spine = {}
    this.wsocket = {}
    this.socketCount = 0
    this.wiring.bbai = {}
    this.wiring.safeflow = {}
    this.wiring.library = {}
    this.DmlRoute = {}
    this.HeliRoute = {}
    this.origin
    this.anchorState = false
    this.initHeliClock()
    this.hopConnect()
    this.sockcount = 0
  }

  /**
   * initialize HeliClock WASM
   * @method initHeliClock
   *
  */
  initHeliClock = async function () {
    try {
      await this.heliLocation.init()
      this.HeliClock = this.heliLocation.getEngine()
      this.anchorDawn.setHeliClock(this.HeliClock)
    } catch (err) {
      console.warn('HeliClock init failed or already initialized', err)
    }
  }

  /**
   * @method commitKnowledge
   * @param {*} rawKnowledge 
   */
  commitKnowledge =  async function (rawKnowledge) {
    const newCue = new Cue(rawKnowledge);
    
    // Workers in SafeFlow-ECS do the heavy lifting
    const result = await ConsilienceWeave.evaluate(newCue, this.spine);

    if (result.isValid) {
      // The Hyperbee gets populated as valid cycles complete
      await this.spine.put(`cue!${newCue.hash}`, newCue);
      console.log(`Knowledge Committed: ${newCue.hash}`);
    } else {
      console.warn("Incoherent Signal Pruned.");
    }
  }

  /**
  * check if encryption in place / integrity of HOP
  * @method anchorHOP
  *
  */
  anchorHOP = async function  () {
    let dawnStatus = await this.anchorDawn.initialize()
    if (dawnStatus.type === 'STATUS_GENESIS') {
      let anchorMessage = {}
      anchorMessage.type = 'account'
      anchorMessage.action = 'hop-anchor'
      anchorMessage.data = { anchor: dawnStatus, jwt: this.hoptoken }
      this.sendSocketMessage(JSON.stringify(anchorMessage))
    } else if (dawnStatus.type === 'STATUS_LOCKED') {
      let anchorMessage = {}
      anchorMessage.type = 'account'
      anchorMessage.action = 'hop-locked'
      anchorMessage.data = { anchor: dawnStatus, jwt: this.hoptoken }
      this.sendSocketMessage(JSON.stringify(anchorMessage))
    }
  }

  /**
   * unlock peer and start P2P network
   * @method unlockPeer
   *
  */
  unlockPeer = async function (password) {
    try {
      const { pubKey, masterSeed } = await this.anchorDawn.unlockAndActivate(password)
      if (pubKey !== false) {
        this.HeliClock = this.anchorDawn.HeliClock
        return pubKey
      
      } else {
        return false
      }
    } catch (err) {
        console.error('Failed to unlock peer:', err)
        throw err
      }
  }

  /**
   *  network personal store live, pass context around
   *  @method contextWiring
   *
  */
  contextWiring = async function () {
    // this.wiring.crypto.verify_coherence = wasm.verify_coherence

    // Build the Context Object (The Nervous System)
    this.wiring = {
      heliclock: this.heliLocation,
      heliLocation: this.heliLocation,
      crypto: this.hopCrypto,
      network: this.DataNetwork,
      bbai: null,
      resonagents: this.resonAgents,
      safeflow: null,
      besearch: null,
      library: null
    }

    // Phase 2: Wiring (Synapses)
    // Pass the WHOLE context. Routes pull what they need from it.
    this.wiring.bbai = new BBRoute(this.wiring)
    this.wiring.safeflow = new SfRoute(this.wiring)
    this.wiring.library = new LibraryRoute(this.wiring) 
    // if wiring access to websocket (will be removed in v2)
    this.wiring.bbai.setWebsocket(this.wsocket)
    this.wiring.safeflow.setWebsocket(this.wsocket)
    this.wiring.library.setWebsocket(this.wsocket)
    
    // need to re examine these
    this.DmlRoute = new DmlRoute(this.DataNetwork)

    this.BesearchRoute = new BesearchRoute(this.wiring)
    this.wiring.besearch = this.BesearchRoute

    this.HeliRoute = new HeliRoute(this.wiring)
    this.HeliRoute.setWebsocket(this.wsocket)


    await this.listenHeliclock()
    await this.listenNetwork()
    await this.listenBeebee()
    await this.listenLibrary()
    await this.listenLibrarySF()
    await this.listenSF()
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

    // 1. Define your allowed peer origin (BentoBoxDS location)
    const ALLOWED_ORIGIN = 'https://localhost:5173'; // Change to your actual UI port

    const server = createServer(options, (request, response) => {
      // process HTTPS request. Since we're writing just WebSockets
      // server we don't have to implement anything.
    })

    server.on('error', function(e) {
      console.log('problem with request: ' + e.stack);
    })

    // 2. Upgrade to WebSocket with Origin Check
    server.on('upgrade', (request, socket, head) => {
      const origin = request.headers.origin;

      // SERIOUS INTENT: Strict Origin Check
      if (origin !== ALLOWED_ORIGIN) {
        console.error(`!!! SECURITY ALERT: Blocked unauthorized origin: ${origin}`);
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
        socket.destroy();
        return;
      }

      // Origin is safe. Proceed to WebSocket upgrade.
      wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
      });
    });

  server.listen(this.options.port, async () => {
    console.log(`[HOP] Peer Gateway active on *:${this.options.port}`);
  });

    const wsServer = new WebSocketServer({ noServer: true })

    // WebSocket server
    wsServer.on('connection', async (ws) => {
      this.sockcount++ 
      this.wsocket = ws
      // if first peer experience wait until anchor is complete
      if (this.anchorState === true) {
        this.DataNetwork.setWebsocket(ws)
        this.wiring.library.setWebsocket(ws)
        this.wiring.safeflow.setWebsocket(ws)
        this.wiring.bbai.setWebsocket(ws)
      } else {
        await this.anchorHOP()
      }
      this.wsocket.id = uuidv4()

      this.wsocket.on('message', async (msg) => {
        // console.log('HOP message received')
        const o = JSON.parse(msg)
        // console.log(o)
        // check keys / pw and startup HOP if all secure
        if (o.type.trim() === 'hop-auth') {
          await this.messageAuth(o)
        } else {
          if (this.hoptoken === o.jwt)
          // listen of close / messages
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
  * on start gather heliclock data
  * @method startDataHeliClock
  *
  */
  startDataHeliClock = async function () {
    let projectionArcs = await this.HeliRoute.initHeliData()
    // 1 degree segment emitter
    this.HeliRoute.heliLocation.updateHeliState()
  }  

  /**
  * response to verify auth
  * @method messageAuth
  *
  */
  messageAuth = async (o) => {
    if (o.action === 'request-crypto-wasm') {
      await this.WASMcryptoID(o)
      return
    }

    if (o.action === 'verify-crypto-wasm') {
      this.verifyAndConnect(o.data)
    }

    if (o.action === 'sign-and-verify') {
      // This is a placeholder for the sign-and-verify logic
      // In a real scenario, we might sign the intent and then verify it
      // For now, we'll just proceed to start stores if the intent is present
      if (o.data && o.data.intent) {
        let verifyMessage = {
          type: 'account',
          action: 'sign-verify-complete',
          data: { verified: true, intent: o.data.intent },
          bbid: o.bbid
        }
        this.sendSocketMessage(JSON.stringify(verifyMessage))
      }
    }

    // Schnorr sig verify and setup
    if (o.data && o.data.pubkey && o.data.sig && o.data.msg) {
      try {
        const pubkey = new Uint8Array(Buffer.from(o.data.pubkey, 'hex'))
        const sig = new Uint8Array(Buffer.from(o.data.sig, 'hex'))
        const isValid = verify_coherence(pubkey, o.data.msg, sig)

        if (!isValid) {
          console.warn('Schnorr signature verification failed')
          let authMessage = {
            type: 'account',
            action: 'hop-verify',
            data: { auth: false, error: 'Invalid signature' }
          }
          this.sendSocketMessage(JSON.stringify(authMessage))
          return
        }
      } catch (err) {
        console.error('Error during signature verification:', err)
        return
      }
    }
  }

  /**
  * build wasm and generate handshake
  * @method WASMcryptoID
  *
  */
  WASMcryptoID = async(o) => {
    try {
      let genIdentity = await this.anchorDawn.generateMasterIdentity(o.data.pwd, o.data.entropy)
      let wasmMessage = {
        type: 'account',
        action: 'crypto-wasm-pubkey',
        data: genIdentity, // Now a safe JSON string
        bbid: o.bbid
      }; 
      this.sendSocketMessage(JSON.stringify(wasmMessage));
    } catch (err) {
      console.error('Error sending crypto wasm:', err);
    }
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
      await this.wiring.bbai.bbAIpath(messageRoute)
    } else if (messageRoute.type === 'heliclock') {
      await this.HeliRoute.heliPath(messageRoute)
    } else if (messageRoute.type === 'safeflow') {
      this.wiring.safeflow.routeMessage(messageRoute)
    } else if (messageRoute.type === 'library') {
      await this.wiring.library.libManager.libraryManage(messageRoute)
      // this.wiring.library.libManager.libraryPath(messageRoute)
    } else if (messageRoute.type === 'bentobox') {
      this.wiring.library.libManager.bentoPathOperations(messageRoute)
    } else if (messageRoute.type === 'network') {
      this.DataNetwork.networkPath(messageRoute)
    } else if (messageRoute.type === 'crypto') {
      this.cryptoPath(messageRoute)
    }
  }

  /**
  * handle crypto messages
  * @method cryptoPath
  *
  */
  cryptoPath = async (o) => {
    if (o.action === 'verify') {
      const pubkey = new Uint8Array(Buffer.from(o.data.pubkey, 'hex'))
      const sig = new Uint8Array(Buffer.from(o.data.sig, 'hex'))
      const wasm = await import('hop-crypto')
      const isValid = wasm.verify_coherence(pubkey, o.data.msg, sig)
      
      let reply = {
        type: 'crypto-reply',
        action: 'verify',
        data: { valid: isValid },
        bbid: o.bbid
      }
      this.sendSocketMessage(JSON.stringify(reply))
    }
  }

  /**
  * verify self and connect to hop
  * @method cryptoPath
  *
  */
  verifyAndConnect = async (verData) => {
    const verDataObj = typeof verData === 'string' ? JSON.parse(verData) : verData
    
    if (verDataObj.pwd) {
      try {
        const pubKey = await this.unlockPeer(verDataObj.pwd)
        let verifyMessage = {}
        if ( pubKey !== false) {
          verifyMessage = {
            type: 'account',
            action: 'unlocked-verify-complete',
            data: { verified: true, unlocked: true },
            bbid: ''
          }
          // bring HOP fully to life
          await this.HOPlife()
        } else {
          let HOPgatekeeper = {}
          HOPgatekeeper.type = 'account'
          HOPgatekeeper.action = 'hop-wrong-password'
          HOPgatekeeper.data = { feedback: 'Wrong password entered.' }
          this.wsocket.send(JSON.stringify(HOPgatekeeper))
        }
        this.sendSocketMessage(JSON.stringify(verifyMessage))
        return true
      } catch (err) {
        console.error('Failed to unlock peer during connection:', err)
        return false
      }
    }
  }

   /**
  * HOP  all systems go
  * @method HOPlife
  *
  */
  HOPlife = async function () {
    // bring to be
    this.DataNetwork = new HolepunchHOP(this.options.storename)
    this.DataNetwork.setWebsocket(this.wsocket)
    this.DataNetwork.startStores()
    this.listenHP()
    return true;
  }

  /**
  * listen holepunch
  * @method processListen
  *
  */
  processListen = async function () {
    this.wiring.bbai.liveBBAI.listenHolepunchLive()
    this.wiring.library.libManager.startLibrary()
  }

  /**
  * listener from BeeBee router
  * @method listenBeebee
  *
  */
  listenBeebee = async function () {
    this.wiring.bbai.on('safeflow-query', async (data) => {
      await this.wiring.safeflow.newSafeflow(data)
    })
  }  
  
  /**
  * listener for HeliClock
  * @method listenHeliclock
  *
  */
  listenHeliclock = async function () {
    this.HeliRoute.heliLocation.on('HELI_DEGREE_PULSE', (data) => {
    let heliclockData = {}
    heliclockData.type = 'heliclock'
    heliclockData.action = 'peer-heli-wedge'
    heliclockData.data = data
    this.wsocket.send(JSON.stringify(heliclockData))
    })

    this.HeliRoute.heliLocation.on('HELI_DEGREE_SIGNATURE', (data) => {
    let heliclockData = {}
    heliclockData.type = 'heliclock'
    heliclockData.action = 'heli-birth-signature'
    heliclockData.data = data
    this.wsocket.send(JSON.stringify(heliclockData))
    })

    this.HeliRoute.on('heli-clock-start', (data) => {
      let heliclockData = {}
      heliclockData.type = 'heliclock'
      heliclockData.action = 'peer-heli-signature'
      heliclockData.data = projectionArcs
      this.wsocket.send(JSON.stringify(heliclockData))
    })
  }  

  /**
  * listener from Library SF router
  * @method listenLibrarySF
  *
  */
  listenLibrarySF = async function () {
    this.wiring.library.on('safeflow-query', async (data) => {
      await this.wiring.safeflow.newSafeflow(data)
    })
    this.wiring.library.on('safeflow-update', async (data) => {
      await this.wiring.safeflow.updateSafeflow(data)
    })
    this.wiring.library.on('safeflow-systems', async (data) => {
      await this.wiring.safeflow.setSafeflowSystems(data)
    })
  } 

  /**
  * listener from Library router
  * @method listenLibrary
  *
  */
  listenLibrary = async function () {
    this.wiring.library.on('library-data', async (data) => {
      // need to inform beebee and prepare HQB for SF
      let bbMessage = {}
      bbMessage.type = 'bbai-reply'
      bbMessage.reftype = 'ignore'
      bbMessage.action = 'library'
      bbMessage.data = data
      await this.wiring.bbai.bbAIpath(bbMessage)
    })
  }  

  /**
  * listener from SafeFLOW router
  * @method listenSF
  *
  */
  listenSF = async function () {
    this.wiring.safeflow.on('sfauth', async (data) => {
      await this.setupHolepunch()
      data.type = 'auth-hop'
      this.wsocket.send(JSON.stringify(data))
    })
    this.wiring.safeflow.on('library-systems', async (data) => {
      await this.wiring.library.libManager.systemsContracts()
    })
  }

  /**
  * listener from DataNetwork events
  * @method listenHP
  *
  */
  listenHP = async function () {
    this.DataNetwork.on('hcores-active', async () => {
      this.hopCrypto = new Encryption()
      // Attach Context to DataNetwork for ECS visibility
      this.DataNetwork.setHOPCrypto(this.hopCrypto)
      // active nervous system context wiring
      await this.contextWiring()
      this.hoptoken =  uuidv4()
      let authMessage = {}
      authMessage.type = 'account'
      authMessage.action = 'hop-holepunch-live'
      authMessage.data = { auth: true, jwt: this.hoptoken }
      this.sendSocketMessage(JSON.stringify(authMessage))
      // allow other components have access to data
      this.processListen()
      await this.startDataHeliClock()
      // bentoboxDS beebee bring to be routine memory
      this.wiring.bbai.liveBBAI.bringToBe('awake')
    })
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
        this.wiring.bbai.liveBBAI.networkPeerdirect(data)
        // return vis data, like from SafeFlow
        this.wiring.safeflow.networkSFpeerdata(data.data) 
      } else if (data.display === 'safeflow') {
        // return vis data, like from SafeFlow
        this.wiring.safeflow.networkSFpeerdata(data) 
      }
    })

    this.DataNetwork.on('peer-cuespace', (data) => {
      this.wiring.bbai.liveBBAI.networkPeerSpace(data)
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
      await this.wiring.library.libManager.libraryManage(libMessageout)
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
      await this.wiring.library.libManager.libraryManage(libMessageout)
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
      await this.wiring.library.libManager.libraryManage(libMessageout)
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
      await this.wiring.library.libManager.libraryManage(libMessageout)
    })

    this.DataNetwork.on('beebee-publib-notification', (data) => {
      let peerId = {}
      peerId.type = 'network-notification'
      peerId.action = 'network-library-n1'
      peerId.data = data
      this.sendSocketMessage(JSON.stringify(peerId))
    })

    this.DataNetwork.on('replicate-publib-notification', (data) => {
      let peerId = {}
      peerId.type = 'network-notification'
      peerId.action = 'network-replicate-publiclibrary'
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
    // inform network peer has closed.
    await this.DataNetwork.networkPath({ type: 'network', action: 'peer-closed' })
    // process.exit(1)
  }

}

export default HOP
let options = {}
options.port = 9888
// Pick up the storename parameter from the command line
// example npm run start --store-name test-hop-storage
const args = process.argv.slice(2)
if (args.length > 0) {
  options.storename = args[0]
} else {
  // Default value if no argument is provided
}

new HOP(options)
