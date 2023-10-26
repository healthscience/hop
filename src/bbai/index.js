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
    // console.log('hop--message action')
    // console.log(message)
    if (message.reftype.trim() === 'ignore' && message.type.trim() === 'bbai-reply') {
      if (message.action === 'question') {
        // send to NPL rules
        let replyData = await this.liveBBAI.nlpflow(message)
        // console.log('hop--beebee reply------')
        // console.log(replyData)
        replyData.bbid = message.bbid
        if (replyData.query === true) {
          // need to pass to SafeFlow
          this.emit('safeflow-query', replyData)
          let bbReply = {}
          bbReply.type = 'bbai-reply'
          bbReply.data = 'HOP' // replyData
          bbReply.bbid = message.bbid
          this.bothSockets(JSON.stringify(bbReply))
        } else {
          let bbReply = {}
          bbReply.type = 'bbai-reply'
          bbReply.action = replyData.type
          bbReply.data = replyData.text
          bbReply.bbid = message.bbid
          this.bothSockets(JSON.stringify(bbReply))
        }
      } else if (message.action === '') {
        console.log('from library  process file')
        // replyData = await this.liveBBAI.nlpflow(message)
      } else if (message.action === 'predict-future') {
        console.log('prediction PATH==============')
        // handover to the model
        let processFdata = await this.liveBBAI.managePrediction(message)
        // console.log('pass query on to SafeFlow')
        // console.log(processFdata)
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

}

export default BBRoute