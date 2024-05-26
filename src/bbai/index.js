'use strict'
/**
*  BBAI - routing
*
*
* @class BBRoute
* @package    BBRoute
* @copyright  Copyright (c) 2022 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import EventEmitter from 'events'
import BbAi from 'beebee-ai'

class BBRoute extends EventEmitter {

  constructor(Holepunch) {
    super()
    this.live = true
    this.holepunchLive = Holepunch
    this.liveBBAI = new BbAi(Holepunch)
    this.wsocket = {}
    this.wlist = []
    this.peerNetworklisten()
    this.listenBBresponse()
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
  * toolkit ai messages
  * @method bbAIpath
  *
  */
  bbAIpath = async function (message) {
    // console.log('HOP -- beebee path')
    // console.log(message)
    if (message.reftype.trim() === 'ignore' && message.type.trim() === 'bbai-reply') {
      if (message.action === 'question') {
        // send to NPL rules
        await this.liveBBAI.nlpflow(message)
      } else if (message.action === 'library') {
        // replyData = await this.liveBBAI.nlpflow(message)
      } else if (message.action === 'learn-agent-start') {
        await this.liveBBAI.beginAgents(message.data.model)
      } else if (message.action === 'learn-agent-stop') {
        this.liveBBAI.stopAgents(message.data.model)
      } else if (message.action === 'agent-task') {
        await this.liveBBAI.coordinationAgents(message)
      } else if (message.action === 'agent-network-task') {
        // start build DML evidence here???
        console.log('dml path')
        console.log(message)
        await this.liveBBAI.coordinationDML(message)
      } else if (message.action === 'predict-future') {
        // handover to the model
        let processFdata = await this.liveBBAI.managePrediction(message)
        this.emit('safeflow-query', processFdata)
        // route message via HOP out
        let bbReply = {}
        bbReply.type = 'bbai-future-summary'
        bbReply.data = processFdata
        bbReply.bbid = message.bbid
        this.bothSockets(JSON.stringify(bbReply))
      } 
    }
  }

  /**
  * listen for agent responses via beebee
  * @method listenBBresponse
  *
  */
  listenBBresponse = function () {
    this.liveBBAI.on('beebee-response', (replyData) => {
      if (replyData.query === true) {
          // need to pass to SafeFlow
          this.emit('safeflow-query', replyData)
          let bbReply = {}
          bbReply.type = 'bbai-reply'
          bbReply.data = 'HOP' // replyData
          bbReply.bbid = replyData.bbid
          this.bothSockets(JSON.stringify(bbReply))
      } else if (replyData.type === 'upload') {
        // this.emit('library-query', replyData)
        let bbReply = {}
        bbReply.type = 'upload'
        bbReply.action = replyData.type
        bbReply.data = replyData
        bbReply.bbid = replyData.bbid
        this.bothSockets(JSON.stringify(bbReply))
      } else if (replyData.type === 'library-peerlibrary') {
        // this.emit('library-query', replyData)
        let bbReply = {}
        bbReply.type = 'bbai-reply'
        bbReply.action = replyData.type
        bbReply.data = replyData
        bbReply.bbid = replyData.bbid
        this.bothSockets(JSON.stringify(bbReply))        
      } else {
        let bbReply = {}
        bbReply.type = 'bbai-reply'
        bbReply.action = replyData.type
        bbReply.data = replyData.text
        bbReply.bbid = replyData.bbid
        this.bothSockets(JSON.stringify(bbReply))
      }
    })
  }

  /**
  * listen for messages / data from peer network
  * @method peerNetworklisten
  *
  */
  peerNetworklisten = function (messagedata) {
    this.liveBBAI.on('peer-bb-direct', (data) => {
      if (data.action === 'chart') {
        this.bothSockets(JSON.stringify(data))
      } else if (data?.task === 'cale-evolution' || data.action === 'cale-evolution' || data.context?.task === 'cale-evolution') {
        this.bothSockets(JSON.stringify(data))
      } else if (data?.task === 'cale-gpt4all' || data.action === 'cale-gpt4all') {
        this.bothSockets(JSON.stringify(data))
      } else {
        console.log(data)
        this.bothSockets(JSON.stringify(data))
      }
    })
  }

}

export default BBRoute