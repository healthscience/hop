import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { setupHopTestEnvironment, teardownHopTestEnvironment } from '../helpers/ws-hop-osmosis.js';

let count = null;
let peer1PublicKey = ''

describe('Dual Peer Osmosis Replication', () => {
  let peer1, peer2;

  beforeAll(async () => {
    peer1 = await setupHopTestEnvironment({
      enginePath: '../hop/src/index.js',
      port: 9820,
      storename: 'test-peer1-20',
      passphrase: 'testbee20'
    });

    peer2 = await setupHopTestEnvironment({
      enginePath: '../../src/index.js',
      port: 9821,
      storename: 'test-peer2-21',
      passphrase: 'testbee'
    });
  }, 120000);

  afterAll(async () => {
    teardownHopTestEnvironment(peer1?.wsClient, peer1?.instance, 'test-peer1-20');
    teardownHopTestEnvironment(peer2?.wsClient, peer2?.instance, 'test-peer2-21');
  });

  it('provisions isolated store directories and seed files for both peers', () => {
    const peer1SeedPath = path.join(os.homedir(), '.test-peer1-20', 'dawn', 'seed.enc');
    const peer2SeedPath = path.join(os.homedir(), '.test-peer2-21', 'dawn', 'seed.enc');

    expect(fs.existsSync(peer1SeedPath)).toBe(true);
    expect(fs.existsSync(peer2SeedPath)).toBe(true);

    expect(fs.statSync(peer1SeedPath).size).toBeGreaterThan(0);
    expect(fs.statSync(peer2SeedPath).size).toBeGreaterThan(0);
  });

  it('Peer 1 seeds the genesis library', async () => {  
    const seedLibrary = await peer1.seedGenesisLibrary();
    count = seedLibrary.data.cueContracts.length;
    expect(count).toBeGreaterThan(0);  
  }, 120000);


  it('Peer 1 generates invite and Peer 2 accepts it', async () => {  
    const inviteBundle = await peer1.generateInvite('peer1-test');
    
    expect(inviteBundle).toBeDefined();  
    expect(inviteBundle.base64String).toBeDefined();
    
    const hopInvite = 'hop:' + inviteBundle.bundle.publickey + inviteBundle.bundle.codename;
  
    const peer1IncomingPromise = peer1.waitForMessage((msg) => {
      if (msg.type !== 'safeflow-ecs' && msg.action !== 'seed-progress') {
        console.log('peer1 listening +++++++++')
        console.log(msg)
      }
      return (
        msg.action === 'warm-peer-topic' ||
        msg.action === 'invite-live-accepted' || 
        msg.action === 'network-peer-live' ||
        msg.type === 'peer-codename-inform'
      );
    }, 150000);

    // keep track peer 1 public key as in peer 2 we need it (no ui to select peer)
    const peer1PUBKEYPromise = peer1.waitForMessage((msg) => {
      return (
        msg.action === 'network-keys'
      );
    }, 150000);

    const peer2IncomingPromise = peer2.waitForMessage((msg) => {

      if (msg.type !== 'safeflow-ecs' && msg.action !== 'seed-progress') {
        console.log('peer2 listening----------------')
        console.log(msg)
      }
      return (
        msg.action === 'warm-peer-topic' ||
        msg.action === 'invite-live-accepted' || 
        msg.action === 'network-peer-live' ||
        msg.type === 'peer-codename-inform' ||
        msg.type === 'network-notification' ||
        msg.action === 'osmosis-replication'
      );
    }, 150000);


    const connectionSuccess = await peer2.acceptInvite(hopInvite);

    const peer1Confirm = await peer1IncomingPromise;
    const peer1Pubkey = await peer1PUBKEYPromise;
    const peer2Confirm = await peer2IncomingPromise;
    console.log('confirmation of wwwwwwwwwwaaaaaaaarmmm connectoin')
    console.log('peer111111111111')
    console.log(peer1Confirm)
    peer1PublicKey = peer1Pubkey.data.publickey
    console.log(peer2Confirm)
    console.log(peer1PublicKey)

    expect(connectionSuccess).toBeDefined();
    expect(peer1Confirm).toBeDefined();
    expect(peer1Confirm.action).toBe('invite-live-accepted');
    expect(peer2Confirm).toBeDefined();
  }, 150000);


it('Peer 2 explicitly start its own osmosis replication from Peer 1 manifest received on warm connection', async () => {

    console.log('bento cues library public key osmosis start message-----------')
    // 1. Send Osmosis replication request from Peer 2 targeting Peer 1
    peer2.send({
      type: 'network',
      action: 'osmosis-request-replication',
      data: {
        targetPeerKey: peer1PublicKey,
        stores: ['bentocues']
      }
    })

    console.log(`[osmosis:test] Awaiting full replication for target count: ${count}`)

    // 2. Block until Peer 2 receives the completion signal
    const completionSignal = await peer2.waitForMessage((msg) => {
      if (msg.type !== 'safeflow-ecs') {
        console.log('completion watiing peer 2')
        console.log(msg)
      }
      return (
        msg.type === 'osmosis' &&
        msg.action === 'osmosis-replication-complete' &&
        (msg.store === 'bentocues' || (Array.isArray(msg.stores) && msg.stores.includes('bentocues')))
      )
    }, 150000)

    console.log('notification of peer 2  success omosis from peer 1')
    console.log(completionSignal)
    expect(completionSignal).toBeDefined()

    // 3. Query local bentocues count after replication finishes
    const peer2FinalCount = await peer2.getHyperbeeCount('bentocues')

    console.log(`[osmosis:test] Final bentocues count -> Peer 2: ${peer2FinalCount?.data?.length} | Peer 1 Target: ${count}`)
    expect(peer2FinalCount?.data?.length).toEqual(count)
  }, 150000)

})
