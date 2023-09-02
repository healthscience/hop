'use strict'
/**
*  dml - routing
*
*
* @class DmlRoute
* @package    DmlRoute
* @copyright  Copyright (c) 2023 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import EventEmitter from 'events'
import DmlProtocol from 'hop-dml'

class DmlRoute extends EventEmitter {

  constructor(Holepunch) {
    super()
    this.holepunchLive = Holepunch
    this.dmlLive = new DmlProtocol(Holepunch)
    this.dmlListeners()
  }

  /**
  * route message in
  * @method routeMessage
  *
  */
  dmlMessage = async function (message) {
    if (message.action === 'proof-of-work') {
      // 
    } else if (message.action === 'dml-compute') {
      // 
    } else if (message.action === 'dml-complete') {
      //
    }
  }

  /**
  * pass on websocket to DML
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
  * listen for outputs from SafeFlow
  * @method dmlListeners
  *
  */
  dmlListeners = async function () {
    // listenr for data back from ECS
    this.on('dml-proof', (data) => {
      this.emit('share-knowledge', data)
    })
  }

}

export default DmlRoute