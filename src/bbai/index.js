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
import util from 'util'
import EventEmitter from 'events'
import BbAi from 'beebee-ai'
import safeFlow from 'node-safeflow'

class BBRoute extends EventEmitter {

  constructor() {
    super()
    this.live = true
    this.liveBBAI = new BbAi()
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
    console.log('bee mssage in')
    console.log(message)
    if (message.reftype.trim() === 'ignore' && message.type.trim() === 'bbai-reply') {
      if (message.action === 'question') {
        // send to NPL rules
        let replyData = this.liveBBAI.nlpflow(message.data.text)
        console.log('beebee reply----------------------')
        console.log(replyData)
        // need to pass to HOP - via query builder
        this.emit('safeflow-query', replyData)
        // route to HOP
        let bbReply = {}
        bbReply.type = 'bbai-reply'
        bbReply.data = replyData
        bbReply.bbid = message.bbid
        this.bothSockets(JSON.stringify(bbReply))
        // ws.send(JSON.stringify(bbReply)
      } else if (message.action === 'future') {
        // send to routine for prediction or to chat interface to say CALE cannot help right now
        /* let futureData = liveBBAI.routineFuture()
        let caleFuture = {}
        caleFuture.type = 'cale-future'
        caleFuture.data = {}
        ws.send(JSON.stringify(futureData)) */
      }
    }
  }

}

export default BBRoute