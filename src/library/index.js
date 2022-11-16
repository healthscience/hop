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

class LibraryRoute extends EventEmitter {

  constructor() {
    super()
    console.log('{{library-route}}')
  }

  /**
  * process messages going to library
  * @method library
  *
  */
    libraryPath = async function (message) {
    console.log('library')
    // console.log('library')
    // console.log(o)
    // library routing
    if (message.reftype.trim() === 'convert-csv-json') {
      // console.log('csv jon start')
      // console.log(o)
      // save protocol original file save and JSON for HOP
      if (message.data.source === 'local') {
        let fileInfo = await liveHyperspace.hyperdriveFolderFiles(o)
        let fileFeedback = {}
        fileFeedback.success = true
        fileFeedback.path = fileInfmessage.filename
        fileFeedback.columns = fileInfmessage.header.splitwords
        let storeFeedback = {}
        storeFeedback.type = 'file-save'
        storeFeedback.action = 'library'
        storeFeedback.data = fileFeedback
        ws.send(JSON.stringify(storeFeedback))
        // await liveParser.localFileParse(o, ws)
      } else if (message.data.source === 'web') {
        // liveParser.webFileParse(o, ws)
      }
    } else if (message.reftype.trim() === 'sync-nxp-data') {
      console.log('request to sync data for a contract')
      console.log(message.data)
      // query hopresults per key
      const dataResults = liveHyperspace.peerResults(message.data.uuid)
      // then replicate part of hopResults hyerbee with the peer, first make hopresult hyperbee replicatabl?
      // route to peerstore to replicate
    } else if (message.reftype.trim() === 'save-json-json') {
        if (message.data.source === 'local') {
          // await liveParser.localJSONfile(o, ws)
        } else if (message.data.source === 'web') {
          // liveParser.webJSONfile(o, ws)
        }
    } else if (message.reftype.trim() === 'save-sqlite-file') {
      let fileInfo = await liveHyperspace.hyperdriveFilesave(message.data.type, message.data.name, message.data.path)
      let fileFeedback = {}
      fileFeedback.success = true
      fileFeedback.path = fileInfmessage.filename
      let storeFeedback = {}
      storeFeedback.type = 'file-save'
      storeFeedback.action = 'library'
      storeFeedback.data = fileFeedback
      ws.send(JSON.stringify(storeFeedback))
    } else if (message.reftype.trim() === 'viewpublickey') {
      // two peer syncing reference contracts
      // const pubkey = liveHyperspace. // peerStoreLive.singlePublicKey('', callbackKey)
    } else if (message.reftype.trim() === 'openlibrary') {
      // two peer syncing reference contracts
      // const pubkey = liveHyperspace. // peerStoreLive.openLibrary(message.data, callbackOpenLibrary)
    } else if (message.reftype.trim() === 'keymanagement') {
      // liveHyperspace.
      // peerStoreLive.keyManagement(callbackKey)
    } else if (message.reftype.trim() === 'peer-add') {
      // peerStoreLive.addPeer(message.data, callbackPeerNetwork)
    } else if (message.reftype.trim() === 'warm-peers') {
      // liveHyperspace.
      // peerStoreLive.listWarmPeers(callbackWarmPeers, callbacklibrary)
    } else if (message.reftype.trim() === 'addpubliclibraryentry') {
      // take the ID of nxp selected to added to peers own public library
      let addPubRefc = await liveHyperspace.publicLibraryAddentry(message.data)
      callbackPlibraryAdd(addPubRefc)
    } else if (message.reftype.trim() === 'removetemppubliclibrary') {
      // remove temp peers friends library
      // liveHyperspace.
      // peerStoreLive.publicLibraryRemoveTempNL(message.data, 'temp')
    } else if (message.reftype.trim() === 'replicatekey') {
      // two peer syncing public reference contracts
      let repDataStatus = await liveHyperspace.replicatePubliclibrary(message.publickey)
      callbackReplicatereceive(repDataStatus)
    } else if (message.reftype.trim() === 'view-replicatelibrary') {
      let repData = await liveHyperspace.getReplicatePublicLibrary(message.publickey)
      callbackReplicatelibrary(repData)
    } else if (message.reftype.trim() === 'publiclibrary') {
      // await liveHyperspace.getPublicLibrary('contracthash')
      let publibData = await liveHyperspace.getPublicLibraryRange()
      await liveHyperspace.getPublicLibraryLast()
      callbacklibrary(publibData)
    } else if (message.reftype.trim() === 'privatelibrary') {
      let contractData = await liveHyperspace.getPeerLibraryRange()
      callbackPeerLib(contractData)
    } else if (message.reftype.trim() === 'remove-nxp') {
      console.log('remove nxp from start ')
      let removeNXPdashboard = await liveHyperspace.deleteRefcontPeerlibrary(message.data)
      callbackNXPDelete(removeNXPdashboard)
    } else if (message.reftype.trim() === 'datatype') {
      // query peer datastore or save dataatype ref contract
      if (message.action === 'GET') {
        const datatypeList = await liveHyperspace.getPublicLibrary('datatype')
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await liveHyperspace.savePubliclibrary(o)
        ws.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'compute') {
      // query peer hypertrie for datatypes
      if (message.action === 'GET') {

        // peerStoreLive.peerGETRefContracts('compute', callback)
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await liveHyperspace.savePubliclibrary(o)
        ws.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'units') {
      // query peer hypertrie for Units
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('units', callback)
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await liveHyperspace.savePubliclibrary(o)
        ws.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'packaging') {
      // query peer hypertrie for
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('packaging', callback)
      } else {
        // save a new refContract
        // const savedFeedback = // peerStoreLive.libraryStoreRefContract(o)
        // ws.send(JSON.stringify(savedFeedback))
        const newRefContract = message.refContract
        let saveFeedback = await liveHyperspace.savePubliclibrary(o)
        ws.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'visualise') {
      // query peer hypertrie for
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('visualise', callback)
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await liveHyperspace.savePubliclibrary(o)
        ws.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'experiment') {
      // query peer hypertrie for
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('experiment', callback)
      } else {
        // save a new refContract
        // const savedFeedback = // peerStoreLive.libraryStoreRefContract(o)
        ws.send(JSON.stringify(savedFeedback))
      }
    } else if (message.reftype.trim() === 'newexperimentmodule') {
      // a new genesis network experiment to store to network library
      let moduleGenesisList = []
      let moduleGenesisExpanded = []
      let newModCount = message.data.length
      for (let mh of message.data) {
        const moduleRefContract = liveLibrary.liveComposer.moduleComposer(mh, '')
        const moduleRefContractReady = JSON.stringify(moduleRefContract)
        const savedFeedback = await liveHyperspace.savePubliclibrary(moduleRefContract)
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
        let genesisRefContract = liveLibrary.liveComposer.experimentComposerGenesis(moduleGenesisList)
        // double check they are created
        const savedFeedback = await liveHyperspace.savePubliclibrary(genesisRefContract)
        savedFeedback.expanded = moduleGenesisExpanded
        ws.send(JSON.stringify(savedFeedback))
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
        let moduleRefContract = liveLibrary.liveComposer.moduleComposer(peerModules, 'join')
        const savedFeedback = await liveHyperspace.savePeerLibrary(moduleRefContract)
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
        let joinRefContract = liveLibrary.liveComposer.experimentComposerJoin(moduleJoinedList)
        const savedFeedback = await liveHyperspace.savePeerLibrary(joinRefContract)
        savedFeedback.expanded = moduleJoinedExpanded
        ws.send(JSON.stringify(savedFeedback))
      }
    } else if (message.reftype.trim() === 'genesisexperiment') {
      let genesisRefContract = liveLibrary.liveComposer.experimentComposerGenesis(message.data)
      const savedFeedback = await liveHyperspace.savePeerLibrary(genesisRefContract)
      ws.send(JSON.stringify(savedFeedback))
    } else if (message.reftype.trim() === 'kbid') {
      // query peer hypertrie for
      if (message.action === 'GET') {
        kbidStoreLive.peerGETkbids('kbid', callback)
      } else {
        // save a new refContract
        const savedFeedback = kbidStoreLive.peerStoreKBIDentry(o)
        ws.send(JSON.stringify(savedFeedback))
      }
    } else if (message.action === 'extractexperimentmodules') {
      let joinExpDisplay = {}
      joinExpDisplay.type = 'extractexperimentmodules'
      joinExpDisplay.data = liveLibrary.liveRefcontUtility.extractData(message.data.modules, 'data')
      joinExpDisplay.compute = liveLibrary.liveRefcontUtility.extractCompute(message.data.modules, 'compute')
      joinExpDisplay.visualise = liveLibrary.liveRefcontUtility.extractVisualise(message.data.modules, 'visualise')
      // look up option contracts for each ref contract type
      let dataOptions = []
      for (let optionD of joinExpDisplay.data) {
        const refcontract = liveLibrary.liveRefcontUtility.refcontractLookup(optionD.option.key, joinExpDisplay.data)
        dataOptions.push(refcontract)
      }
      let computeOptions = []
      for (let optionD of joinExpDisplay.compute) {
        const refcontract = liveLibrary.liveRefcontUtility.refcontractLookup(optionD.option.key, joinExpDisplay.compute)
        computeOptions.push(refcontract)
      }
      let visOptions = []
      for (let optionD of joinExpDisplay.visualise) {
        const refcontract = liveLibrary.liveRefcontUtility.refcontractLookup(optionD.option.key, joinExpDisplay.visualise)
        visOptions.push(refcontract)
      }
      let experimentOptions = {}
      experimentOptions.data = dataOptions
      experimentOptions.compute = computeOptions
      experimentOptions.visualise = visOptions
      joinExpDisplay.options = experimentOptions
      ws.send(JSON.stringify(joinExpDisplay))
    } else if (message.reftype.trim() === 'module') {
      // query peer hypertrie
      if (message.action === 'GET') {
        // peerStoreLive.peerGETRefContracts('module', callback)
      } else {
        // save a new refContract
        const savedFeedback = liveHyperspace.savePeerLibrary(o)
        ws.send(JSON.stringify(savedFeedback))
      }
    } else if (message.reftype.trim() === 'moduletemp') {
      // create new temp modules for new experiment
      let modCount = 1
      let moduleHolder = []
      for (const mc of message.data) {
        const prepareModule = liveLibrary.liveComposer.moduleComposer(mc, '')
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
      ws.send(JSON.stringify(moduleTempData))
    } else if (message.reftype.trim() === 'newmodules') {
      let moduleRefContract = liveLibrary.liveComposer.moduleComposer(message.data, 'join')
      const savedFeedback = liveHyperspace.savePeerLibrary(moduleRefContract)
      ws.send(JSON.stringify(savedFeedback))
    } else if (message.reftype.trim() === 'newlifeboard') {
      let lifeboardRefContract = liveLibrary.liveComposer.lifeboardComposer(message.data, 'new')
      // const saveLB = liveHyperspace.saveLifeboard() // peerStoreLive.lifeboardStoreRefContract(lifeboardRefContract)
      ws.send(JSON.stringify(saveLB))
    } else if (message.reftype.trim() === 'addlifeboard') {
      let lifeboardMember = liveLibrary.liveComposer.lifeboardComposer(message.data, 'member')
      // const saveLBmember = liveHyperspace.saveLifeboard // peerStoreLive.lifeboardStoreRefContract(lifeboardMember)
      ws.send(JSON.stringify(saveLBmember))
    } else if (message.reftype.trim() === 'peerLifeboard') {
      // liveHyperspace.
      // peerStoreLive.peerGETLifeboards('all', callbackLifeboard)
    } else {
      console.log('network library no match')
    }
  }


  /*
  * call back for data calls
  *
  * @ dataListeners
  */
  dataListeners = async function () {
    function callbackKey (data) {
      let pubkeyData = {}
      pubkeyData.type = 'publickey'
      pubkeyData.pubkey = data
      ws.send(JSON.stringify(pubkeyData))
    }
    function callbackOpenLibrary (data) {
      let pubkeyData = {}
      pubkeyData.type = 'open-library'
      pubkeyData.data = data
      ws.send(JSON.stringify(pubkeyData))
    }
    function callbackPeerNetwork (data) {
      let peerNData = {}
      peerNData.type = 'new-peer'
      peerNData.data = data
      ws.send(JSON.stringify(peerNData))
    }
    function callbackWarmPeers (data) {
      let peerNData = {}
      peerNData.type = 'warm-peers'
      peerNData.data = data
      ws.send(JSON.stringify(peerNData))
    }
    function callbacklibrary (data) {
        // pass to sort data into ref contract types
      libraryData.data = 'contracts'
      libraryData.type = 'publiclibrary'
      const segmentedRefContracts = liveLibrary.liveRefcontUtility.refcontractSperate(data)
      libraryData.referenceContracts = segmentedRefContracts
      // need to split for genesis and peer joined NXPs
      const nxpSplit = liveLibrary.liveRefcontUtility.experimentSplit(segmentedRefContracts.experiment)
      libraryData.splitExperiments = nxpSplit
      // look up modules for this experiments
      libraryData.networkExpModules = liveLibrary.liveRefcontUtility.expMatchModuleGenesis(libraryData.referenceContracts.module, nxpSplit.genesis)
      libraryData.networkPeerExpModules = liveLibrary.liveRefcontUtility.expMatchModuleJoined(libraryData.referenceContracts.module, nxpSplit.joined)
      ws.send(JSON.stringify(libraryData))
    }

    function callbackPlibraryAdd (data) {
      let libraryData = {}
      libraryData.data = data
      libraryData.type = 'publiclibraryaddcomplete'
      ws.send(JSON.stringify(libraryData))
    }

    function callbackReplicatelibrary (data) {
      // pass to sort data into ref contract types
      libraryData.data = 'contracts'
      libraryData.type = 'replicatedata-publiclibrary'
      const segmentedRefContracts = liveLibrary.liveRefcontUtility.refcontractSperate(data)
      libraryData.referenceContracts = segmentedRefContracts
      // need to split for genesis and peer joined NXPs
      const nxpSplit = liveLibrary.liveRefcontUtility.experimentSplit(segmentedRefContracts.experiment)
      libraryData.splitExperiments = nxpSplit
      // look up modules for this experiments
      libraryData.networkExpModules = liveLibrary.liveRefcontUtility.expMatchModuleGenesis(libraryData.referenceContracts.module, nxpSplit.genesis)
      libraryData.networkPeerExpModules = liveLibrary.liveRefcontUtility.expMatchModuleJoined(libraryData.referenceContracts.module, nxpSplit.joined)
      ws.send(JSON.stringify(libraryData))
    }

    function callbackReplicatereceive (data) {
      console.log('repliate feedvack peerlink')
      let peerRdata = {}
      peerRdata.type = 'replicate-publiclibrary'
      peerRdata.data = data
      ws.send(JSON.stringify(peerRdata))
    }

    function callbackLifeboard (err, data) {
      // pass to sort data into ref contract types
      let libraryData = {}
      libraryData.data = 'contracts'
      libraryData.type = 'peerlifeboard'
      libraryData.lifeboard = data
      ws.send(JSON.stringify(libraryData))
    }

    function callbackBentospace (data) {
      // pass to sort data into ref contract types
      let blibraryData = {}
      blibraryData.type = 'bentospaces'
      blibraryData.data = data
      ws.send(JSON.stringify(blibraryData))
    }

    function callbackListBentospace (data) {
      // pass to sort data into ref contract types
      let blibraryData = {}
      blibraryData.type = 'bentospaces-list'
      blibraryData.data = data
      ws.send(JSON.stringify(blibraryData))
    }

    function callbackNXPDelete(data) {
      // pass to sort data into ref contract types
      console.log('peerprivate delete')
      console.log(data)
      let libraryData = {}
      libraryData.data = data
      libraryData.type = 'peerprivatedelete'
      ws.send(JSON.stringify(libraryData))
    }
    function callbackPeerLib (data) {
      // pass to sort data into ref contract types
      libraryData.data = 'contracts'
      libraryData.type = 'peerprivate'
      const segmentedRefContracts = liveLibrary.liveRefcontUtility.refcontractSperate(data)
      libraryData.referenceContracts = segmentedRefContracts
      // need to split for genesis and peer joined NXPs
      const nxpSplit = liveLibrary.liveRefcontUtility.experimentSplit(segmentedRefContracts.experiment)
      libraryData.splitExperiments = nxpSplit
      // look up modules for this experiments
      libraryData.networkExpModules = liveLibrary.liveRefcontUtility.expMatchModuleGenesis(libraryData.referenceContracts.module, nxpSplit.genesis)
      libraryData.networkPeerExpModules = liveLibrary.liveRefcontUtility.expMatchModuleJoined(libraryData.referenceContracts.module, nxpSplit.joined)
      ws.send(JSON.stringify(libraryData))
    }
  }

}

export default LibraryRoute