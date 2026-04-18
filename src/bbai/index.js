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

  constructor(wiringIn) {
    super()
    this.wiring = wiringIn
    this.live = true
    this.holepunchLive = this.wiring.network
    this.liveBesearch = this.wiring.besearch
    this.heliclock = this.wiring.heliclock
    this.liveBBAI = new BbAi(this.wiring)
    this.wsocket = {}
    this.wlist = []
    this.peerNetworklisten()
    this.listenBBresponse()
    this.trinity = { physics: null, language: null, pattern: null };
  }

  /**
   * bring three resonAgents to be
   * @method igniteTrinity
   */
  igniteTrinity = async function() {
    // 1. Check if the Synapse is ready
    if (!this.wiring.safeflow) {
      throw new Error("Cannot ignite Trinity: safeFLOW synapse not found.");
    }

    // 2. Birth the Cells (resonAgents)
    // These are initialized within the Synapse's scope
    this.trinity.physics = await this.wiring.resonagents.birthAgent('physics', 'live');

    // 3. Direct Feed (Zero-Draft Routing)
    // We bypass the global brain for high-speed sensor data
    this.wiring.safeflow.on('biomarker_tick', (data) => {
      // The Synapse feeds the Cell directly
      this.wiring.resonagents.syncLedger(data); 
    });
    console.log("[Synapse] Trinity ignited and short-circuited to safeFLOW.");
  }

  /**
  * toolkit ai messages
  * @method startBeeBeeAgent
  *
  */
  startBeeBeeAgent = async function () {
    this.liveBBAI.startBeeBee()
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
   * 
   * @method bringToBePath
   * 
  */
  bringToBePath = async function () {
    this.liveBBAI.bringToBe()
  }

  /**
  * toolkit ai messages
  * @method bbAIpath
  *
  */
  bbAIpath = async function (message) {
    if (message.reftype.trim() === 'ignore' && message.type.trim() === 'bbai-reply') {
      if (message.action === 'question') {
        // send to NPL rules
        await this.liveBBAI.beebeeFlow(message)
      } else if (message.action === 'library') {
        await this.liveBBAI.beebeeFlow(message)
      } else if (message.action === 'learn-agent-start') {
        await this.liveBBAI.agentsCMP.beginAgents(message.data)
      } else if (message.action === 'learn-agent-stop') {
        this.liveBBAI.agentsCMP.stopAgents(message.data)
      } else if (message.action === 'agent-task') {
        await this.liveBBAI.agentsCMP.coordinationAgents(message)
      } else if (message.action === 'agent-network-task') {
        // start build DML evidence here???
        await this.liveBBAI.agentsCMP.coordinationDML(message)
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
  * message into beeebee
  * @method messageBeeBee
  *
  */
  messageBeeBee = function (message) {
    this.liveBBAI('safeflow-success', message.data) 
  }

  /**
  * listen for agent responses via beebee
  * @method listenBBresponse
  *
  */
  listenBBresponse = function () {

    this.liveBBAI.on('ls-pattern', (pattern) => {
      let bbReply = {}
      bbReply.type = 'bbai-reply'
      bbReply.action = 'ls-pattern'
      bbReply.data = pattern
      bbReply.bbid = ''
      this.wsocket.send(JSON.stringify(bbReply))
    })

    this.liveBBAI.on('beebee-response-stream', (replyData) => {
      let bbReply = {}
      bbReply.type = 'bbai-stream-reply'
      bbReply.data = replyData
      bbReply.bbid = replyData.bbidid
      this.bothSockets(JSON.stringify(bbReply))
    })

    this.liveBBAI.on('beebee-response', (replyData) => {
      if (replyData.query === true) {
        // need to pass to SafeFlow
        this.emit('safeflow-query', replyData)
        let bbReply = {}
        bbReply.type = 'bbai-reply'
        bbReply.data = 'HOP' // replyData
        bbReply.bbid = replyData.bbid
        this.bothSockets(JSON.stringify(bbReply))
      } else if (replyData.type === 'oracle') {
        this.bothSockets(JSON.stringify(replyData))
      } else if (replyData.type === 'upload') {
        let bbReply = {}
        bbReply.type = 'upload'
        bbReply.action = replyData.type
        bbReply.data = replyData
        bbReply.bbid = replyData.bbid
        this.bothSockets(JSON.stringify(bbReply))
      } else if (replyData.type === 'library-peerlibrary') {
        let bbReply = {}
        bbReply.type = 'bbai-reply'
        bbReply.action = replyData.type
        bbReply.data = replyData
        bbReply.bbid = replyData.bbid
        this.bothSockets(JSON.stringify(bbReply))
      } else if (replyData.type === 'query-no-data') {
        let bbReply = {}
        bbReply.type = 'bbai-reply'
        bbReply.action = 'no-data'
        bbReply.data = { text: 'No data for query'}
        bbReply.bbid = replyData.bbid
        this.bothSockets(JSON.stringify(bbReply))        
      } else if (replyData.type === 'bbai-reply' && replyData.action === 'npl-reply') {
        console.log('gbeeebee lens reply')
        // use a template for beebee to deliver support / helpful info.
        let beebeeInfo = {} // this.beebeeTempate('lens', replyData.data)
        let bbReply = {}
        bbReply.type = 'bbai-reply'
        bbReply.action = 'npl-reply'
        bbReply.task = replyData.task
        bbReply.data = replyData.data // TODO UPdate to beebeeInfo  extraction plus beebee message for diaglouge
        bbReply.bbid = replyData.bbid
        this.bothSockets(JSON.stringify(bbReply))
      } else {
        let bbReply = {}
        bbReply.type = 'bbai-reply'
        bbReply.action = replyData.type
        bbReply.data = replyData.text || replyData.data
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
  peerNetworklisten = function () {
    this.liveBBAI.on('peer-bb-direct', (data) => {
      if (data.action === 'chart') {
        this.bothSockets(JSON.stringify(data))
      } else if (data?.task === 'cale-evolution' || data.action === 'cale-evolution' || data.context?.task === 'cale-evolution') {
        this.bothSockets(JSON.stringify(data))
      } else if (data?.task === 'cale-gpt4all' || data.action === 'cale-gpt4all') {
        this.bothSockets(JSON.stringify(data))
      } else {
        this.bothSockets(JSON.stringify(data))
      }
    })

    this.liveBBAI.on('peer-bb-models', (data) => {
      this.bothSockets(JSON.stringify(data))
    })
  }

}

export default BBRoute