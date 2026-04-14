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

  constructor(contextAgents) {
    console.log('lib route')
    super()
    this.context = contextAgents
    this.live = true
    this.libManager = new LibraryManager(contextAgents)
    this.holepunchLive = contextAgents.network
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
  libraryListen = async function () {
    this.libManager.on('lifestrap-genesis', (data) => {
      //  bring to be  key ids, life-strap, dialogue, make be resonAgent and its neat-hop  But get lifestap key back first quickly
      this.context.bbai.liveBBAI.bringToBe('woken', data.data)
      // keep beebee in bentoboxds 
      this.wsocket.send(JSON.stringify(data))
    })

    this.libManager.on('lifestrap-awaken', (data) => {
      //  bring to be  key ids, life-strap, dialogue, make be resonAgent and its neat-hop  But get lifestap key back first quickly
      console.log('lib route awaken', data)
      if (data.data.length > 0) {
        this.context.bbai.liveBBAI.bringToBe('woken', data.data[0])
      }
      // keep beebee in bentoboxds 
      this.wsocket.send(JSON.stringify(data))
    })

    this.libManager.on('libmessage', (data) => {
      this.bothSockets(data)
    })
    // initial connection with warm peer
    this.libManager.on('complete-warmpeer', async (pubkey) => {
      // get latest list and pass on to holepunch-hop
      let updatePeersNetwork = await this.holepunchLive.BeeData.getPeersHistory('peer')
      this.holepunchLive.Peers.latestPeerNetwork(updatePeersNetwork)
      // pass on publick key of peer
      this.holepunchLive.warmPeerPrepare(pubkey, false)
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
      holepunchLive.topicSaveReturn(data)
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