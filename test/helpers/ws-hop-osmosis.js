import WebSocket from 'ws';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import EventEmitter from 'events';

import { createInviteBundle } from './inviteUtility.js';


export async function setupHopTestEnvironment(options) {
  const { enginePath, port, storename, passphrase } = options;

  const emitter = new EventEmitter();

  const baseHOPStepsUp = path.join(__dirname, '..', '..');
  const child = spawn('/usr/bin/npm', ['run', 'start', '--test-storage-name', String(storename), '--port', String(port)], { cwd: baseHOPStepsUp });

  child.stdout.on('data', (data) => {
    console.log(`[TESTPeer:${port}] ${data.toString().trim()}`);
  });

  child.stderr.on('data', (data) => {
    console.error(`[TESTPeer:${port} ERR] ${data.toString().trim()}`);
  });

  await new Promise((resolve) => setTimeout(resolve, 3000));

  const wsClient = new WebSocket(`wss://127.0.0.1:${port}`, {
    rejectUnauthorized: false,
    headers: {
      origin: 'https://localhost:5173'
    }
  });

  await new Promise((resolve, reject) => {
    wsClient.once('open', resolve);
    wsClient.once('error', reject);
  });

  // Persistent history buffer prevents missing events that arrive before listener registration
  const eventHistory = [];
  let messageWaiters = [];
  let jwt = '';
  let swarmPubkey = '';

  wsClient.on('message', (rawBuffer) => {
    try {
      const msg = JSON.parse(rawBuffer.toString());
      eventHistory.push(msg);

      // Emit on our generic event emitter so tests/waiters can listen to raw events too
      emitter.emit('message', msg);
      if (msg.action) {
        emitter.emit(msg.action, msg);
      }
      if (msg.type) {
        emitter.emit(msg.type, msg);
      }

      // Passively update critical keys when seen on wire
      if (msg.action === 'network-keys' && msg.data?.publickey) {
        swarmPubkey = msg.data.publickey;
      }
      if (msg.action === 'hop-holepunch-live' && msg.data?.jwt) {
        jwt = msg.data.jwt;
      }

      // Check active pending waiters
      messageWaiters = messageWaiters.filter((waiter) => {
        if (waiter.conditionFn(msg)) {
          waiter.resolve(msg);
          return false;
        }
        return true;
      });
    } catch (err) {}
  });

  const waitForMessage = (conditionFn, timeoutMs = 150000) => {
    return new Promise((resolve, reject) => {
      // 1. Check history first to resolve race conditions
      const historicalMatch = eventHistory.find((msg) => {
        try {
          return conditionFn(msg);
        } catch {
          return false;
        }
      });

      if (historicalMatch) {
        return resolve(historicalMatch);
      }

      // 2. Fall back to active message waiter
      const timer = setTimeout(() => {
        messageWaiters = messageWaiters.filter((w) => w.resolve !== resolveWrapper);
        reject(new Error(`Timeout (${timeoutMs}ms) waiting for message on port ${port}`));
      }, timeoutMs);

      const resolveWrapper = (msg) => {
        clearTimeout(timer);
        resolve(msg);
      };

      messageWaiters.push({ conditionFn, resolve: resolveWrapper });
    });
  };

  // 1. Wait for state signal (hop-anchor or hop-locked)
  const anchorStateMsg = await waitForMessage((msg) => {
    return msg.action === 'hop-anchor' || msg.action === 'hop-locked';
  }, 500000).catch(() => null);

  if (anchorStateMsg && anchorStateMsg.action === 'hop-anchor') {
    // 2. Genesis setup
    wsClient.send(JSON.stringify({
      type: 'hop-auth',
      action: 'request-crypto-wasm',
      data: { pwd: passphrase, entropy: 'random-test-entropy-string' },
      bbid: 'test-bbid'
    }));

    await waitForMessage((msg) => msg.action === 'crypto-wasm-pubkey', 10000)
      .catch(() => console.warn(`[Test:${port}] Failed to get crypto pubkey`));
  }

  // 3. Verify identity / unlock seed
  wsClient.send(JSON.stringify({
    type: 'hop-auth',
    action: 'verify-crypto-wasm',
    reftype: 'verify-return',
    task: 'verify-peer',
    data: { pwd: passphrase }
  }));

  // 4. Wait for live session token
  await waitForMessage((msg) => msg.action === 'hop-holepunch-live', 100000)
    .catch(() => console.warn(`[Test:${port}] Auth timeout`));

  const send = (messageHOP) => {
    wsClient.send(JSON.stringify({
      type: messageHOP.type,
      action: messageHOP.action,
      reftype: messageHOP.reftype || null,
      task: messageHOP.task || null,
      privacy: messageHOP.privacy || null,
      data: messageHOP.data,
      bbid: 'test-bbid',
      jwt
    }));
  };

  // Operational Peer Helpers
  const seedGenesisLibrary = async () => {
    send({ type: 'library', action: 'genesis-datatypes-cues' });
    return await waitForMessage((msg) => msg.action === 'seed-base-biology', 150000);
  };

const generateInvite = async (peerName) => {
    const { bundle, base64String } = await createInviteBundle(peerName, swarmPubkey);
    
    // Atomically register the codename intent with Peer 1's HOP backend
    send({
      type: 'network',
      action: 'share',
      task: 'peer-share-codename',
      reftype: null,
      privacy: 'private',
      data: bundle
    });

    return { bundle, base64String };
  };

  const sendInvite = async (bundle) => {
    send({
      type: 'network',
      action: 'share',
      task: 'peer-share-codename',
      reftype: null,
      privacy: 'private',
      data: bundle
    });
    return await waitForMessage((msg) => msg.action === 'codename-shared', 150000);
  };

const acceptInvite = async (peerName, base64InviteCode) => {

    let peerPair = {}
    peerPair.publickey = base64InviteCode
    peerPair.name = peerName
    peerPair.longterm = true
    peerPair.topic = ''
    peerPair.settopic = false
    peerPair.live = false

    send({
      type: 'network',
      action: 'share',
      task: 'peer-share-invite',
      reftype: null,
      privacy: 'private',
      data: peerPair
    });

    // Since Peer 2's WebSocket doesn't receive any connection confirmation message (only periodic safeflow-ecs ticks), 
    // waiting here would result in an infinite timeout/hang. 
    // Instead, we resolve after a small delay (1000ms) to allow the send command to be fully processed by the backend.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return true;
  };

  const requestOsmosis = async (targetPubkey) => {
    send({
      type: 'library',
      action: 'start-osmosis',
      data: { store: targetPubkey }
    });
    return await waitForMessage((msg) => msg.action === 'osmosis-complete', 30000);
  };

  const getHyperbeeCount = async (libStore) => {
    let pubLibRoute = ''
    let dtSeedorPeer = 'common'
    if (libStore === 'bentocues') {
      pubLibRoute = 'cues'
    } else if (libStore === 'publiclibrary-ref') {
      pubLibRoute = 'contracts'
      dtSeedorPeer = 'common'
    }

    let sendMessage = { type: 'library', action: pubLibRoute, task: 'GET', privacy: 'public', data: dtSeedorPeer }
    console.log('form message to get pub library type')
    console.log(sendMessage)

    send(sendMessage);

    const countMsg = await waitForMessage((msg) => {
      if (msg.type !== 'safeflow-ecs') {
      }
      if (libStore === 'bentocues') {
        return msg.action === 'cues-history'
      } else if (msg.action === 'publiclibrary-ref') {
        return true
      }
    }, 150000)

    return countMsg;
  };

 // Add inside setupHopTestEnvironment
  const waitForEvent = (actionName, timeoutMs = 150000) => {
    return waitForMessage((msg) => msg.action === actionName, timeoutMs);
  };

  const getStoreStats = async (libStore) => {
    let pubLibRoute = libStore === 'bentocues' ? 'cues' : 'contracts';
    send({ type: 'library', action: pubLibRoute, task: 'STATS', privacy: 'public' });
    return await waitForMessage((msg) => msg.action === `${pubLibRoute}-stats`, 10000);
  };

  return {
    on: emitter.on.bind(emitter),
    once: emitter.once.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter),
    instance: child,
    wsClient,
    get jwt() { return jwt; },
    get swarmPubkey() { return swarmPubkey; },
    eventHistory,
    waitForMessage,
    waitForEvent, // <--- Export here
    send,
    seedGenesisLibrary,
    generateInvite,
    sendInvite,
    acceptInvite,
    requestOsmosis,
    getHyperbeeCount,
    getStoreStats
  };
}

export async function stopPeer(peer) {
  if (peer?.wsClient && peer.wsClient.readyState === WebSocket.OPEN) {
    peer.wsClient.close();
  }
  if (peer?.instance && typeof peer.instance.kill === 'function') {
    peer.instance.kill('SIGTERM');
  }
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

export function teardownHopTestEnvironment(wsClient, instance, storename) {
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {
    wsClient.close();
  }
  if (instance && typeof instance.kill === 'function') {
    instance.kill('SIGTERM');
  }

  if (storename) {
    const storePath = path.join(
      os.homedir(),
      storename.startsWith('.') ? storename : `.${storename}`
    );
    if (fs.existsSync(storePath)) {
      fs.rmSync(storePath, { recursive: true, force: true });
    }
  }
}