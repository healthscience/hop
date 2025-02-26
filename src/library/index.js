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
    // initial connection with warm peer
    this.libManager.on('complete-warmpeer', (pubkey) => {
      // pass on publick key of peer
      this.liveHolepunch.warmPeerPrepare(pubkey, false)
    })
    // invite topic for future reconnect update
    this.libManager.on('complete-topic-save', (data) => {
      let peerTopic = {}
      peerTopic.type = 'account'
      peerTopic.action = 'peer-share-topic'
      peerTopic.data = data
      this.wsocket.send(JSON.stringify(peerTopic))
    })
    // name match success inform bee
    this.libManager.on('complete-name-updatesave', (data) => {
      // inform beebee and peer name
      let peerNotify = {}
      peerNotify.type = 'account'
      peerNotify.action = 'network-peer-name'
      peerNotify.data = data
      this.wsocket.send(JSON.stringify(peerNotify))
      // write back to other peer
      this.liveHolepunch.topicSaveReturn(data)
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