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
import EventEmitter from 'events'
import LibComposer from 'librarycomposer'

class LibraryRoute extends EventEmitter {

  constructor(Holepunch) {
    super()
    this.live = true
    this.liveComposer = new LibComposer()
    this.liveHolepunch = Holepunch
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
    if (message.action.trim() === 'save-file') {
      await this.saveFileManager(message)
    } else if (message.reftype.trim() === 'sync-nxp-data') {
      // query hopresults per key
      const dataResults = this.liveHolepunch.BeeData.peerResults(message.data.uuid)
      // then replicate part of hopResults hyerbee with the peer, first make hopresult hyperbee replicatabl?
      // route to peerstore to replicate
    } else if (message.reftype.trim() === 'results-all') {
      const dataResults = await this.liveHolepunch.BeeData.peerResults()
      this.callbackPeerResultsAll(dataResults)
    } else if (message.reftype.trim() === 'ledger') {
      const dataLedger = await this.liveHolepunch.BeeData.KBLentries()
      this.callbackPeerKBL(dataLedger)
    } else if (message.reftype.trim() === 'save-json-json') {
    } else if (message.reftype.trim() === 'save-sqlite-file') {
    } else if (message.reftype.trim() === 'viewpublickey') {
      // two peer syncing reference contracts
      // const pubkey = this.liveHolepunch. // peerStoreLive.singlePublicKey('', callbackKey)
    } else if (message.reftype.trim() === 'openlibrary') {
      // two peer syncing reference contracts
      // const pubkey = this.liveHolepunch. // peerStoreLive.openLibrary(message.data, callbackOpenLibrary)
    } else if (message.reftype.trim() === 'keymanagement') {
      // this.liveHolepunch.
      // peerStoreLive.keyManagement(callbackKey)
    } else if (message.reftype.trim() === 'peer-add') {
      // peerStoreLive.addPeer(message.data, callbackPeerNetwork)
    } else if (message.reftype.trim() === 'warm-peers') {
      // this.liveHolepunch.
      // peerStoreLive.listWarmPeers(callbackWarmPeers, callbacklibrary)
    } else if (message.reftype.trim() === 'addpubliclibraryentry') {
      // take the ID of nxp selected to added to peers own public library
      let addPubRefc = await this.liveHolepunch.BeeData.publicLibraryAddentry(message.data)
      this.callbackPlibraryAdd(addPubRefc)
    } else if (message.reftype.trim() === 'removetemppubliclibrary') {
      // remove temp peers friends library
      // this.liveHolepunch.
      // peerStoreLive.publicLibraryRemoveTempNL(message.data, 'temp')
    } else if (message.reftype.trim() === 'replicatekey') {
      // two peer syncing public reference contracts
      let repDataStatus = await this.liveHolepunch.BeeData.replicatePubliclibrary(message.publickey)
      this.callbackReplicatereceive(repDataStatus)
    } else if (message.reftype.trim() === 'view-replicatelibrary') {
      let repData = await this.liveHolepunch.BeeData.getReplicatePublicLibrary(message.publickey)
      this.callbackReplicatelibrary(repData)
    } else if (message.reftype.trim() === 'publiclibrary-start') {
      console.log('public library start')
      // limit to ten and tell if more to offer up local or from the network
      let publibData = await this.liveHolepunch.BeeData.getPublicLibraryRange(10)
      // now build out reference contracts and modules
      this.callbacklibrary(publibData)
    } else if (message.reftype.trim() === 'publiclibrary') {
      let publibData = await this.liveHolepunch.BeeData.getPublicLibraryRange(100)
      this.callbacklibrary(publibData)
    } else if (message.reftype.trim() === 'privatelibrary-all') {
      let privateALL = await this.liveHolepunch.BeeData.getPeerLibraryRange()
      this.callbackPeerLibAllBoard(message.data, privateALL)
    } else if (message.reftype.trim() === 'privatelibrary-start') {
      let privateALL = await this.liveHolepunch.BeeData.getPeerLibraryRange()
      let expJoinList = []
      for (let mod of privateALL) {
        if (mod.value.refcontract === 'experiment-join') {
          expJoinList.push(mod)
        }
      }
      // now loop over and expand to include modules contracts
      let expandedModules = {}
      for (let bmod of expJoinList) {
        expandedModules[bmod.key] = []
        for (let module of bmod.value.modules) {
          // match mod to its module contract
          for (let item of privateALL) {
            if (item.key === module) {
              expandedModules[bmod.key].push(item)
            }
          }
        }
      }
      // console.log('first expand INSERT')
      // console.log(util.inspect(expandedModules, {showHidden: false, depth: null}))
      // need to add reference contracts for data compute visualise  (no need for question)
      // need to add to expand info object ///////////////////////////////////////
      let extractRefList = {}
      for (let board of expJoinList) {
        let boardGroup = expandedModules[board.key]
        extractRefList[board.key] = []
        for (let modCont of boardGroup) {
          if (modCont.value.type === 'data') {
            let modRefc = {}
            modRefc.type = 'data'
            modRefc.referencecontract = modCont.value.info.data
            extractRefList[board.key].push(modRefc)
          } else if (modCont.value.type === 'compute') {
            let modRefc = {}
            modRefc.type = 'compute'
            modRefc.referencecontract = modCont.value.info.compute
            extractRefList[board.key].push(modRefc)
          } else if (modCont.value.type === 'visualise') {
            let modRefc = {}
            modRefc.type = 'visualise'
            modRefc.referencecontract = modCont.value.info.visualise
            extractRefList[board.key].push(modRefc)
          } else if (modCont.value.type === 'question') {
            let modRefc = {}
            modRefc.type = 'question'
            modRefc.referencecontract = 'none'
            extractRefList[board.key].push(modRefc)
          }
        }      
      }
      // match module reference to full ref. contract
      let refContractPeer =  await this.liveHolepunch.BeeData.getPeerLibraryRange()
      let refContLookup = {}
      for (let board of expJoinList) {
        refContLookup[board.key] = []
        for (let refc of extractRefList[board.key]) {
          // compute has a one to many modules relationship, e.g. order by date to get latest
          if (refc.type !== 'compute') {
            let refContract =  await this.liveHolepunch.BeeData.getPublicLibrary(refc.referencecontract)
            refContLookup[board.key].push(refContract)
          } else {
            // match compute to base module for compute and track back to ref contract
            for (let refm of refContractPeer) {
              // console.log('compute matching modules to ref contracts')
              // console.log(refm.value?.info?.moduleinfo?.refcont)
              // console.log(refc.referencecontract)
              if (refm.value?.info?.moduleinfo?.refcont === refc.referencecontract) {
                refContLookup[board.key].push(refm)
                // lastly loop up source of compute
                for (let pubrc of refContractPeer) {
                  if (pubrc.key === refm.value.info.refcont) {
                    refm.value.info.refcont = pubrc
                    // let addComputeSourceRefc = {}
                    refContLookup[board.key].push(refm)
                  }
                }
              }
            }
          }
        }
      }
      // next replace refcontract keys with actual contract
      let keyBoards = Object.keys(expandedModules)
      for (let bd of keyBoards) {
        for (let boardi of expandedModules[bd]) {
          if(boardi.value?.type === 'data') {
            for (let rfi of refContLookup[bd]) {
              if (rfi?.key === boardi.value.info.data) {
                boardi.value.info.data = rfi
              }
            }
          } else if (boardi.value?.type === 'compute') {
            for (let rfi of refContLookup[bd]) {
              if (rfi?.key === boardi.value.info.compute) {
                boardi.value.info.visualise = rfi
              }
            }

          } else if (boardi.value?.type === 'visualise') {
          for (let rfi of refContLookup[bd]) {
              if (rfi?.key === boardi.value.info.visualise) {
                boardi.value.info.visualise = rfi
              }
            }
          }
        }
      }
      // console.log(util.inspect(expandedModules, {showHidden: false, depth: null}))
      // add expand to list of boards
      let returnExpanded = []
      for (let board of expJoinList) {
        let fullExpand = {}
        fullExpand = board
        fullExpand.modules = expandedModules[board.key]
        returnExpanded.push(fullExpand)
      }
      // console.log(util.inspect(returnExpanded, {showHidden: false, depth: null}))
      // next sticked modules
      this.callbackStartPeerLibBoard(message.data, returnExpanded)
    } else if (message.reftype.trim() === 'privatelibrary') {
      // console.log('private library -- bento space start flow----------')
      let singleContract = await this.liveHolepunch.BeeData.getPeerLibrary(message.data)
      // console.log('BentoBoard (npx) contract joined')
      // console.log(singleContract)
      let moduleBoard = []
      for (let mods of singleContract.value.modules) {
        // lookup modules and refcontracts
        let cellContract = await this.liveHolepunch.BeeData.getPeerLibrary(mods)
        moduleBoard.push(cellContract)
      }
      singleContract.modules = moduleBoard
      // next extract the reference contracts per module
      let extractContractKey = this.liveComposer.liveRefcontUtility.extractRefcontracts(moduleBoard, 'private')
      let privateALL = await this.liveHolepunch.BeeData.getPeerLibraryRange()
      let publiclibALL = await this.liveHolepunch.BeeData.getPublicLibraryRange()
      // console.log('public libiar all lib------------------------')
      // console.log(util.inspect(publiclibALL, {showHidden: false, depth: null}))
      let peerPrivCompute = []
      for (let prc of privateALL) {
        if (prc.value.type === 'compute') {
          peerPrivCompute.push(prc)
        }
        if (prc.value.type === 'compute') {
          // refcontract
        }
      }
      // match compute contract for this board contract
      let computeContractHolder = []
      let computeLink = []
      for (let mod of singleContract.value.modules) {
        for (let comprc of peerPrivCompute) {
          if (mod === comprc.key) {
            computeContractHolder = comprc
          }
          if (mod === comprc.value.link)
            computeLink.push(comprc)
        }
      }
      // console.log('copute holder start peer board')
      // console.log(computeContractHolder)
      // console.log(computeLink)
      let computeHistory = {}
      for (let refm of publiclibALL) {
        if (refm.value?.info?.moduleinfo?.refcont === computeContractHolder.value.info.compute) {
          computeHistory = refm
        }
      }
      // get the compute reference contract
      let computeSourceRC = {}
      for (let refm of publiclibALL) {
        if (refm.key === computeHistory.value.info.refcont) {
          computeSourceRC = refm
        }
      }
      let refContractList = []
      for (let rc of extractContractKey) {
        let typeCheck = typeof rc
        if (typeCheck === 'string') {
          let refcont = await this.liveHolepunch.BeeData.getPublicLibrary(rc)
          // need to get all compute modules and public compute reference contracts and match up
          refContractList.push(refcont)
          // let privteCompute = await this.liveHolepunch.BeeData.getPeerLibrary(rc)
         } 
       }
       // add compute to list
       refContractList.push(computeSourceRC)
      // need to integrate those reference contracts into the board (nxp) contract structure
      // REPEAT CODE FROM above private lib start not bentospace list
      // next replace refcontract keys with actual contract
      for (let boardi of moduleBoard) {
        if(boardi.value?.type === 'data') {
          for (let rfi of refContractList) {
            if (rfi?.key === boardi.value.info.data) {
              boardi.value.info.data = rfi
            }
          }
        } else if (boardi.value?.type === 'compute') {
          // console.log('copute  module')
          // console.log(boardi)
          for (let rfi of refContractList) {
            if (rfi?.key === boardi.value.info.compute) {
              boardi.value.info.visualise = rfi
            }
          }

        } else if (boardi.value?.type === 'visualise') {
        for (let rfi of refContractList) {
            if (rfi?.key === boardi.value.info.visualise) {
              boardi.value.info.visualise = rfi
            }
          }
        }
      }
      singleContract.modules = moduleBoard
      this.callbackPeerLibBoard(message.data, singleContract)
    } else if (message.reftype.trim() === 'remove-nxp') {
      let removeNXPdashboard = await this.liveHolepunch.BeeData.deleteRefcontPeerlibrary(message.data)
      this.callbackNXPDelete(removeNXPdashboard)
    } else if (message.reftype.trim() === 'datatype') {
      // query peer datastore or save dataatype ref contract
      if (message.action === 'GET') {
        const datatypeRC = await this.liveHolepunch.BeeData.getPublicLibrary(message.data)
        this.callbackDatatype(datatypeRC)
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await this.liveHolepunch.BeeData.savePubliclibrary(message)
        this.bothSockets(JSON.stringify(saveFeedback))
        // this.wsocket.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'compute') {
      // query peer hypertrie for datatypes
      if (message.action === 'GET') {
        const datatypeRC = await this.liveHolepunch.BeeData.getPublicLibrary(message)
        this.callbackDatatype(datatypeRC)
        // peerStoreLive.peerGETRefContracts('compute', callback)
      } else {
        // save a new refContract
        const newRefContract = message.refContract
        let saveFeedback = await this.liveHolepunch.BeeData.savePubliclibrary(message)
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
        let saveFeedback = await this.liveHolepunch.BeeData.savePubliclibrary(message)
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
        let saveFeedback = await this.liveHolepunch.BeeData.savePubliclibrary(message)
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
        let saveFeedback = await this.liveHolepunch.BeeData.savePubliclibrary(message)
        this.bothSockets(JSON.stringify(saveFeedback))
        // this.wsocket.send(JSON.stringify(saveFeedback))
      }
    } else if (message.reftype.trim() === 'experiment') {
      if (message.action === 'GET') {
        const newRefContract = message.refContract
        let contractInfo = await this.liveHolepunch.BeeData.getPeerLibrary(message.data.refcontract)
        // look up module contracts
        let expandedModContact = []
        for (let mod of contractInfo.value.modules) {
          let modFull = await this.liveHolepunch.BeeData.getPeerLibrary(mod)
          expandedModContact.push(modFull)
        }
        // contractInfo.modules = expandedModContact
        // lookup reference contracts wihin modules
        let refContractsDetail = []
        for (let modRef of expandedModContact) {
          if (modRef.value.type === 'data') {
            let refContract = await this.liveHolepunch.BeeData.getPublicLibrary(modRef.value.info.data)
            modRef.value.info.data = refContract
            refContractsDetail.push(modRef)
          } else if (modRef.value.type === 'compute') {
            let refContract = await this.liveHolepunch.BeeData.getPublicLibrary(modRef.value.info.compute)
            modRef.value.info.data = refContract
            refContractsDetail.push(modRef)
          } else if (modRef.value.type === 'question') {
            // let refContract = await this.liveHolepunch.BeeData.getPeerLibrary(modRef.value.info.question)
            refContractsDetail.push(modRef)
          } else if (modRef.value.type === 'visualise') {
            let refContract = await this.liveHolepunch.BeeData.getPublicLibrary(modRef.value.info.visualise)
            modRef.value.info.visualise = refContract
            refContractsDetail.push(modRef)
          }
        }
        contractInfo.modules = refContractsDetail
        this.callbackPeerlibrary(contractInfo)
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
        // const moduleRefContractReady = JSON.stringify(moduleRefContract)
        const savedFeedback = await this.liveHolepunch.BeeData.savePubliclibrary(moduleRefContract)
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
        const savedFeedback = await this.liveHolepunch.BeeData.savePubliclibrary(genesisRefContract)
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
        let moduleKeyValue = {}
        // prepare new modules for this peer  ledger
        let peerModules = {}
        // look up module template genesis contract
        if (mh.value.info.moduleinfo.name === 'question') {
          peerModules.type = 'question'
          peerModules.question = mh.value.info.question
        } else if (mh.value.info.moduleinfo.name === 'data') {
          peerModules.type = 'data'
          peerModules.data = message.data.options.data
        } else if (mh.value.info.moduleinfo.name === 'compute') {
          peerModules.type = 'compute'
          peerModules.compute = mh.value.info.moduleinfo.refcont
          peerModules.controls = message.data.options.compute
          peerModules.settings = message.data.options.visualise
        } else if (mh.value.info.moduleinfo.name === 'visualise') {
          peerModules.type = 'visualise'
          peerModules.visualise = mh.value.info.refcont
          peerModules.settings = message.data.options.visualise
        }
        let moduleRefContract = this.liveComposer.liveComposer.moduleComposer(peerModules, 'join')
        let savedFeedback = await this.liveHolepunch.BeeData.savePeerLibrary(moduleRefContract.data)
        moduleJoinedList.push(savedFeedback.key)
        // form key value refcont structure
        moduleKeyValue.key = savedFeedback.key
        moduleKeyValue.value = savedFeedback.contract
        moduleJoinedExpanded.push(moduleKeyValue)
        newModCount--
      }
      // check all modules are present and create peers network refcontract joined
      let savedBoardNew = {}
      if (newModCount === 0) {
        // aggregate all modules into board module contract
        // double check they are created
        let joinRefContract = this.liveComposer.liveComposer.experimentComposerJoin(moduleJoinedList)
        savedBoardNew = await this.liveHolepunch.BeeData.savePeerLibrary(joinRefContract.data)
        savedBoardNew.expanded = moduleJoinedExpanded
      }
      // code repeat from below  - need to make suport utility library
      let extractRefList = []
      for (let modCont of savedBoardNew.expanded) {
          if (modCont.value.type === 'data') {
            let modRefc = {}
            modRefc.type = 'data'
            modRefc.referencecontract = modCont.value.info.data
            extractRefList.push(modRefc)
          } else if (modCont.value.type === 'compute') {
            let modRefc = {}
            modRefc.type = 'compute'
            modRefc.referencecontract = modCont.value.info.compute
            extractRefList.push(modRefc)
          } else if (modCont.value.type === 'visualise') {
            let modRefc = {}
            modRefc.type = 'visualise'
            modRefc.referencecontract = modCont.value.info.visualise
            extractRefList.push(modRefc)
          } else if (modCont.value.type === 'question') {
            let modRefc = {}
            modRefc.type = 'question'
            modRefc.referencecontract = 'none'
            extractRefList.push(modRefc)
          }    
      }
      // match module reference to full ref. contract
      let refContractPeer =  await this.liveHolepunch.BeeData.getPeerLibraryRange()
      let refContLookup = []
      refContLookup = []
      for (let refc of extractRefList) {
        // compute has a one to many modules relationship, e.g. order by date to get latest
        if (refc.type !== 'compute') {
          let refContract =  await this.liveHolepunch.BeeData.getPublicLibrary(refc.referencecontract)
          refContLookup.push(refContract)
        } else {
          // console.log('compute trace back linked ')
          // match compute to base module for compute and track back to ref contract
          for (let refm of refContractPeer) {
            // console.log('compute matching modules to ref contracts')
            // console.log(refm)
            // console.log(refm.value?.info?.compute)
            // console.log(refc.referencecontract)
            if (refm.value?.info?.compute === refc.referencecontract) {
              refContLookup.push(refm)
              // lastly loop up source of compute
              for (let pubrc of refContractPeer) {
                if (pubrc.key === refm.value.info.refcont) {
                  refm.value.info.refcont = pubrc
                  // let addComputeSourceRefc = {}
                  refContLookup.push(refm)
                }
              }
            }
          }
        }
      }
      // next replace refcontract keys with actual contract
      console.log('module contractss list')
      console.log(savedBoardNew)
      // let keyBoards = Object.keys()
      // console.log(keyBoards)
      for (let modi of savedBoardNew.expanded) {
         // for (let boardi of savedBoardNew.expanded[bd]) {
          if(modi.value?.type === 'data') {
            for (let rfi of refContLookup) {
              if (rfi?.key === modi.value.info.data) {
                modi.value.info.data = rfi
              }
            }
          } else if (modi.value?.type === 'compute') {
            for (let rfi of refContLookup) {
              if (rfi?.key === modi.value.info.compute) {
                modi.value.info.visualise = rfi
              }
            }

          } else if (modi.value?.type === 'visualise') {
          for (let rfi of refContLookup) {
              if (rfi?.key === modi.value.info.visualise) {
                modi.value.info.visualise = rfi
              }
            }
          }
        // }
      }
      console.log('keyp aboards----')
      console.log(savedBoardNew)
      // console.log(util.inspect(expandedModules, {showHidden: false, depth: null}))
      // add expand to list of boards
      let fullExpand = {}
      fullExpand.board = savedBoardNew
      fullExpand.modules = savedBoardNew.expanded
      // console.log(util.inspect(returnExpanded, {showHidden: false, depth: null}))
      // next sticked modules
      this.callbackNewJoinPeerLibBoard(savedBoardNew.key, fullExpand)    
    } else if (message.reftype.trim() === 'genesisexperiment') {
      let genesisRefContract = this.liveComposer.liveComposer.experimentComposerGenesis(message.data)
      const savedFeedback = await this.liveHolepunch.BeeData.savePeerLibrary(genesisRefContract)
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
        const savedFeedback = this.liveHolepunch.BeeData.savePeerLibrary(o)
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
        moduleContainer.name = prepareModule.data.contract.concept.type
        moduleContainer.id = modCount
        moduleContainer.refcont = prepareModule.data.hash
        moduleHolder.push(moduleContainer)
        modCount++
      }
      let moduleTempData = {}
      moduleTempData.type = 'modulesTemp'
      moduleTempData.data = moduleHolder
      this.bothSockets(JSON.stringify(moduleTempData))
      // this.wsocket.send(JSON.stringify(moduleTempData))
    } else if (message.reftype.trim() === 'newmodules') {
      let moduleRefContract = this.liveComposer.LiveComposer.moduleComposer(message.data, 'join')
      const savedFeedback = this.liveHolepunch.BeeData.savePeerLibrary(moduleRefContract)
      this.bothSockets(JSON.stringify(savedFeedback))
      // this.wsocket.send(JSON.stringify(savedFeedback))
    } else if (message.reftype.trim() === 'newlifeboard') {
      let lifeboardRefContract = this.liveComposer.LiveComposer.lifeboardComposer(message.data, 'new')
      // const saveLB = this.liveHolepunch.saveLifeboard() // peerStoreLive.lifeboardStoreRefContract(lifeboardRefContract)
      this.bothSockets(JSON.stringify(saveLB))
      // this.wsocket.send(JSON.stringify(saveLB))
    } else if (message.reftype.trim() === 'addlifeboard') {
      let lifeboardMember = this.liveComposer.LiveComposer.lifeboardComposer(message.data, 'member')
      // const saveLBmember = this.liveHolepunch.saveLifeboard // peerStoreLive.lifeboardStoreRefContract(lifeboardMember)
      this.bothSockets(JSON.stringify(saveLBmember))
      // this.wsocket.send(JSON.stringify(saveLBmember))
    } else if (message.reftype.trim() === 'peerLifeboard') {
      // this.liveHolepunch.
      // peerStoreLive.peerGETLifeboards('all', callbackLifeboard)
    } else {
      console.log('network library no match')
    }
  }

  /**
  * save file manager
  * @method saveFileManager
  */
  saveFileManager = async function (save) {
    console.log('Library--save manager')
    // console.log(save)
    let fileList = []
    fileList.push(save.data)
    save.data = fileList
    // route for different type of processing before save, add PandasAI (via beebee?)
    // how many files coming in?
    let fileCount = save.data.length
    for (let i = 0; i < fileCount; i++) {
      if (save.data[i].type === 'sqlite') {
        console.log('a sqlite file eg. gadgetbridge')
        console.log(save.data[i])
        let fileInfo = await this.liveHolepunch.DriveFiles.hyperdriveFilesave(save.data[i].type, save.data[i].name, save.data[i].content)
        let fileFeedback = {}
        fileFeedback.success = true
        fileFeedback.path = fileInfo.filename
        let storeFeedback = {}
        storeFeedback.type = 'library'
        storeFeedback.action = 'file-save'
        storeFeedback.data = fileFeedback
        this.bothSockets(JSON.stringify(storeFeedback))
      } else if (save.data[i].type === 'application/json') {
        if (save.data[i].source === 'local') {
          // await liveParser.localJSONfile(o, ws)
        } else if (save.data[i].source === 'web') {
          // liveParser.webJSONfile(o, ws)
        }
      } else if (save.data[i].type === 'text/csv') {
        console.log('cvs to path to json savefiles hyperdrive')
        // save protocol original file save and JSON for HOP
        if (save.data[i].source === 'local') {
          let fileInfo = await this.liveHolepunch.DriveFiles.hyperdriveCSVmanager(save)
          let fileFeedback = {}
          fileFeedback.success = true
          fileFeedback.path = fileInfo.filename
          fileFeedback.columns = fileInfo.header.splitwords
          let storeFeedback = {}
          storeFeedback.type = 'library'
          storeFeedback.action = 'save-file'
          storeFeedback.data = fileFeedback
          this.bothSockets(JSON.stringify(storeFeedback))
          // now inform SafeFlow that data needs charting
          this.emit('library-data', fileFeedback)
        } else if (message.data.source === 'web') {
          // liveParser.webFileParse(o, ws)
        }
      } else if (save.data[i].type === 'spreadsheet') {
        // need to pass to pandasAI
      }
    }
  }

  /**
  * bentobox info gathering
  * @method bentoPath
  */
   bentoPath = async function (o) {
    if (o.reftype.trim() === 'bentospace') {
      // console.log(o)
      if (o.action.trim() === 'save-position') {
        let bentospace = await this.liveHolepunch.BeeData.saveBentospace(o.data)
        this.callbackBentospace(bentospace)
      } else if (o.action.trim() === 'list-position') {
        let bbspace = await this.liveHolepunch.BeeData.getBentospace()
        this.callbackListBentospace(bbspace)
      } else {
        console.log('no action bentospace')
      }
    } else if (o.reftype.trim() === 'solospace') {
      if (o.action.trim() === 'save-position') {
        let solospace = await this.liveHolepunch.BeeData.saveSolospace(o.data)
        console.log('solo save')
        console.log(solospace)
        this.callbacSolospace(solospace)
       } else if (o.action.trim() === 'list-position') {
        let ssspace = await this.liveHolepunch.BeeData.getSolospace(o.data)
         this.callbackListSolospace(ssspace)
       } else {
         console.log('no action solospace')
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
  * @method callbackPeerlibrary
  */
  callbackPeerlibrary = function (data) {
    let libraryData = {}
    libraryData.type = 'peerlibrary'
    libraryData.refcontract = 'experiment-new'
    libraryData.data = data
    this.bothSockets(JSON.stringify(libraryData))
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
  * @method callbackListBentospace
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
  * @method callbacSolospace
  */
    callbacSolospace = function (data) {
      // pass to sort data into ref contract types
      let blibraryData = {}
      blibraryData.stored = true
      blibraryData.type = 'solospaces'
      blibraryData.data = data
      this.bothSockets(JSON.stringify(blibraryData))
      // this.wsocket.send(JSON.stringify(blibraryData))
    }
  
    /**
    * call back
    * @method callbackListSolospace
    */
    callbackListSolospace = function (data) {
      // pass to sort data into ref contract types
      let blibraryData = {}
      blibraryData.type = 'solospaces-list'
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
    let libraryData = {}
    libraryData.data = data
    libraryData.type = 'peerprivatedelete'
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }

  /**
  * new join
  * @method callbackNewJoinPeerLibBoard
  */
  callbackNewJoinPeerLibBoard = function (board, data) {
  // pass to sort data into ref contract types
  let libraryData = {}

  libraryData.stored = true
  libraryData.type = 'new-joinboard'
  libraryData.key = board
  libraryData.contract = 'new-joinboard'
  libraryData.data = data
  this.bothSockets(JSON.stringify(libraryData))
  // this.wsocket.send(JSON.stringify(libraryData))
}

  /**
  * call back peer library data start
  * @method 
  */
  callbackStartPeerLibBoard = function (board, data) {
    // pass to sort data into ref contract types
    let libraryData = {}
    libraryData.board = board
    libraryData.data = data
    libraryData.type = 'peerprivate-start'
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }


  /**
  * call back peer library data all for network library
  * @method 
  */
  callbackPeerLibAllBoard = function (board, data) {
    // pass to sort data into ref contract types
    let libraryData = {}
    libraryData.board = board
    libraryData.data = data
    libraryData.type = 'peerprivate-returnall'
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }



  /**
  * call back peer library data
  * @method 
  */
  callbackPeerLibBoard = function (board, data) {
    // pass to sort data into ref contract types
    let libraryData = {}
    libraryData.board = board
    libraryData.data = data
    libraryData.type = 'peerprivate'
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }

  /**
  * call back peer results
  * @method callbackPeerResultsAll
  */
  callbackPeerResultsAll = function (data) {
    // pass to sort data into ref contract types
    let libraryData = {}
    libraryData.board = 'peer'
    libraryData.data = data
    libraryData.type = 'results-all'
    this.bothSockets(JSON.stringify(libraryData))
    // this.wsocket.send(JSON.stringify(libraryData))
  }

  /**
  * call back kb ledger
  * @method 
  */
    callbackPeerKBL = function (data) {
      // pass to sort data into ref contract types
      let libraryData = {}
      libraryData.board = 'peer'
      libraryData.data = data
      libraryData.type = 'ledger'
      this.bothSockets(JSON.stringify(libraryData))
      // this.wsocket.send(JSON.stringify(libraryData))
    }
  

  /**
  * call back peer library data
  * @method 
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