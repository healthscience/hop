'use strict'
/**
*  safeflow - routing
*
*
* @class SfRoute
* @package    SafeflowRoute
* @copyright  Copyright (c) 2022 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import util from 'util'
import EventEmitter from 'events'
import crypto from 'crypto'
import SafeFlowECS from 'node-safeflow'
import LibComposer from 'librarycomposer'


class SfRoute extends EventEmitter {

  constructor(Holepunch) {
    super()
    this.live = true
    this.wsocket = {}
    this.wlist = []
    this.holepunchLive = Holepunch
    this.liveLibrary = new LibComposer()
    this.SafeFlow = new SafeFlowECS(Holepunch)
    this.SafeFlow.entityGetter()
    this.sfListeners()
  }

  /**
  * route message in
  * @method routeMessage
  *
  */
  routeMessage = async function (message) {
    if (message.action === 'selfauth') {
      await this.authHOP(message)
    } else if (message.action === 'networkexperiment') {
      await this.newSafeflow(message)
    } else if (message.action === 'updatenetworkexperiment') {
      await this.updateSafeflow(message)
    }
  }

  /**
  * pass on websocket to library
  * @method setWebsocket
  *
  */
  setWebsocket = function (ws) {
    this.wsocket = ws
    this.wlist.push(ws)
  }

  /**
  * return to both websockets
  * @method bothSockets
  *
  */
  bothSockets = function (retmesg) {
    for (let ws of this.wlist) {
      ws.send(retmesg)
    }
  }

  /**
  * bring all the HOP part to life securely
  * @method safeflowECS
  *
  */
   authHOP = async function (message) {
    // secure connect to safeFLOW
    // let authStatus = await HOP.networkAuthorisation(message.settings)
    // OK with safeFLOW setup then bring peerDatastores to life
    // ws.send(JSON.stringify(authStatus))
    // await peerListeners(ws)
    let jwtList = []
    let authPeer = true
    let tokenString = crypto.randomBytes(64).toString('hex')
    // jwtList.push(tokenString)
    // create socketid, token pair
    // pairSockTok[ws.id] = tokenString
    // pairSockTok[message.data.peer] = tokenString
    let authStatus = await this.SafeFlow.networkAuthorisation(message.settings)
    // ws.send(JSON.stringify(authStatus))
    this.emit('auth-response', authStatus)
    // send back JWT
    // authStatus.jwt = tokenString
    // ws.send(JSON.stringify(authStatus))
  /* } else if (message.action === 'cloudauth') {
    // console.log('auth1')
    // does the username and password on the allow list?
    let allowPeers = JSON.parse(process.env.PEER_LIST)
    let authPeer = false
    for (let pID of allowPeers) {
      if (pID.peer === message.data.peer && pID.pw === message.data.password) {
        authPeer = true
      }
    }
    // is the peer already connected and authorised?
    // no peers connected and autherise
    let getAuth = Object.keys(pairSockTok)
    let numAuth = getAuth.length
    // can only be one token auth at same time
    if (jwtList.length > 0) {
      authPeer = false
    }
    // is the peer already connected?
    let alreadyConnect = pairSockTok[message.data.peer]
    let peerAuthed = pairSockTok[ws.id]
    if (authPeer === true && alreadyConnect === undefined) {
      // setup safeFLOW
      if (setFlow === false && alreadyConnect === undefined) {
        await peerListeners(ws)
      }
      // form token  (need to upgrade proper JWT)
      let tokenString = cryptmessage.randomBytes(64).toString('hex')
      jwtList.push(tokenString)
      // create socketid, token pair
      pairSockTok[ws.id] = tokenString
      pairSockTok[message.data.peer] = tokenString
      let authStatus = await HOP.networkAuthorisation(message.settings)
      // send back JWT
      authStatus.jwt = tokenString
      ws.send(JSON.stringify(authStatus))
    } else {
      let authFailStatus = {}
      authFailStatus.safeflow = true
      authFailStatus.type = 'auth'
      authFailStatus.auth = false
      ws.send(JSON.stringify(authFailStatus))
    }
  } */
  // need to check if cloud account is allow access to process message?
  // be good use of JWT TODO
  // valid jwt?
  /* let jwtStatus = true
  for (let pt of jwtList) {
    if (pt === message.jwt) {
      jwtStatus = true
    } else {
      jwtStatus = true
      /* let authFailStatus = {}
      authFailStatus.safeflow = true
      authFailStatus.type = 'auth'
      authFailStatus.auth = false
      ws.send(JSON.stringify(authFailStatus)) */
    // }
    // console.log('token status')
    // console.log(jwtStatus)
    /* if (jwtStatus === true) {

    } */
    
  }

  /**
  * input into safeFlow-ECS
  * @method newSafeflow
  *
  */
  newSafeflow = async function (message) {
    // send summary info that SafeFLow has received NXP bundle
    let ecsData = await this.SafeFlow.startFlow(message.data)
    let summaryECS = {}
    summaryECS.type = 'sf-summary'
    summaryECS.data = ecsData
    summaryECS.bbid = message.bbid
    this.bothSockets(JSON.stringify(summaryECS))
    // this.wsocket.send(JSON.stringify(summaryECS))
  }

  /**
  * input into safeFlow-ECS
  * @method updateSafeflow
  *
  */
  updateSafeflow = async function (message) {
    let ecsDataUpdate = await this.SafeFlow.startFlow(message.data)
  }

  /**
  * data in from Network  check SF strucutre and send to peer
  * @method networkSFpeerdata
  *
  */
  networkSFpeerdata = function (data) {
    // need to check structure TODO
    data.type = 'sf-networkdata'
    this.bothSockets(JSON.stringify(data))
  }

  /**
  * listen for outputs from SafeFlow
  * @method sfListeners
  *
  */
  sfListeners = async function () {
    // listenr for data back from ECS
    this.on('auth-response', (data) => {
      this.emit('sfauth', data)
    })
    this.SafeFlow.on('sf-displayEntity', (data) => {
      data.type = 'sf-newEntity'
      this.bothSockets(JSON.stringify(data))
      // this.wsocket.send(JSON.stringify(data))
    })
    // let deCount = this.SafeRoute.listenerCount('displayEntity')
    this.SafeFlow.on('sf-displayEntityRange', (data) => {
      data.type = 'sf-newEntityRange'
      this.bothSockets(JSON.stringify(data))
      // this.wsocket.send(JSON.stringify(data))
    })
    this.SafeFlow.on('sf-displayUpdateEntity', (data) => {
      data.type = 'sf-updateEntity'
      this.bothSockets(JSON.stringify(data))
      // this.wsocket.send(JSON.stringify(data))
    })
    this.SafeFlow.on('displayUpdateEntityRange', (data) => {
      data.type = 'sf-updateEntityRange'
      this.bothSockets(JSON.stringify(data))
      // this.wsocket.send(JSON.stringify(data))
    })
    this.SafeFlow.on('displayEmpty', (data) => {
      data.type = 'displayEmpty'
      this.bothSockets(JSON.stringify(data))
      // this.wsocket.send(JSON.stringify(data))
    })
    this.SafeFlow.on('updateModule', async (data, shellID, dataPrint) => {
      let moduleRefContract = this.liveLibrary.liveComposer.moduleComposer(data, 'update')
      // const savedFeedback = await this.holepunchLive.BeeData.savePubliclibrary(moduleRefContract)
      const updateComputeModule = await this.holepunchLive.BeeData.savePeerLibrary(moduleRefContract.data)
      // need to tell SafeFlow computeModule HASH has been created
      this.SafeFlow.emit('updatesaved-compute', updateComputeModule, shellID, dataPrint)
    })
    this.SafeFlow.on('storePeerResults', async (data) => {
      const checkResults = await this.holepunchLive.BeeData.saveHOPresults(data)
    })
  
    this.SafeFlow.on('checkPeerResults', async (data) => {
      const checkResults = await this.holepunchLive.BeeData.peerResults(data)
      this.resultsCallback(data, checkResults)
    })
  
    this.SafeFlow.on('kbledgerEntry', async (data) => {
      const savedFeedback = await this.holepunchLive.BeeData.saveKBLentry(data)
    })
  }

  /**
  * return results to Peer
  * @method resultsCallback
  *
  */
   resultsCallback =  function (entity, data) {
    // callbacks for datastores
    let resultMatch = {}
    if (data !== null) {
      resultMatch.entity = entity
      resultMatch.data = data
    } else {
      resultMatch.entity = entity
      resultMatch.data = false
    }
    this.SafeFlow.resultsFlow(resultMatch)
  }

}

export default SfRoute