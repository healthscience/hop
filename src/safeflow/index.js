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
import SafeFlow from 'node-safeflow'

const HOP = new SafeFlow()
console.log('{{SafeFLOW-ECS}}')

class SfRoute extends EventEmitter {

  constructor() {
    super()
    console.log('{{sf-route}}')
  }

  /**
  * route message in
  * @method routeMessage
  *
  */
  messageRoute = async function () {
    if (message.action === 'selfauth') {
      this.authHOP()
    } else if (message.action === 'networkexperiment') {
      this.newSafeflow()
    } else if (message.action === 'updatenetworkexperiment') {
      this.updateSafeflow()
    }
  }

  /**
  * bring all the HOP part to life securely
  * @method safeflowECS
  *
  */
   authHOP = async function () {
    // secure connect to safeFLOW
    // let authStatus = await liveHOPflow.networkAuthorisation(message.settings)
    // OK with safeFLOW setup then bring peerDatastores to life
    // ws.send(JSON.stringify(authStatus))
    // await peerListeners(ws)
    let jwtList = []
    let authPeer = true
    let tokenString = cryptmessage.randomBytes(64).toString('hex')
    jwtList.push(tokenString)
    // create socketid, token pair
    pairSockTok[ws.id] = tokenString
    pairSockTok[message.data.peer] = tokenString
    let authStatus = await liveHOPflow.networkAuthorisation(message.settings)
    // send back JWT
    authStatus.jwt = tokenString
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
      let authStatus = await liveHOPflow.networkAuthorisation(message.settings)
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
  * @method newSsafeflow
  *
  */
  newSafeflow = async function (message) {
    // send summary info that HOP has received NXP bundle
    let ecsData = await liveHOPflow.startFlow(message.data)
    let summaryECS = {}
    summaryECS.type = 'ecssummary'
    summaryECS.data = ecsData
    // ws.send(JSON.stringify(summaryECS)
  }

  /**
  * input into safeFlow-ECS
  * @method updateSafeflow
  *
  */
  updateSafeflow = async function (message) {
    let ecsDataUpdate = await liveHOPflow.startFlow(message.data)
  }

}

export default SfRoute