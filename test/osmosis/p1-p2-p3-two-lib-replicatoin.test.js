import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { setupHopTestEnvironment, teardownHopTestEnvironment } from '../helpers/ws-hop-osmosis.js';

let bentocuesCount = null;
let refLibCount = null;
let peer1PublicKey = '';
let peer2PublicKey = '';

describe('Three-Peer Cascading Osmosis Replication - Multi-Library', () => {
  let peer1, peer2, peer3;

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

    peer3 = await setupHopTestEnvironment({
      enginePath: '../../src/index.js',
      port: 9822,
      storename: 'test-peer3-22',
      passphrase: 'testbee'
    });
  }, 180000);

  afterAll(async () => {
    teardownHopTestEnvironment(peer1?.wsClient, peer1?.instance, 'test-peer1-20');
    teardownHopTestEnvironment(peer2?.wsClient, peer2?.instance, 'test-peer2-21');
    teardownHopTestEnvironment(peer3?.wsClient, peer3?.instance, 'test-peer3-22');
  });

  it('provisions isolated store directories and seed files for all three peers', () => {
    const peer1SeedPath = path.join(os.homedir(), '.test-peer1-20', 'dawn', 'seed.enc');
    const peer2SeedPath = path.join(os.homedir(), '.test-peer2-21', 'dawn', 'seed.enc');
    const peer3SeedPath = path.join(os.homedir(), '.test-peer3-22', 'dawn', 'seed.enc');

    expect(fs.existsSync(peer1SeedPath)).toBe(true);
    expect(fs.existsSync(peer2SeedPath)).toBe(true);
    expect(fs.existsSync(peer3SeedPath)).toBe(true);
  });

  it('Peer 1 seeds both genesis libraries', async () => {  
    const seedLibrary = await peer1.seedGenesisLibrary();
    bentocuesCount = seedLibrary.data.cueContracts.length;
    expect(bentocuesCount).toBeGreaterThan(0);  

    const seedRefLibrary = await peer1.seedPublicLibraryRef ? await peer1.seedPublicLibraryRef() : seedLibrary;
    refLibCount = seedRefLibrary.data.cueContracts ? seedRefLibrary.data.cueContracts.length : bentocuesCount;
    expect(refLibCount).toBeGreaterThan(0);
  }, 120000);

  it('Peer 1 generates invite and Peer 2 accepts it, then Peer 2 replicates from Peer 1', async () => {  
    const inviteBundle = await peer1.generateInvite('peer1-test');
    expect(inviteBundle).toBeDefined();  
    
    const hopInvite = 'hop:' + inviteBundle.bundle.publickey + inviteBundle.bundle.codename;
  
    const peer1IncomingPromise = peer1.waitForMessage((msg) => msg.action === 'peer-record-saved', 150000);
    const peer1PUBKEYPromise = peer1.waitForMessage((msg) => msg.action === 'network-keys', 150000);
    const peer2IncomingPromise = peer2.waitForMessage((msg) => {
      return msg.action === 'peer-record-saved' || msg.type === 'network-notification' || msg.action === 'osmosis-replication';
    }, 150000);

    const connectionSuccess = await peer2.acceptInvite('peer2-test', hopInvite);

    await peer1IncomingPromise;
    const peer1PubkeyMsg = await peer1PUBKEYPromise;
    await peer2IncomingPromise;
    
    peer1PublicKey = peer1PubkeyMsg.data.publickey;
    expect(connectionSuccess).toBeDefined();

    // Peer 2 executes osmosis from Peer 1
    peer2.send({
      type: 'network',
      action: 'osmosis-request-replication',
      data: {
        targetPeerKey: peer1PublicKey,
        stores: ['bentocues', 'publiclibrary-ref']
      }
    });

    const completionSignal = await peer2.waitForMessage((msg) => {
      return (
        msg.type === 'osmosis' &&
        msg.action === 'osmosis-replication-complete' &&
        msg.stores &&
        msg.stores.includes('bentocues') &&
        msg.stores.includes('publiclibrary-ref')
      );
    }, 150000);

    expect(completionSignal).toBeDefined();
  }, 180000);

  it('Peer 2 generates invite and Peer 3 accepts it to form a warm network relationship', async () => {
    // Capture Peer 2's network key
    const peer2PUBKEYPromise = peer2.waitForMessage((msg) => msg.action === 'network-keys', 150000);
    
    const inviteBundle = await peer2.generateInvite('peer2-test');
    expect(inviteBundle).toBeDefined();
    
    const hopInvite = 'hop:' + inviteBundle.bundle.publickey + inviteBundle.bundle.codename;

    const peer2IncomingPromise = peer2.waitForMessage((msg) => msg.action === 'peer-record-saved', 150000);
    const peer3IncomingPromise = peer3.waitForMessage((msg) => {
      return msg.action === 'peer-record-saved' || msg.type === 'network-notification' || msg.action === 'osmosis-replication';
    }, 150000);

    const connectionSuccess = await peer3.acceptInvite('peer3-test', hopInvite);

    await peer2IncomingPromise;
    const peer2PubkeyMsg = await peer2PUBKEYPromise;
    await peer3IncomingPromise;

    peer2PublicKey = peer2PubkeyMsg.data.publickey;
    expect(connectionSuccess).toBeDefined();
    expect(peer2PublicKey).toBeDefined();
  }, 150000);

  it('Peer 3 explicitly starts cascading osmosis replication from Peer 2 and validates completion', async () => {
    console.log('[osmosis:test] Peer 3 requesting cascading osmosis replication from Peer 2...');

    peer3.send({
      type: 'network',
      action: 'osmosis-request-replication',
      data: {
        targetPeerKey: peer2PublicKey,
        stores: ['bentocues', 'publiclibrary-ref']
      }
    });

    const completionSignal = await peer3.waitForMessage((msg) => {
      return (
        msg.type === 'osmosis' &&
        msg.action === 'osmosis-replication-complete' &&
        msg.stores &&
        msg.stores.includes('bentocues') &&
        msg.stores.includes('publiclibrary-ref')
      );
    }, 150000);

    expect(completionSignal).toBeDefined();

    // Validate Peer 3's local Hyperbee store counts independently
    console.log('[osmosis:test] Querying Peer 3 bentocues Hyperbee count...');
    const peer3BentocuesCount = await peer3.getHyperbeeCount('bentocues');
    expect(peer3BentocuesCount?.data?.length).toEqual(bentocuesCount);

    console.log('[osmosis:test] Querying Peer 3 publiclibrary-ref Hyperbee count...');
    const peer3RefLibCount = await peer3.getHyperbeeCount('publiclibrary-ref');
    expect(peer3RefLibCount?.referenceContracts?.length).toEqual(refLibCount);
  }, 180000);

});