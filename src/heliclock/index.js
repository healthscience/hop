'use strict'
/**
*  HeliClock - routing and datastore
*
* @class HeliRoute
* @package    HeliRoute
* @copyright  Copyright (c) 2026 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import EventEmitter from 'events'

class HeliRoute extends EventEmitter {

  constructor(context) {
    super()
    this.context = context
    this.heliclock = context.heliclock
    this.heliLocation = context.heliLocation
    this.holepunchLive = context.network
    this.wsocket = {}
    this.wlist = []
  }

  /**
  * pass on websocket
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
  * handle heliclock messages
  * @method heliPath
  *
  */
  heliPath = async function (message) {
    switch (message.action) {
      case 'birth-location-search':
        let locationQuery = message.data.town
        const locationBirth = await this.heliLocation.search(locationQuery);
        this.bothSockets(JSON.stringify({ type: 'heliclock', action: 'heliclock-location-birth', data: locationBirth }))
        break
      case 'HELI_CALIBRATE_PREVIEW':
        const sliderOldWorld = this.heliLocation.getHeliSignature(message.data.angle, message.data.dayAngle, message.data.orbits, message.data.lon, message.data.lat)
        this.bothSockets(JSON.stringify({ type: 'heliclock', action: 'heliclock-convert-oldworld', data: sliderOldWorld }))
        break
      case 'HELI_GENESIS_SAVE':
        const orbitSignature = await this.saveClock(message.data)
        this.bothSockets(JSON.stringify({ type: 'heliclcok', action: 'heli-orbit-signature', data: orbitSignature }))
        break
      case 'get-clock':
        const projections = await this.initHeliData()
        this.bothSockets(JSON.stringify({ type: 'heliclock', action: 'heliclock-set-projection', data: projections }))
        break
      case 'save-clock':
        await this.saveClock(message.data)
        break
      case 'add-projection':
        await this.addProjection(message.data)
        break
      default:
        console.warn('Unknown HeliClock action:', message.action)
    }
  }

  /**
  * initialize clock and get projections on start
  * @method initHeliData
  *
  */
  async initHeliData() {
      try {
          const clockState = await this.holepunchLive.BeeData.getHeliClock('peer/home');
          
          if (clockState) {
              // HYDRATE THE ENGINE: Tell HeliLocation to start the pulse
              this.heliLocation.activateSolarHeartbeat(clockState.value.data);
              
              // Return to UI
              return {
                  home: 'wait',
                  projections: await this.holepunchLive.BeeData.getHeliClockHistory()
              };
          }
          return null;
      } catch (err) {
          console.error('Failed to initialize HeliClock data', err);
      }
  }

  /**
  * save the current clock state
  * @method saveClock
  *
  */
  saveClock = async function (peerClock) {
    try {
      // need to create hash key
      let heliClock = {}
      heliClock.id = 'peer/home'
      heliClock.data = peerClock
      await this.holepunchLive.BeeData.saveHeliClock(heliClock)
      // get and tell beebee saved
      const clockState = await this.holepunchLive.BeeData.getHeliClock('peer/home')
      return clockState
    } catch (err) {
      console.error('Failed to save HeliClock state', err)
    }
  }

  /**
  * add a projection entry
  * @method addProjection
  *
  */
  addProjection = async function (entry) {
    try {
      let clockHash = {}
      let heliClock = {}
      heliClock.id = clockHash // form HASH of content
      heliClock.data = peerClock
      await this.holepunchLive.BeeData.saveHeliClock(heliClock)
      let projectionEntry = await this.holepunchLive.BeeData.getHeliClock(heliClock)
      
      // Notify UI
      let replyMessage = {
        type: 'heliclock',
        action: 'heliclock-projection-added',
        data: projectionEntry
      }
      this.bothSockets(JSON.stringify(replyMessage))
    } catch (err) {
      console.error('Failed to add projection', err)
    }
  }

}

export default HeliRoute
