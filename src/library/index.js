'use strict'
/**
*  library - routing
*
*
* @class LibraryRoute
* @package    LibraryRoute
* @copyright  Copyright (c) 2024 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import EventEmitter from 'events'
import LibraryManager from 'library-hop'

class LibraryRoute extends EventEmitter {

  constructor(Holepunch) {
    super()
    this.live = true
    this.libManager = new LibraryManager(Holepunch)
    this.liveHolepunch = Holepunch
    this.wsocket = {}
    this.wlist = []
    this.libraryListen()
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
  * listen messages from library manager
  * @method libraryListen
  *
  */
  libraryListen =  function () {
    this.libManager.on('libmessage', (data) => {
      this.bothSockets(data)
    })
    // message for SafeFlow
    this.libManager.on('libsafeflow', (data) => {
      this.emit('safeflow-query', data)
    })
    this.libManager.on('libsafeflow-update', (data) => {
      this.emit('safeflow-update', data)
    })
    // systems data for SafeFlow
    this.libManager.on('systemssafeflow', (data) => {
      this.emit('safeflow-systems', data)
    })
  }

}

export default LibraryRoute