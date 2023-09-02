'use strict'
/**
*  hyperspace interface
*
*
* @class HyperspaceInterface
* @package    HyperspaceInterface
* @copyright  Copyright (c) 2022 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import EventEmitter from 'events'
import HyperspaceHOP from 'hyperspace-hop'

class HyperspaceWorker extends EventEmitter {

  constructor() {
    super()
    console.log('{{hyperspace-route}}')
    this.liveHyperspace = new HyperspaceHOP()
  }

}

export default HyperspaceWorker    