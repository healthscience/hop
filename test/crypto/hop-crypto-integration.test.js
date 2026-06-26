import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import os from 'os';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import initCrypto, { SovereignKeypair, initSync } from 'hop-crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testTimeout = 15000;
let wsClient;
const serverPort = 9888;
let hopProcess;
let hopToken;
let sovereignPubKey;

beforeAll(async () => {
  const wasmPath = path.join(__dirname, '../../node_modules/hop-crypto/hop_crypto_bg.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);
  initSync(wasmBuffer);

  const baseHOPStepsUp = path.join(__dirname, '../..');
  hopProcess = spawn('node', ['src/index.js', 'test-hop-crypto-storage'], { stdio: 'pipe', cwd: baseHOPStepsUp });
  hopProcess.stdout.on('data', (data) => console.log(`HOP STDOUT: ${data}`));
  hopProcess.stderr.on('data', (data) => console.error(`HOP STDERR: ${data}`));

  await new Promise((resolve) => setTimeout(resolve, 4000));

  const wsOptions = {
    rejectUnauthorized: false,
    cert: fs.readFileSync(path.join(__dirname, '../ssh', 'cert.pem')),
    key: fs.readFileSync(path.join(__dirname, '../ssh', 'key.pem')),
    headers: {
      Origin: 'https://localhost:5173'
    }
  };
  wsClient = new WebSocket(`wss://127.0.0.1:${serverPort}`, wsOptions);

  await new Promise((resolve, reject) => {
    wsClient.on('open', resolve);
    wsClient.on('error', reject);
  });
});

afterAll(async () => {
  if (wsClient) {
    wsClient.close();
  }
  if (hopProcess) {
    hopProcess.kill();
  }
  await new Promise(resolve => setTimeout(resolve, 2000));
  const storagePath = path.join(os.homedir(), '.test-hop-crypto-storage');
  try {
    await fsPromises.rm(storagePath, { recursive: true, force: true });
  } catch (err) {}
});

describe('HOP Crypto Integration', () => {
  it('should handle the genesis identity creation handshake', async () => {
    const entropy = new Uint8Array(32 + 16 + 16);
    for (let i = 0; i < entropy.length; i++) {
      entropy[i] = i % 256;
    }

    const requestWasmMsg = {
      type: 'hop-auth',
      action: 'request-crypto-wasm',
      reftype: 'genesis-handshake',
      task: 'genesis-handshake',
      data: {
        pwd: 'test-password-123',
        entropy: Array.from(entropy)
      }
    };

    wsClient.send(JSON.stringify(requestWasmMsg));

    await new Promise((resolve, reject) => {
      const handler = (data) => {
        const message = JSON.parse(data);
        if (message.type === 'account' && message.action === 'crypto-wasm-pubkey') {
          expect(message.data).toBeTypeOf('string');
          expect(message.data.length).toBeGreaterThan(0);
          sovereignPubKey = message.data;
          wsClient.off('message', handler);
          resolve();
        }
      };
      wsClient.on('message', handler);
      setTimeout(() => reject(new Error('Genesis handshake timeout')), 5000);
    });
  });

  it('should handle verify and unlocking to connect to HOP P2P network', async () => {
    const verifyMsg = {
      type: 'hop-auth',
      action: 'verify-crypto-wasm',
      reftype: 'verify-return',
      task: 'verify-peer',
      data: {
        pwd: 'test-password-123'
      }
    };

    wsClient.send(JSON.stringify(verifyMsg));

    let receivedUnlock = false;
    let receivedHolepunchLive = false;

    await new Promise((resolve, reject) => {
      const handler = (data) => {
        const message = JSON.parse(data);
        if (message.type === 'account') {
          if (message.action === 'unlocked-verify-complete') {
            expect(message.data.verified).toBe(true);
            expect(message.data.unlocked).toBe(true);
            expect(message.data.pubKey).toBe(sovereignPubKey);
            receivedUnlock = true;
          }
          if (message.action === 'hop-holepunch-live') {
            expect(message.data.auth).toBe(true);
            expect(message.data.jwt).toBeTypeOf('string');
            hopToken = message.data.jwt;
            receivedHolepunchLive = true;
          }
        }

        if (receivedUnlock && receivedHolepunchLive) {
          wsClient.off('message', handler);
          resolve();
        }
      };
      wsClient.on('message', handler);
      setTimeout(() => reject(new Error('Verify and unlock timeout')), 10000);
    });
  });
});
