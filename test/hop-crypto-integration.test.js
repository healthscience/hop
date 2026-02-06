import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import os from 'os';
import fsPromises from 'fs/promises';
import { fileURLToPath } from 'url';
import initCrypto, { SovereignKeypair, verify_coherence, initSync } from 'hop-crypto';

const testTimeout = 15000;
let wsClient;
const serverPort = 9888;
let hopProcess;
let hopToken;

beforeAll(async () => {
  const wasmPath = path.join(__dirname, '../node_modules/hop-crypto/hop_crypto_bg.wasm');
  const wasmBuffer = fs.readFileSync(wasmPath);
  initSync(wasmBuffer);

  const baseHOPStepsUp = path.join(__dirname, '..');
  hopProcess = spawn('npm', ['run', 'start', '--', 'test-hop-crypto-storage'], { stdio: 'pipe', cwd: baseHOPStepsUp });
  hopProcess.stdout.on('data', (data) => console.log(`HOP STDOUT: ${data}`));
  hopProcess.stderr.on('data', (data) => console.error(`HOP STDERR: ${data}`));

  await new Promise((resolve) => setTimeout(resolve, 4000));

  const wsOptions = {
    rejectUnauthorized: false,
    cert: fs.readFileSync(path.join(__dirname, '..', 'test/ssh', 'cert.pem')),
    key: fs.readFileSync(path.join(__dirname, '..', 'test/ssh', 'key.pem'))
  };
  wsClient = new WebSocket(`wss://127.0.0.1:${serverPort}`, wsOptions);

  await new Promise((resolve, reject) => {
    wsClient.on('open', resolve);
    wsClient.on('error', reject);
  });
});

afterAll(async () => {
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
  it('should authenticate with a valid Schnorr signature', async () => {
    const keypair = new SovereignKeypair();
    const pubkey = keypair.get_public_key();
    const msg = "auth-me";
    const sig = keypair.sign_intent(msg);

    const authMessage = {
      type: 'hop-auth',
      reftype: 'self-auth',
      action: 'start',
      data: {
        pubkey: Buffer.from(pubkey).toString('hex'),
        sig: Buffer.from(sig).toString('hex'),
        msg: msg
      },
      bbid: 'test-auth'
    };

    wsClient.send(JSON.stringify(authMessage));

    await new Promise((resolve, reject) => {
      const handler = (data) => {
        const message = JSON.parse(data);
        if (message.type === 'account' && message.action === 'hop-verify') {
          expect(message.data.auth).toBe(true);
          hopToken = message.data.jwt;
          wsClient.off('message', handler);
          resolve();
        }
      };
      wsClient.on('message', handler);
      setTimeout(() => reject(new Error('Auth timeout')), 5000);
    });
  });

  it('should verify a signature via crypto routing', async () => {
    const keypair = new SovereignKeypair();
    const pubkey = keypair.get_public_key();
    const msg = "verify-this";
    const sig = keypair.sign_intent(msg);

    const verifyMessage = {
      type: 'crypto',
      action: 'verify',
      data: {
        pubkey: Buffer.from(pubkey).toString('hex'),
        sig: Buffer.from(sig).toString('hex'),
        msg: msg
      },
      bbid: 'test-verify',
      jwt: hopToken
    };

    wsClient.send(JSON.stringify(verifyMessage));

    await new Promise((resolve, reject) => {
      const handler = (data) => {
        const message = JSON.parse(data);
        if (message.type === 'crypto-reply' && message.action === 'verify') {
          expect(message.data.valid).toBe(true);
          wsClient.off('message', handler);
          resolve();
        }
      };
      wsClient.on('message', handler);
      setTimeout(() => reject(new Error('Verify timeout')), 5000);
    });
  });
});
