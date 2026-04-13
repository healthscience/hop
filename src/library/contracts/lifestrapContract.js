'use strict'
/**
*  Prepare Lifestrap Contract
*
*
* @class LifestrapContract
* @package    HOP library 
* @copyright  Copyright (c) 2024 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import { EventEmitter } from 'events';
import { validateContract } from 'librarycomposer/src/validation/validationUtility.js';

class LifestrapContract extends EventEmitter {
  constructor(heliLive) {
    super();
    this.heliLive = heliLive;
  }

  LifestrapContractform(lifestrap) {
    const currentTime = this.heliLive ? this.heliLive.helistamp() : Date.now();
    const contract = {
      refcontract: 'lifestrap',
      concept: lifestrap.concept,
      space: { concept: 'mind' },
      computational: lifestrap.computational,
      time: {
        createTimestamp: currentTime,
        lastTimestamp: currentTime,
        frequencyCount: 0
      }
    };
    return validateContract('lifestrap', contract);
  }

  relationshipsBuilder(lifestrap, relationships) {
    lifestrap.value.computational.relationships = relationships;
    lifestrap.value.time.lastTimestamp = this.heliLive ? this.heliLive.helistamp() : Date.now();
    lifestrap.value.time.frequencyCount += 1;
    return lifestrap;
  }
}

export default LifestrapContract;
