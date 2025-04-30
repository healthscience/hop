import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn } from 'child_process';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import os from 'os';
import fsPromises from 'fs/promises';
import PublicLibrarymin from './helpers/publicLibrary-build.js';

// Set global test timeout to 10 seconds
const testTimeout = 10000;

let wsClient;
const serverPort = 9888;
let hopProcess;
let hopToken;

// Start the HOP server and set up everything before all tests
beforeAll(async () => {
  const baseHOPStepsUp = path.join(__dirname, '..');
  hopProcess = spawn('npm', ['run', 'start', '--', '--store-name=hop-storage-test'], { stdio: 'inherit', cwd: baseHOPStepsUp });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Connect WebSocket client using secure connection
  const wsOptions = {
    rejectUnauthorized: false,
    cert: fs.readFileSync(path.join(__dirname, '..', 'test/ssh', 'cert.pem')),
    key: fs.readFileSync(path.join(__dirname, '..', 'test/ssh', 'key.pem'))
  };
  wsClient = new WebSocket(`wss://127.0.0.1:${serverPort}`, wsOptions);

  // Wait for WebSocket connection to open and send initial auth message
  await new Promise((resolve, reject) => {
    wsClient.on('open', () => {
      console.log('WebSocket connected');
      // Send initial auth message
      const authMessage = {
        type: 'hop-auth',
        reftype: 'self-auth',
        action: 'start',
        task: 'start',
        data: { pw: '' },
        bbid: ''
      };
      wsClient.send(JSON.stringify(authMessage));
      
      // Wait for JWT token response
      wsClient.on('message', (data) => {
        const message = JSON.parse(data);
        if (message.type === 'account' && message.action === 'hop-verify') {
          // set the token so can be use
          hopToken = message.data.jwt
          resolve();  // Resolve the Promise when we get the token
        }
      });

    });
    wsClient.on('error', reject);
  });

  // Prepare and send public library contracts
  const libraryHelper = new PublicLibrarymin({});
  const setupMessage = libraryHelper.prepareDefaultContracts();
  for (let contract of setupMessage) {
    contract.jwt = hopToken
    wsClient.send(JSON.stringify(contract));
  }
  // Wait for public library to be ready
  await new Promise((resolve) => setTimeout(resolve, 1000));
});

// Stop the server and clean up after all tests
afterAll(async () => {
  if (hopProcess) {
    hopProcess.kill();
  }

  // Add 3-second timeout to ensure proper shutdown
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Clean up ~/.test-hop-storage
  const storagePath = path.join(os.homedir(), '.test-hop-storage');
  try {
    await fsPromises.rm(storagePath, { recursive: true, force: true });
    console.log('Cleaned up ~/.test-hop-storage');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('Error cleaning up ~/.test-hop-storage:', err);
    }
  }
});

describe('HOP Chart Query Flow', () => {
  it('should process chart command with numbers 1, 2, 3', async () => {
    // Send chart command
    const chartQuestion = { text: 'chart 1 2 3', compute: 'observation' }
    const chartCommand = {
      type: 'bbai',
      reftype: 'ignore',
      action: 'question',
      data: chartQuestion,
      bbid: 'test123456',
      jwt: hopToken
    };
    wsClient.send(JSON.stringify(chartCommand));

    // Await and process responses as needed
    // Example: wait for a specific response or set of responses
    await new Promise((resolve, reject) => {
      let chartDataReceived = false;
      let summaryReceived = false;
      let networkDataReceived = false;

      const messageHandler = (data) => {
        try {
          const message = JSON.parse(data);
          console.log('message222')
          console.log(message)
          // Add your message type checks and assertions here
          if (message.type === 'sf-newEntityRange') {
            expect(message.data.data.chartPackage.datasets[0].data).toEqual(['1', '2', '3']);
            chartDataReceived = true;
            resolve();
          }
          if (message.type === 'summary') {
            summaryReceived = true;
          }
          if (message.type === 'network-data') {
            networkDataReceived = true;
          }
          // Resolve when all expected messages and data are received
          if (chartDataReceived && summaryReceived && networkDataReceived) {
            wsClient.off('message', messageHandler);
            resolve();
          }
        } catch (err) {
          wsClient.off('message', messageHandler);
          reject(err);
        }
      };

      wsClient.on('message', messageHandler);

      // Add timeout to prevent hanging
      setTimeout(() => {
        reject(new Error('Test timed out'));
      }, testTimeout);
    });
  }, testTimeout); // Set timeout for this specific test
});