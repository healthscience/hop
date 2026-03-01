'use strict'
/**
*  HOP bring to life
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
import AnchorDawn from './anchor/dawn.js'
import MessageFlow from 'hop-message'
import SfRoute from './safeflow/index.js'
import LibraryRoute from './library/index.js'
import BBRoute from './bbai/index.js'
import DmlRoute from './dml/index.js'
import BesearchRoute from 'besearch-hop'
import HolepunchHOP from 'holepunch-hop'
import { SovereignKeypair } from 'hop-crypto'

class HOP extends EventEmitter {

  constructor(options) {
    console.log('hop be')
    console.log(options)
    super()
    this.hoptoken = ''
    this.options = options
    this.anchorDawn = new AnchorDawn(this.options.storename)
    this.MessagesFlow = new MessageFlow()
    this.DataNetwork = {} // new HolepunchHOP(this.options.storename)
    this.wsocket = {}
    this.socketCount = 0
    this.BBRoute = {}
    this.SafeRoute = {}
    this.LibRoute = {}
    this.DmlRoute = {}
    this.origin
    this.anchorState = false
    this.hopConnect()
    this.sockcount = 0
  }

  /**
  * check if encryption in place / integrity of HOP
  * @method anchorHOP
  *
  */
  anchorHOP = async function  () {
    let dawnStatus = await this.anchorDawn.initialize()
    console.log('dawnStatus')
    console.log(dawnStatus)
    if (dawnStatus.type === 'STATUS_GENESIS') {
      console.log('anchor genesis')
      let anchorMessage = {}
      anchorMessage.type = 'account'
      anchorMessage.action = 'hop-anchor'
      anchorMessage.data = { anchor: dawnStatus, jwt: this.hoptoken }
      console.log('anchor message')
      this.sendSocketMessage(JSON.stringify(anchorMessage))
    } else if (dawnStatus.type === 'STATUS_LOCKED') {
      let anchorMessage = {}
      anchorMessage.type = 'account'
      anchorMessage.action = 'hop-locked'
      anchorMessage.data = { anchor: dawnStatus, jwt: this.hoptoken }
      console.log('anchor message')
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
      this.HeliClock = this.anchorDawn.HeliClock
      
      // Initialize HolepunchHOP or other P2P logic here with masterSeed
      this.DataNetwork = {} // new HolepunchHOP(this.options.storename, masterSeed)
      
      // Build the Context Object (The Nervous System)
      const wasm = await import('hop-crypto')
      this.context = {
        heliclock: this.HeliClock,
        crypto: { verify_coherence: wasm.verify_coherence },
        network: this.DataNetwork,
        safeflow: null,
        besearch: null,
        bbai: null,
        library: null
      }

      // Attach Context to DataNetwork for ECS visibility
      this.DataNetwork.context = this.context

      this.LibRoute = new LibraryRoute(this.DataNetwork)
      this.context.library = this.LibRoute

      this.SafeRoute = new SfRoute(this.context)
      this.context.safeflow = this.SafeRoute

      this.DmlRoute = new DmlRoute(this.DataNetwork)

      this.BesearchRoute = new BesearchRoute(this.context)
      this.context.besearch = this.BesearchRoute

      this.BBRoute = new BBRoute(this.context)
      this.context.bbai = this.BBRoute

      // await this.listenNetwork()
      await this.listenBeebee()
      await this.listenLibrary()
      await this.listenLibrarySF()
      await this.listenSF()

      console.log('Peer unlocked and P2P network ready:', pubKey)
      return pubKey
    } catch (err) {
      console.error('Failed to unlock peer:', err)
      throw err
    }
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
      // if first peer experience wait until anchoris complete
      if (this.anchorState === true) {
        this.DataNetwork.setWebsocket(ws)
        this.LibRoute.setWebsocket(ws)
        this.SafeRoute.setWebsocket(ws)
        this.BBRoute.setWebsocket(ws)
      } else {
        console.log('Anchor is not ready')
        await this.anchorHOP()
      }
      this.wsocket.id = uuidv4()

      this.wsocket.on('message', async (msg) => {
        console.log('HOP message received')
        const o = JSON.parse(msg)
        console.log(o)
        // check keys / pw and startup HOP if all secure
        if (o.type.trim() === 'hop-auth') {
          this.messageAuth(o)
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
      console.log('data in librayr now pass to safelfow ----')
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

    /*this.DataNetwork.on('hcores-active', () => {
      this.hoptoken =  uuidv4()
      let authMessage = {}
      authMessage.type = 'account'
      authMessage.action = 'hop-verify'
      authMessage.data = { auth: true, jwt: this.hoptoken }
      this.sendSocketMessage(JSON.stringify(authMessage))
      // allow other components have access to data
      this.processListen()
    })*/

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
  * response to verify auth
  * @method messageAuth
  *
  */
  messageAuth = (o) => {
    if (o.action === 'request-crypto-wasm') {
      this.WASMcryptoID(o)
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
        console.log('Sign and verify intent:', o.data.intent)
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
        console.log('Schnorr signature verified successfully')
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
  WASMcryptoID = (o) => {
    try {
      let genIdentity = this.anchorDawn.generateMasterIdentity(o.data.pwd, o.data.entropy)
      console.log('genIdentity:', genIdentity)
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

  verifyAndConnect = async (verData) => {
    console.log('verifyAndConnect', verData)
    const verDataObj = typeof verData === 'string' ? JSON.parse(verData) : verData
    console.log('verData keys:', Object.keys(verDataObj))
    
    if (verDataObj.pwd) {
      console.log('Unlocking peer with password...')
      try {
        const pubKey = await this.unlockPeer(verDataObj.pwd)
        console.log('Peer unlocked successfully:', pubKey)
        return true
      } catch (err) {
        console.error('Failed to unlock peer during connection:', err)
        return false
      }
    }

    const targetPubKey = verDataObj.pubkey || verDataObj.publicKey || verDataObj.key
  // 1. Internal WASM Check: Does the hash match our loaded module?

  // const internalHash = await getWasmHash();
  // if (internalHash !== verData.wasmHash) throw new Error("WASM Tamper Detected");


  // 2. Identity Check: Is this a valid Ed25519 key?
  await this.anchorDawn.initWASM()
  const dummySeed = new Uint8Array(32);
  dummySeed.fill(1); // Ensure it's not all zeros
  const keypair = new SovereignKeypair(dummySeed);
  const pubkey = keypair.get_public_key();
  console.log(pubkey)
  const HOPkeyHex = Buffer.from(pubkey).toString('hex');
  console.log(HOPkeyHex)
  console.log(targetPubKey)
  let isValid = false
  if (HOPkeyHex === targetPubKey) {
    isValid = true
  };
  console.log('valid trus???', isValid)
  if (isValid === true) {
    // bring store to life
    this.DataNetwork = new HolepunchHOP(this.options.storename)
    // this.DataNetwork.startStores()
    // auth verified -- get AI agent options
    // this.BBRoute.liveBBAI.hopLearn.openOrchestra()
    // 3. Activation: ONLY NOW do we trigger the P2P flows
    console.log('bring cog glue and PtoP plumbing to life')
    // await startHolepunch(publicKey);
    // await initiateLifeStrapSync(); // Cues, BESearch, etc.
  }
  return true;
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
