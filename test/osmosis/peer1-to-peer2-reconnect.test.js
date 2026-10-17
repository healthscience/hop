import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'

import { setupHopTestEnvironment, teardownHopTestEnvironment, stopPeer } from '../helpers/ws-hop-osmosis.js'

describe('Peer Topic Reconnection Workflows', () => {
  let peer1, peer2

  const peer1Config = {
    enginePath: '../hop/src/index.js',
    port: 9840,
    storename: 'test-recon-p1',
    passphrase: 'testbeereconnect1'
  }

  const peer2Config = {
    enginePath: '../../src/index.js',
    port: 9841,
    storename: 'test-recon-p2',
    passphrase: 'testbeereconnect2'
  }

  beforeAll(async () => {
    // True clean slate
    const p1Dir = path.join(os.homedir(), '.' + peer1Config.storename)
    const p2Dir = path.join(os.homedir(), '.' + peer2Config.storename)
    if (fs.existsSync(p1Dir)) fs.rmSync(p1Dir, { recursive: true, force: true })
    if (fs.existsSync(p2Dir)) fs.rmSync(p2Dir, { recursive: true, force: true })

    peer1 = await setupHopTestEnvironment(peer1Config)
    peer2 = await setupHopTestEnvironment(peer2Config)
  }, 120000)

  afterAll(async () => {
    if (peer1?.wsClient) await teardownHopTestEnvironment(peer1.wsClient, peer1.instance, peer1Config.storename)
    if (peer2?.wsClient) await teardownHopTestEnvironment(peer2.wsClient, peer2.instance, peer2Config.storename)
  })

  it('Stage 1 to 3: First-Time Connection, Key Matching & Topic Contract Sync', async () => {
    const peer1TopicsSeen = new Set()
    const peer2TopicsSeen = new Set()

    peer1.wsClient.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        const topic = msg.data?.topic || msg.data?.value?.concept?.topic
        if (topic && typeof topic === 'string' && topic.length === 64) {
          peer1TopicsSeen.add(topic)
        }
      } catch (e) {}
    })

    peer2.wsClient.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        const topic = msg.data?.topic || msg.data?.value?.concept?.topic
        if (topic && typeof topic === 'string' && topic.length === 64) {
          peer2TopicsSeen.add(topic)
        }
      } catch (e) {}
    })

    // ------------------------------------------------------------------
    // STEP 1: Peer 1 Invite Generation
    // ------------------------------------------------------------------
    const peer2DesignatedName = 'peer1-reconnect-test'
    const peer1DesignatedNameForPeer2 = 'peer2-reconnect-test'
    const inviteBundle = await peer1.generateInvite(peer1DesignatedNameForPeer2)

    expect(inviteBundle).toBeDefined()
    expect(inviteBundle.bundle?.publickey).toBeDefined()
    expect(inviteBundle.bundle?.codename).toBeDefined()

    const hopInvite = 'hop:' + inviteBundle.bundle.publickey + inviteBundle.bundle.codename

    console.log('[TEST Step 1] Peer 1 created invite for:', peer2DesignatedName)
    console.log('[TEST Step 1] HOP Address Generated:', hopInvite)

    // ------------------------------------------------------------------
    // STEP 2: Prepare Event Listeners BEFORE accepting invite
    // ------------------------------------------------------------------

    const peer1ContractPromise = peer1.waitForMessage((msg) => {
      return msg.action === 'peer-record-saved' }, 60000)

    const peer2ContractPromise = peer2.waitForMessage((msg) => {
      return msg.action === 'peer-record-saved' }, 60000)

    // ------------------------------------------------------------------
    // STEP 3: Peer 2 Accepts Invite & Initiates Handshake
    // ------------------------------------------------------------------
    const connectionSuccess = await peer2.acceptInvite(peer2DesignatedName, hopInvite)
    expect(connectionSuccess).toBeDefined()
    console.log('[TEST Step 2] Peer 2 parsed invite and initiated connection.')

    // ------------------------------------------------------------------
    // STEP 4: Await Messages & Verify End Outcomes
    // ------------------------------------------------------------------
    const peer1TopicMsg = await peer1ContractPromise
    const peer2TopicMsg = await peer2ContractPromise
    console.log('peer savedddddddd')
    console.log(peer1TopicMsg)
    console.log(peer2TopicMsg)

    expect(peer1TopicMsg).toBeDefined()
    expect(peer2TopicMsg).toBeDefined()

    // Read name strictly from the data payloads emitted by each peer
    const peer1SavedNameForPeer2 = peer1TopicMsg.data.value.concept.name
    const peer2SavedNameForPeer1 = peer2TopicMsg.data.value.concept.name

    const peer1SavedTopic = peer1TopicMsg.data.value.concept.topic
    const peer2SavedTopic = peer2TopicMsg.data.value.concept.topic

    // --- HARD GUARANTEES ---

    // 1. Peer 1 stored Peer 2 with the designated name from invite generation
    expect(peer1SavedNameForPeer2).toBe(peer1DesignatedNameForPeer2)

    // 2. Peer 2 stored Peer 1 with its local designated name
    expect(peer2SavedNameForPeer1).toBe(peer2DesignatedName)

    // 3. Valid topic hashes
    expect(peer1SavedTopic).toBeDefined()
    expect(peer2SavedTopic).toBeDefined()
    expect(peer1SavedTopic.length).toBe(64)
    expect(peer2SavedTopic.length).toBe(64)

    // 4. Exact topic equality across both peers
    expect(peer1SavedTopic).toBe(peer2SavedTopic)

    // 5. Public key exchange verified


    /**
     *
     * @method convertBinaryToHex
     */
    function convertBinaryToHex (contract) {
      let hexKey = "";
      if (
        contract.key &&
        contract.key.type === "Buffer" &&
        Array.isArray(contract.key.data)
      ) {
        hexKey = contract.key.data
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      } else if (typeof contract.key === "string") {
        hexKey = contract.key;
      } else if (contract.key && typeof contract.key.toString === "function") {
        try {
          hexKey = contract.key.toString("hex");
        } catch (e) {
          console.error("Error converting key to hex", e);
        }
      }
      let hexContract = {};
      hexContract.key = hexKey;
      hexContract.value = contract.value;
      return hexContract;
    };

    const peer1SavedKey = convertBinaryToHex(peer1TopicMsg.data)
    const peer2SavedKey = convertBinaryToHex(peer2TopicMsg.data)



    expect(peer1SavedKey).toBeDefined()
    expect(peer2SavedKey).toBeDefined()
    expect(peer1SavedKey.key.length).toBe(78)
    expect(peer2SavedKey.key.length).toBe(78)

    console.log(`[TEST Step 4 VERIFIED] Peer 1 Name for Peer 2: ${peer1SavedNameForPeer2}`)
    console.log(`[TEST Step 4 VERIFIED] Peer 2 Name for Peer 1: ${peer2SavedNameForPeer1}`)
    console.log(`[TEST Step 4 VERIFIED] Shared Topic Match: ${peer1SavedTopic === peer2SavedTopic}`)

  }, 150000)


  
  it('Scenario 1: Both peers close down and auto-reconnect from stored disk state', async () => {
    // 1. Close both peer applications using closeHOP flow
    console.log('---------STOP----PEERS-----')
    await stopPeer(peer1)
    await stopPeer(peer2)

    // Verify storage directories remain intact
    const peer1SeedPath = path.join(os.homedir(), '.' + peer1Config.storename, 'dawn', 'seed.enc')
    expect(fs.existsSync(peer1SeedPath)).toBe(true)

    // 2. Restart peer instances from existing store directories
    peer1 = await setupHopTestEnvironment(peer1Config)
    peer2 = await setupHopTestEnvironment(peer2Config)
    console.log('+++++++START++++++++peer------------again+++++++++')
    // 3. Set up listeners for live reconnect
    const peer1ReconnectedPromise = peer1.waitForMessage((msg) => {
      if (msg.type !== 'safeflow-ecs') {
        console.log('peer1 2nd time connect')
        console.log(msg)
      }
      return (
        msg.action === 'peer-reconnected-verify'
      )
    }, 90000)

    const peer2ReconnectedPromise = peer2.waitForMessage((msg) => {
      if (msg.type !== 'safeflow-ecs') {
        console.log('peer2 2nd time connect')
        console.log(msg)
      }
      return (
        msg.action === 'peer-reconnected-verify'
      )
    }, 90000)

    // 4. Trigger topic reconnection start
    /*
    peer1.send({
      type: 'network',
      action: 'retry',
      data: {
        key: peer1PublicKey,
        value: {
          concept: {
            settopic: true,
            topic: warmTopicHex
          }
        }
      }
    })

    peer2.send({
      type: 'network',
      action: 'retry',
      data: {
        key: peer1PublicKey,
        value: {
          concept: {
            topic: warmTopicHex
          }
        }
      }
    })
    */
    const peer1Result = await peer1ReconnectedPromise
    const peer2Result = await peer2ReconnectedPromise
    console.log('promose TOPIC OVER')
    console.log(peer1Result)
    console.log(peer2Result)

    expect(peer1Result).toBeDefined()
    expect(peer2Result).toBeDefined()
    expect(peer1Result.data.topic).toBe(peer2Result.data.topic)

  }, 150000)


  /*
  it('Scenario 2: Peer 1 stays online, Peer 2 closes down and auto-connects on launch', async () => {
    // 1. Peer 2 closes application
    await stopPeer(peer2)

    // 2. Peer 1 listens for Peer 2 returning
    const peer1DetectsPeer2Return = peer1.waitForMessage((msg) => {
      return (
        msg.action === 'network-peer-live' ||
        msg.type === 'topic-reconnect-id' ||
        msg.action === 'peer-live-notify'
      )
    }, 90000)

    // 3. Peer 2 launches again
    peer2 = await setupHopTestEnvironment(peer2Config)

    const peer2ReconnectedPromise = peer2.waitForMessage((msg) => {
      return (
        msg.action === 'network-peer-live' ||
        msg.type === 'topic-reconnect-id' ||
        msg.action === 'peer-live-notify'
      )
    }, 90000)

    // 4. Peer 2 triggers topic join on launch
    peer2.send({
      type: 'network',
      action: 'retry',
      data: {
        key: peer1PublicKey,
        value: {
          concept: {
            topic: warmTopicHex
          }
        }
      }
    })

    const peer1Result = await peer1DetectsPeer2Return
    const peer2Result = await peer2ReconnectedPromise

    expect(peer1Result).toBeDefined()
    expect(peer2Result).toBeDefined()
  }, 150000)
  */
})