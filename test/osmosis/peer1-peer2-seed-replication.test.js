import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { setupHopTestEnvironment, teardownHopTestEnvironment } from '../helpers/ws-hop-osmosis.js';

// peer 1 seed library info
let count = null

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

    /*

    peer 1 installs the genesis seed library

    peer 1 need to generate an invite and peer 2 needs to accept

    TEST  test that peer 1 is connected to peer2. 
    TEST test that peer 2 is connected to peer1.

    Then peer 2 should have a beebee message.  Peer 1 has seed library open for osmosis.

    Peer 2 clicks yes, start osmosis.  Peer 2 knows peer 1 public library e.g. cues hyperbee.  So it inform HOP that osmosis should start on the that hyperbee address.

    TEST    test that peer two has same number of entries in their cues hyperbee as peer 1  cues hyperbee.

    */

  }, 120000);

  afterAll(async () => {
    teardownHopTestEnvironment(peer1?.wsClient, peer1?.instance, 'test-peer1-20');
    teardownHopTestEnvironment(peer2?.wsClient, peer2?.instance, 'test-peer2-21');
  });

  it('provisions isolated store directories and seed files for both peers', () => {
    const peer1SeedPath = path.join(os.homedir(), '.test-peer1-20', 'dawn', 'seed.enc');
    // console.log(peer1SeedPath);
    const peer2SeedPath = path.join(os.homedir(), '.test-peer2-21', 'dawn', 'seed.enc');

    expect(fs.existsSync(peer1SeedPath)).toBe(true);
    expect(fs.existsSync(peer2SeedPath)).toBe(true);

    expect(fs.statSync(peer1SeedPath).size).toBeGreaterThan(0);
    expect(fs.statSync(peer2SeedPath).size).toBeGreaterThan(0);
  });

// (Assuming setupHopTestEnvironment has already run in beforeAll)  
  
  it('Peer 1 seeds the genesis library', async () => {  
    // Only Peer 1 does this
    let seedLibrary = await peer1.seedGenesisLibrary();
    count = seedLibrary.data.cueContracts.length
    expect(count).toBeGreaterThan(0);  
  }, 1200000);


it('Peer 1 generates invite and Peer 2 accepts it', async () => {  
    // 1. Peer 1 generates the invite bundle (Real world: Peer 1 creates and emails it)
    let peerPubkey = peer1.swarmPubkey;
    const inviteBundle = await peer1.generateInvite('peer1-test');
    
    console.log('peer invite back');
    // console.log(inviteBundle);

    expect(inviteBundle).toBeDefined();  
    expect(inviteBundle.base64String).toBeDefined();
    
    // set hop address
    let hopInvite = 'hop:' + inviteBundle.bundle.publickey + inviteBundle.bundle.codename;
  
    // 2. Set up Peer 1 to listen for the incoming connection BEFORE Peer 2 submits it.
    // Based on your logs, HOP sends this as msg.type === 'peer-codename-inform'
    const peer1IncomingPromise = peer1.waitForMessage((msg) => {
      if (msg.type !== 'safeflow-ecs' && msg.action !== 'seed-progress') {
        console.log('peer1 incomeing========')
        console.log(msg)
      }
      return (
        msg.action === 'warm-peer-topic' ||
        msg.action === 'invite-live-accepted' || 
        msg.action === 'network-peer-live' ||
        msg.type === 'peer-codename-inform'
      );
    }, 150000);

    const peer2IncomingPromise = peer2.waitForMessage((msg) => {
      if (msg.type !== 'safeflow-ecs') {
        console.log('peer2 incomeing+++++++')
        console.log(msg)
      }
      return (
        msg.action === 'warm-peer-topic' ||
        msg.action === 'invite-live-accepted' || 
        msg.action === 'network-peer-live' ||
        msg.type === 'peer-codename-inform' ||
        msg.action === 'osmosis-replication'
      );
    }, 150000);

    // 3. ONLY NOW does Peer 2 accept it  
    const connectionSuccess = await peer2.acceptInvite(hopInvite);
    console.log('peer2 now input invite and waits peer 1 connection');
    console.log(connectionSuccess);
    
    // 4. Peer 1 confirms the code name
    const peer1Confirm = await peer1IncomingPromise;
    console.log('Peer 1 received confirmation from Peer 2:');
    console.log(peer1Confirm);


    expect(connectionSuccess).toBeDefined();
    // test peer 1 received peer 2
    expect(peer1Confirm).toBeDefined();
    expect(peer1Confirm.action).toBe('invite-live-accepted')

    
    const peer2Confirm = await peer2IncomingPromise;
    console.log('Peer 2 received messages 2222222222:');
    console.log(peer2Confirm);
    

  }, 150000);
  


  it('Peer 2 requests osmosis replication from Peer 1', async () => {  
    
    console.log('peer 1 count')
    console.log(count)
  
    // Peer 2 asks to start replication using Peer 1's identifier  
    const peer2FinalCount = {} // await peer2.requestOsmosis();  
    console.log('peer two replication over=============')
    // console.log(peer2)
    // Verify Peer 2 now has the same data count as Peer 1  
    // const peer2FinalCount = await peer2.getHyperbeeCount();  
    expect(peer2FinalCount?.data?.cueContracts).toEqual(count);  
  });

});