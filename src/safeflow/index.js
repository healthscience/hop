'use strict'
/**
*  safeflow - routing
*
*
* @class SfRoute
* @package    SafeflowRoute
* @copyright  Copyright (c) 2024 James Littlejohn
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
  * inform SF on systems this peer uses
  * @method setSafeflowSystems
  *
  */
  setSafeflowSystems = async function (message) {
    let setSystems = await this.SafeFlow.setSystemsStart(message)
    let summarySFsystems = {}
    summarySFsystems.type = 'sf-systems'
    summarySFsystems.data = setSystems
    summarySFsystems.bbid = message.bbid
    this.bothSockets(JSON.stringify(summarySFsystems))
  }

  /**
  * input into safeFlow-ECS
  * @method updateSafeflow
  *
  */
  updateSafeflow = async function (message) {
    // need to update module contracts, compute and visualise controls and settings most likely
    await this.SafeFlow.startFlow(message.data)
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
    this.on('start-systems', (data) => {
      // ask library for systems
      this.emit('library-systems')
    })
    this.on('auth-response', (data) => {
      this.emit('sfauth', data)
    })
    this.SafeFlow.on('sf-displayEntity', (data) => {
      data.type = 'sf-newEntity'
      this.bothSockets(JSON.stringify(data))
    })
    this.SafeFlow.on('sf-displayEntityRange', (data) => {
      data.type = 'sf-newEntityRange'
      this.bothSockets(JSON.stringify(data))
    })
    this.SafeFlow.on('sf-displayUpdateEntity', (data) => {
      data.type = 'sf-updateEntity'
      this.bothSockets(JSON.stringify(data))
    })
    this.SafeFlow.on('displayUpdateEntityRange', (data) => {
      data.type = 'sf-updateEntityRange'
      this.bothSockets(JSON.stringify(data))
    })
    this.SafeFlow.on('displayEmpty', (data) => {
      data.type = 'displayEmpty'
      this.bothSockets(JSON.stringify(data))
    })
    this.SafeFlow.on('updateModule', async (data, shellID, dataPrint) => {
      let moduleRefContract = this.liveLibrary.liveComposer.moduleComposer(data, 'update')
      const updateComputeModule = await this.holepunchLive.BeeData.savePeerLibrary(moduleRefContract)
      // need to tell SafeFlow computeModule HASH has been created
      this.SafeFlow.emit('updatesaved-compute', updateComputeModule, shellID, dataPrint)
    })
    this.SafeFlow.on('storePeerResults', async (data) => {
      const checkResults = await this.holepunchLive.BeeData.saveHOPresults(data)
    })
  
    this.SafeFlow.on('checkPeerResults', async (data) => {
      const checkResults = await this.holepunchLive.BeeData.peerResultsItem(data)
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