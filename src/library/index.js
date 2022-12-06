'use strict'
/**
*  library - routing
*
*
* @class LibraryRoute
* @package    LibraryRoute
* @copyright  Copyright (c) 2022 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import util from 'util'
import EventEmitter from 'events'
import LibComposer from 'librarycomposer'

class LibraryRoute extends EventEmitter {

  constructor(HyperSpace) {
    super()
    this.live = true
    this.liveComposer = new LibComposer()
    this.liveHyperspace = HyperSpace
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
  * process messages going to library
  * @method library
  *
  */
    libraryPath = async function (message) {
    // console.log('library')
    // console.log(o)
    // library routing
    if (message.reftype.trim() === 'convert-csv-json') {
      // console.log('csv jon start')
      // console.log(o)
      // save protocol original file save and JSON for HOP
      if (message.data.source === 'local') {
        let fileInfo = await this.liveHyperspace.hyperdriveFolderFiles(o)
        let fileFeedback = {}
        fileFeedback.success = true
        fileFeedback.path = fileInfmessage.filename
        fileFeedback.columns = fileInfmessage.header.splitwords
        let storeFeedback = {}
        storeFeedback.type = 'file-save'
        storeFeedback.action = 'library'
        storeFeedback.data = fileFeedback
        this.bothSockets(JSON.stringify(storeFeedback))
        // this.wsocket.send(JSON.stringify(storeFeedback))
        // await liveParser.localFileParse(o, ws)
      } else if (message.data.source === 'web') {
        // liveParser.webFileParse(o, ws)
      }
    } else if (message.reftype.trim() === 'sync-nxp-data') {
      console.log('request to sync data for a contract')
      console.log(message.data)
      // query hopresults per key
      const dataResults = this.liveHyperspace.peerResults(message.data.uuid)
      // then replicate part of hopResults hyerbee with the peer, first make hopresult hyperbee replicatabl?
      // route to peerstore to replicate
    } else if (message.reftype.trim() === 'save-json-json') {
        if (message.data.source === 'local') {
          // await liveParser.localJSONfile(o, ws)
        } else if (message.data.source === 'web') {
          // liveParser.webJSONfile(o, ws)
        }
    } else if (message.reftype.trim() === 'save-sqlite-file') {
      let fileInfo = await this.liveHyperspace.hyperdriveFilesave(message.data.type, message.data.name, message.data.path)
      let fileFeedback = {}
      fileFeedback.success = true
      fileFeedback.path = fileInfmessage.filename
      let storeFeedback = {}
      storeFeedback.type = 'file-save'
      storeFeedback.action = 'library'
      storeFeedback.data = fileFeedback
      this.bothSockets(JSON.stringify(storeFeedback))
      // this.wsocket.send(JSON.stringify(storeFeedback))
    } else if (message.reftype.trim() === 'viewpublickey') {
      // two peer syncing reference contracts
      // const pubkey = this.liveHyperspace. // peerStoreLive.singlePublicKey('', callbackKey)
    } else if (message.reftype.trim() === 'openlibrary') {
      // two peer syncing reference contracts
      // const pubkey = this.liveHyperspace. // peerStoreLive.openLibrary(message.data, callbackOpenLibrary)
    } else if (message.reftype.trim() === 'keymanagement') {
      // this.liveHyperspace.
      // peerStoreLive.keyManagement(callbackKey)
    } else if (message.reftype.trim() === 'peer-add') {
      // peerStoreLive.addPeer(message.data, callbackPeerNetwork)
    } else if (message.reftype.trim() === 'warm-peers') {
      // this.liveHyperspace.
      // peerStoreLive.listWarmPeers(callbackWarmPeers, callbacklibrary)
    } else if (message.reftype.trim() === 'addpubliclibraryentry') {
      // take the ID of nxp selected to added to peers own public library
      let addPubRefc = await this.liveHyperspace.publicLibraryAddentry(message.data)
      this.callbackPlibraryAdd(addPubRefc)
    } else if (message.reftype.trim() === 'removetemppubliclibrary') {
      // remove temp peers friends library
      // this.liveHyperspace.
      // peerStoreLive.publicLibraryRemoveTempNL(message.data, 'temp')
    } else if (message.reftype.trim() === 'replicatekey') {
      // two peer syncing public reference contracts
      let repDataStatus = await this.liveHyperspace.replicatePubliclibrary(message.publickey)
      this.callbackReplicatereceive(repDataStatus)
    } else if (message.reftype.trim() === 'view-replicatelibrary') {
      let repData = await this.liveHyperspace.getReplicatePublicLibrary(message.publickey)
      this.callbackReplicatelibrary(repData)
    } else if (message.reftype.trim() === 'publiclibrary') {
      // await this.liveHyperspace.getPublicLibrary('contracthash')
      let publibData = await this.liveHyperspace.getPublicLibraryRange()
      await this.liveHyperspace.getPublicLibraryLast()
      this.callbacklibrary(publibData)
    } else if (message.reftype.trim() === 'privatelibrary') {
      let contractData = await this.liveHyperspace.getPeerLibraryRange()
      this.callbackPeerLib(contractData)
    } else if (message.reftype.trim() === 'remove-nxp') {
      console.log('remove nxp from start ')
      let removeNXPdashboard = await this.liveHyperspace.deleteRefcontPeerlibrary(message.data)
      this.callbackNXPDelete(removeNXPdashboard)
    } else if (message.reftype.trim() === 'datatype') {
      // query peer datastore or save dataatype ref contract
      if (message.action === 'GET') {
        const datatypeRC = await this.liveHyperspace.getPublicLibrary(message.data)
        this.callbackDatatype(datatypeRC)
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await this.liveHyperspace.savePubliclibrary(o)
        this.bothSockets(JSON.stringify(saveFeedback))
        // this.wsocket.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'compute') {
      // query peer hypertrie for datatypes
      if (message.action === 'GET') {
        const datatypeRC = await this.liveHyperspace.getPublicLibrary(message.data)
        this.callbackDatatype(datatypeRC)
        // peerStoreLive.peerGETRefContracts('compute', callback)
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await this.liveHyperspace.savePubliclibrary(o)
        this.bothSockets(JSON.stringify(saveFeedback))
        // this.wsocket.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'units') {
      // query peer hypertrie for Units
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('units', callback)
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await this.liveHyperspace.savePubliclibrary(o)
        this.bothSockets(JSON.stringify(saveFeedback))
        // this.wsocket.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'packaging') {
      // query peer hypertrie for
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('packaging', callback)
      } else {
        // save a new refContract
        // const savedFeedback = // peerStoreLive.libraryStoreRefContract(o)
        // this.wsocket.send(JSON.stringify(savedFeedback))
        const newRefContract = message.refContract
        let saveFeedback = await this.liveHyperspace.savePubliclibrary(o)
        this.bothSockets(JSON.stringify(saveFeedback))
        // this.wsocket.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'visualise') {
      // query peer hypertrie for
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('visualise', callback)
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await this.liveHyperspace.savePubliclibrary(o)
        this.bothSockets(JSON.stringify(saveFeedback))
        // this.wsocket.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'experiment') {
      // query peer hypertrie for
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('experiment', callback)
      } else {
        // save a new refContract
        // const savedFeedback = // peerStoreLive.libraryStoreRefContract(o)
        this.bothSockets(JSON.stringify(savedFeedback))
        // this.wsocket.send(JSON.stringify(savedFeedback))
      }
    } else if (message.reftype.trim() === 'newexperimentmodule') {
      // a new genesis network experiment to store to network library
      let moduleGenesisList = []
      let moduleGenesisExpanded = []
      let newModCount = message.data.length
      for (let mh of message.data) {
        const moduleRefContract = this.liveComposer.liveComposer.moduleComposer(mh, '')
        const moduleRefContractReady = JSON.stringify(moduleRefContract)
        const savedFeedback = await this.liveHyperspace.savePubliclibrary(moduleRefContract)
        moduleGenesisList.push(savedFeedback.key)
        // stand key value format or query and get back ref contract double check TODO
        let moduleContract = {}
        moduleContract.key = savedFeedback.key
        moduleContract.value = savedFeedback.contract
        moduleGenesisExpanded.push(moduleContract) // .contract)
        newModCount--
      }
      if (newModCount === 0) {
        // aggregate all modules into exeriment contract
        let genesisRefContract = this.liveComposer.liveComposer.experimentComposerGenesis(moduleGenesisList)
        // double check they are created
        const savedFeedback = await this.liveHyperspace.savePubliclibrary(genesisRefContract)
        savedFeedback.expanded = moduleGenesisExpanded
        this.bothSockets(JSON.stringify(savedFeedback))
        // this.wsocket.send(JSON.stringify(savedFeedback))
      }
    } else if (message.reftype.trim() === 'joinexperiment') {
      let moduleJoinedList = []
      let moduleJoinedExpanded = []
      let newModCount = message.data.exp.modules.length
      // for each module in experiment, add peer selections
      // loop over list of module contract to make genesis ie first
      for (let mh of message.data.exp.modules) {
        // prepare new modules for this peer  ledger
        let peerModules = {}
        // look up module template genesis contract
        if (mh.value.infmessage.moduleinfmessage.name === 'question') {
          peerModules.type = 'question'
          peerModules.question = mh.value.infmessage.question
        } else if (mh.value.infmessage.moduleinfmessage.name === 'data') {
          peerModules.type = 'data'
          peerModules.data = message.data.options.data
        } else if (mh.value.infmessage.moduleinfmessage.name === 'compute') {
          peerModules.type = 'compute'
          peerModules.compute = mh.value.infmessage.refcont
          peerModules.controls = message.data.options.compute
          peerModules.settings = message.data.options.visualise
          } else if (mh.value.infmessage.moduleinfmessage.name === 'visualise') {
          peerModules.type = 'visualise'
          peerModules.visualise = mh.value.infmessage.refcont
          peerModules.settings = message.data.options.visualise
        }
        let moduleRefContract = this.liveComposer.liveComposer.moduleComposer(peerModules, 'join')
        const savedFeedback = await this.liveHyperspace.savePeerLibrary(moduleRefContract)
        moduleJoinedList.push(savedFeedback.key)
        // form key value refcont structure
        let moduleKeyValue = {}
        moduleKeyValue.key = savedFeedback.key
        moduleKeyValue.value = savedFeedback.contract
        moduleJoinedExpanded.push(moduleKeyValue)
        newModCount--
      }
      // check all modules are present and create peers network refcont joined
      if (newModCount === 0) {
        // aggregate all modules into exeriment contract
        // double check they are created
        let joinRefContract = this.liveComposer.liveComposer.experimentComposerJoin(moduleJoinedList)
        const savedFeedback = await this.liveHyperspace.savePeerLibrary(joinRefContract)
        savedFeedback.expanded = moduleJoinedExpanded
        this.bothSockets(JSON.stringify(savedFeedback))
        // this.wsocket.send(JSON.stringify(savedFeedback))
      }
    } else if (message.reftype.trim() === 'genesisexperiment') {
      let genesisRefContract = this.liveComposer.liveComposer.experimentComposerGenesis(message.data)
      const savedFeedback = await this.liveHyperspace.savePeerLibrary(genesisRefContract)
      this.bothSockets(JSON.stringify(savedFeedback))
      // this.wsocket.send(JSON.stringify(savedFeedback))
    } else if (message.reftype.trim() === 'kbid') {
      // query peer hypertrie for
      if (message.action === 'GET') {
        kbidStoreLive.peerGETkbids('kbid', callback)
      } else {
        // save a new refContract
        const savedFeedback = kbidStoreLive.peerStoreKBIDentry(o)
        this.bothSockets(JSON.stringify(savedFeedback))
        // this.wsocket.send(JSON.stringify(savedFeedback))
      }
    } else if (message.action === 'extractexperimentmodules') {
      let joinExpDisplay = {}
      joinExpDisplay.type = 'extractexperimentmodules'
      joinExpDisplay.data = this.liveComposer.liveRefcontUtility.extractData(message.data.modules, 'data')
      joinExpDisplay.compute = this.liveComposer.liveRefcontUtility.extractCompute(message.data.modules, 'compute')
      joinExpDisplay.visualise = this.liveComposer.liveRefcontUtility.extractVisualise(message.data.modules, 'visualise')
      // look up option contracts for each ref contract type
      let dataOptions = []
      for (let optionD of joinExpDisplay.data) {
        const refcontract = this.liveComposer.liveRefcontUtility.refcontractLookup(optionD.option.key, joinExpDisplay.data)
        dataOptions.push(refcontract)
      }
      let computeOptions = []
      for (let optionD of joinExpDisplay.compute) {
        const refcontract = this.liveComposer.liveRefcontUtility.refcontractLookup(optionD.option.key, joinExpDisplay.compute)
        computeOptions.push(refcontract)
      }
      let visOptions = []
      for (let optionD of joinExpDisplay.visualise) {
        const refcontract = this.liveComposer.liveRefcontUtility.refcontractLookup(optionD.option.key, joinExpDisplay.visualise)
        visOptions.push(refcontract)
      }
      let experimentOptions = {}
      experimentOptions.data = dataOptions
      experimentOptions.compute = computeOptions
      experimentOptions.visualise = visOptions
      joinExpDisplay.options = experimentOptions
      this.bothSockets(JSON.stringify(joinExpDisplay))
      // this.wsocket.send(JSON.stringify(joinExpDisplay))
    } else if (message.reftype.trim() === 'module') {
      // query peer hypertrie
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('module', callback)
      } else {
        // save a new refContract
        const savedFeedback = this.liveHyperspace.savePeerLibrary(o)
        this.bothSockets(JSON.stringify(savedFeedback))
        // this.wsocket.send(JSON.stringify(savedFeedback))
      }
    } else if (message.reftype.trim() === 'moduletemp') {
      // create new temp modules for new experiment
      let modCount = 1
      let moduleHolder = []
      for (const mc of message.data) {
        const prepareModule = this.liveComposer.liveComposer.moduleComposer(mc, '')
        let moduleContainer = {}
        moduleContainer.name = prepareModule.contract.concept.type
        moduleContainer.id = modCount
        moduleContainer.refcont = prepareModule.hash
        moduleHolder.push(moduleContainer)
        modCount++
      }
      let moduleTempData = {}
      moduleTempData.type = 'modulesTemp'
      moduleTempData.data = moduleHolder
      this.bothSockets(JSON.stringify(moduleTempData))
      // this.wsocket.send(JSON.stringify(moduleTempData))
    } else if (message.reftype.trim() === 'newmodules') {
      let moduleRefContract = this.liveComposer.liveComposer.moduleComposer(message.data, 'join')
      const savedFeedback = this.liveHyperspace.savePeerLibrary(moduleRefContract)
      this.bothSockets(JSON.stringify(savedFeedback))
      // this.wsocket.send(JSON.stringify(savedFeedback))
    } else if (message.reftype.trim() === 'newlifeboard') {
      let lifeboardRefContract = this.liveComposer.liveComposer.lifeboardComposer(message.data, 'new')
      // const saveLB = this.liveHyperspace.saveLifeboard() // peerStoreLive.lifeboardStoreRefContract(lifeboardRefContract)
      this.bothSockets(JSON.stringify(saveLB))
      // this.wsocket.send(JSON.stringify(saveLB))
    } else if (message.reftype.trim() === 'addlifeboard') {
      let lifeboardMember = this.liveComposer.liveComposer.lifeboardComposer(message.data, 'member')
      // const saveLBmember = this.liveHyperspace.saveLifeboard // peerStoreLive.lifeboardStoreRefContract(lifeboardMember)
      this.bothSockets(JSON.stringify(saveLBmember))
      // this.wsocket.send(JSON.stringify(saveLBmember))
    } else if (message.reftype.trim() === 'peerLifeboard') {
      // this.liveHyperspace.
      // peerStoreLive.peerGETLifeboards('all', callbackLifeboard)
    } else {
      console.log('network library no match')
    }
  }


  /**
  * bentobox info gathering
  * @method bentoPath
  */
   bentoPath = async function (o) {
    if (o.reftype.trim() === 'bentospace') {
    // console.log('bento space  what sub action?')
    // console.log(o)
      if (o.action.trim() === 'save-position') {
        // liveHyperspace.
        let bentospace = await this.liveHyperspace.saveBentospace(o.data)
        this.callbackBentospace(bentospace)
      } else if (o.action.trim() === 'list-position') {
        // liveHyperspace.
        let bbspace = await this.liveHyperspace.getBentospace()
        this.callbackListBentospace(bbspace)
      } else {
        console.log('no action bentospace')
      }
    }
  }

  /**
  * call back for data calls
  * @method callbackKey
  */
  callbackKey = async function () {
    let pubkeyData = {}
    pubkeyData.type = 'publickey'
    pubkeyData.pubkey = data
    this.bothSockets(JSON.stringify(pubkeyData))
    // this.wsocket.send(JSON.stringify(pubkeyData))
  }

  /**
  * call back for data calls
  * @method callbackOpenLibrary
  */
  callbackOpenLibrary = function (data) {
    let pubkeyData = {}
    pubkeyData.type = 'open-library'
    pubkeyData.data = data
    this.bothSockets(JSON.stringify(pubkeyData))
    // this.wsocket.send(JSON.stringify(pubkeyData))
  }

  /**
  * call back
  * @method 
  */
  callbackPeerNetwork = function (data) {
    let peerNData = {}
    peerNData.type = 'new-peer'
    peerNData.data = data
    this.bothSockets(JSON.stringify(peerNData))
    // this.wsocket.send(JSON.stringify(peerNData))
  }

  /**
  * call back
  * @method 
  */
   callbackWarmPeers = function (data) {
    let peerNData = {}
    peerNData.type = 'warm-peers'
    peerNData.data = data
    this.bothSockets(JSON.stringify(peerNData))
    // this.wsocket.send(JSON.stringify(peerNData))
  }


  /**
  * return an individual ref contract datatype
  * @method 
  */
  callbackDatatype = function (data) {
    let libraryData = {}
    libraryData.type = 'datatype-rc'
    libraryData.data = data
    this.bothSockets(JSON.stringify(libraryData))
  }

  /**
  * call back
  * @method callbacklibrary
  */
  callbacklibrary = function (data) {
    // pass to sort data into ref contract types
    console.log('public back ')
    let libraryData = {}
    libraryData.data = 'contracts'
    libraryData.type = 'publiclibrary'
    const segmentedRefContracts = this.liveComposer.liveRefcontUtility.refcontractSperate(data)
    libraryData.referenceContracts = segmentedRefContracts
    // need to split for genesis and peer joined NXPs
    const nxpSplit = this.liveComposer.liveRefcontUtility.experimentSplit(segmentedRefContracts.experiment)
    libraryData.splitExperiments = nxpSplit
    // look up modules for this experiments
    libraryData.networkExpModules = this.liveComposer.liveRefcontUtility.expMatchModuleGenesis(libraryData.referenceContracts.module, nxpSplit.genesis)
    libraryData.networkPeerExpModules = this.liveComposer.liveRefcontUtility.expMatchModuleJoined(libraryData.referenceContracts.module, nxpSplit.joined)
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }

  /**
  * call back
  * @method 
  */
  callbackPlibraryAdd = function (data) {
    let libraryData = {}
    libraryData.data = data
    libraryData.type = 'publiclibraryaddcomplete'
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }

  /**
  * call back
  * @method 
  */
  callbackReplicatelibrary = function (data) {

    // pass to sort data into ref contract types
    libraryData = {}
    libraryData.data = 'contracts'
    libraryData.type = 'replicatedata-publiclibrary'
    const segmentedRefContracts = this.liveComposer.liveRefcontUtility.refcontractSperate(data)
    libraryData.referenceContracts = segmentedRefContracts
    // need to split for genesis and peer joined NXPs
    const nxpSplit = this.liveComposer.liveRefcontUtility.experimentSplit(segmentedRefContracts.experiment)
    libraryData.splitExperiments = nxpSplit
    // look up modules for this experiments
    libraryData.networkExpModules = this.liveComposer.liveRefcontUtility.expMatchModuleGenesis(libraryData.referenceContracts.module, nxpSplit.genesis)
    libraryData.networkPeerExpModules = this.liveComposer.liveRefcontUtility.expMatchModuleJoined(libraryData.referenceContracts.module, nxpSplit.joined)
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }

  /**
  * call back
  * @method 
  */
  callbackReplicatereceive = function (data) {
    console.log('repliate feedvack peerlink')
    let peerRdata = {}
    peerRdata.type = 'replicate-publiclibrary'
    peerRdata.data = data
    this.bothSockets(JSON.stringify(peerRdata))
    // this.wsocket.send(JSON.stringify(peerRdata))
  }

  /**
  * call back
  * @method 
  */
  callbackLifeboard = function (data) {
    // pass to sort data into ref contract types
    let libraryData = {}
    libraryData.data = 'contracts'
    libraryData.type = 'peerlifeboard'
    libraryData.lifeboard = data
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }

  /**
  * call back
  * @method 
  */
  callbackBentospace = function (data) {
    // pass to sort data into ref contract types
    let blibraryData = {}
    blibraryData.type = 'bentospaces'
    blibraryData.data = data
    this.bothSockets(JSON.stringify(blibraryData))
    // this.wsocket.send(JSON.stringify(blibraryData))
  }

  /**
  * call back
  * @method 
  */
  callbackListBentospace = function (data) {
    // pass to sort data into ref contract types
    let blibraryData = {}
    blibraryData.type = 'bentospaces-list'
    blibraryData.data = data
    this.bothSockets(JSON.stringify(blibraryData))
    // this.wsocket.send(JSON.stringify(blibraryData))
  }

  /**
  * call back
  * @method 
  */
  callbackNXPDelete  = function (data) {
    // pass to sort data into ref contract types
    console.log('peerprivate delete')
    console.log(data)
    let libraryData = {}
    libraryData.data = data
    libraryData.type = 'peerprivatedelete'
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }

  /**
  * call back
  * @method 
  */
  callbackPeerLib = function (data) {
    // pass to sort data into ref contract types
    libraryData = {}
    libraryData.data = 'contracts'
    libraryData.type = 'peerprivate'
    const segmentedRefContracts = this.liveComposer.liveRefcontUtility.refcontractSperate(data)
    libraryData.referenceContracts = segmentedRefContracts
    // need to split for genesis and peer joined NXPs
    const nxpSplit = this.liveComposer.liveRefcontUtility.experimentSplit(segmentedRefContracts.experiment)
    libraryData.splitExperiments = nxpSplit
    // look up modules for this experiments
    libraryData.networkExpModules = this.liveComposer.liveRefcontUtility.expMatchModuleGenesis(libraryData.referenceContracts.module, nxpSplit.genesis)
    libraryData.networkPeerExpModules = this.liveComposer.liveRefcontUtility.expMatchModuleJoined(libraryData.referenceContracts.module, nxpSplit.joined)
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }

  /*
  * call back for data calls
  * @callbackPeerLib
  */
  callbackPeerLib = function (data) {
    // pass to sort data into ref contract types
    let libraryData = {}
    libraryData.data = 'contracts'
    libraryData.type = 'peerprivate'
    const segmentedRefContracts = this.liveComposer.liveRefcontUtility.refcontractSperate(data)
    libraryData.referenceContracts = segmentedRefContracts
    // need to split for genesis and peer joined NXPs
    const nxpSplit = this.liveComposer.liveRefcontUtility.experimentSplit(segmentedRefContracts.experiment)
    libraryData.splitExperiments = nxpSplit
    // look up modules for this experiments
    libraryData.networkExpModules = this.liveComposer.liveRefcontUtility.expMatchModuleGenesis(libraryData.referenceContracts.module, nxpSplit.genesis)
    libraryData.networkPeerExpModules = this.liveComposer.liveRefcontUtility.expMatchModuleJoined(libraryData.referenceContracts.module, nxpSplit.joined)
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }
}

export default LibraryRoute