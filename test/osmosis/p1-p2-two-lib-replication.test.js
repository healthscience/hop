import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import path from 'path';
import fs from 'fs';
import os from 'os';

import { setupHopTestEnvironment, teardownHopTestEnvironment } from '../helpers/ws-hop-osmosis.js';

let bentocuesCount = null;
let refLibCount = null;
let peer1PublicKey = ''

describe('Dual Peer Osmosis Replication - Multi-Library', () => {
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

  it('Peer 1 seeds both genesis libraries', async () => {  
    const seedLibrary = await peer1.seedGenesisLibrary();
    bentocuesCount = seedLibrary.data.cueContracts.length;
    expect(bentocuesCount).toBeGreaterThan(0);  

    // Seed the second reference library store on Peer 1
    const seedRefLibrary = await peer1.seedPublicLibraryRef ? await peer1.seedPublicLibraryRef() : seedLibrary;
    refLibCount = seedRefLibrary.data.cueContracts ? seedRefLibrary.data.cueContracts.length : bentocuesCount;
    expect(refLibCount).toBeGreaterThan(0);
  }, 120000);

  it('Peer 1 generates invite and Peer 2 accepts it', async () => {  
    const inviteBundle = await peer1.generateInvite('peer1-test');
    
    expect(inviteBundle).toBeDefined();  
    expect(inviteBundle.base64String).toBeDefined();
    
    const hopInvite = 'hop:' + inviteBundle.bundle.publickey + inviteBundle.bundle.codename;
  
    const peer1IncomingPromise = peer1.waitForMessage((msg) => {
      return (msg.action === 'peer-record-saved');
    }, 150000);

    const peer1PUBKEYPromise = peer1.waitForMessage((msg) => {
      return (msg.action === 'network-keys');
    }, 150000);

    const peer2IncomingPromise = peer2.waitForMessage((msg) => {
      return (
        msg.action === 'peer-record-saved' ||
        msg.type === 'network-notification' ||
        msg.action === 'osmosis-replication'
      );
    }, 150000);

    const connectionSuccess = await peer2.acceptInvite('peer2-test', hopInvite);

    const peer1Confirm = await peer1IncomingPromise;
    const peer1Pubkey = await peer1PUBKEYPromise;
    const peer2Confirm = await peer2IncomingPromise;
    
    peer1PublicKey = peer1Pubkey.data.publickey

    expect(connectionSuccess).toBeDefined();
    expect(peer1Confirm).toBeDefined();
    expect(peer2Confirm).toBeDefined();
  }, 150000);

  it('Peer 2 explicitly starts osmosis replication for both public libraries and validates completion', async () => {
    console.log('Dual library osmosis replication start message-----------')
    
    peer2.send({
      type: 'network',
      action: 'osmosis-request-replication',
      data: {
        targetPeerKey: peer1PublicKey,
        stores: ['bentocues', 'publiclibrary-ref']
      }
    })

    console.log(`[osmosis:test] Awaiting full replication for target counts -> bentocues: ${bentocuesCount}, publiclibrary-ref: ${refLibCount}`)

    // Wait until completion signal confirms both stores have finished processing
    const completionSignal = await peer2.waitForMessage((msg) => {
      return (
        msg.type === 'osmosis' &&
        msg.action === 'osmosis-replication-complete' &&
        msg.stores &&
        msg.stores.includes('bentocues') &&
        msg.stores.includes('publiclibrary-ref')
      )
    }, 150000)

    expect(completionSignal).toBeDefined()

   // Query and validate each independent Hyperbee store separately to ensure 
   // individual data streams have fully settled on disk.
   console.log('[osmosis:test] Querying bentocues Hyperbee count independently...')
   const peer2BentocuesCount = await peer2.getHyperbeeCount('bentocues')
   console.log(`[osmosis:test] Final bentocues count -> Peer 2: ${peer2BentocuesCount?.data?.length} | Peer 1 Target: ${bentocuesCount}`)
   expect(peer2BentocuesCount?.data?.length).toEqual(bentocuesCount)

   console.log('[osmosis:test] Querying publiclibrary-ref Hyperbee count independently...')

   console.log(refLibCount)
   const peer2RefLibCount = await peer2.getHyperbeeCount('publiclibrary-ref')
      console.log(peer2RefLibCount)
   console.log(`[osmosis:test] Final publiclibrary-ref count -> Peer 2: ${peer2RefLibCount?.referenceContracts?.length} | Peer 1 Target: ${refLibCount}`)
   expect(peer2RefLibCount?.referenceContracts?.length).toEqual(refLibCount)
  }, 150000)

});