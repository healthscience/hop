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

class BBRoute extends EventEmitter {

  constructor() {
    super()
    console.log('{{sf-route}}')
  }

  /**
  * toolkit ai messages
  * @method bbAI
  *
  */
   bbAI = async function () {
    // console.log('token status')
    // console.log(jwtStatus)
    if (message.reftype.trim() === 'ignore' && message.type.trim() === 'bbai') {
      if (message.action === 'question') {
        // send to CALE NLP path
        console.log('bbqq')
        console.log(message.data)
        let replyData = liveBBAI.nlpflow(message.data.text)
        let bbReply = {}
        bbReply.type = 'bbai-reply'
        bbReply.data = replyData
        ws.send(JSON.stringify(bbReply))
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