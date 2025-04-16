import { describe, it, expect, beforeAll, afterAll, test } from 'vitest';
import { spawn } from 'child_process';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';

// Set global test timeout to 10 seconds
const testTimeout = 10000;

let wsClient;
const serverPort = 9888;
let hopProcess;

// Start the HOP server before all tests
beforeAll(async () => {
  const baseHOPStepsUp = path.join(__dirname, '..');
  hopProcess = spawn('npm', ['run', 'start'], { stdio: 'inherit', cwd: baseHOPStepsUp });
  
  // Wait for server to start
  await new Promise((resolve) => {
    setTimeout(resolve, 3000); // Wait for server to fully start
  });
});

// Stop the server after all tests
afterAll(() => {
  if (hopProcess) {
    hopProcess.kill();
  }
});

describe('HOP Chart Query Flow', () => {
  it('should process chart command with numbers 1, 2, 3', async () => {
    // Connect WebSocket client using secure connection
    // Create WebSocket client with options to accept self-signed certificates
    const wsOptions = {
      rejectUnauthorized: false, // Accept self-signed certificates
      cert: fs.readFileSync(path.join(__dirname, '..', 'test/ssh', 'cert.pem')),
      key: fs.readFileSync(path.join(__dirname, '..', 'test/ssh', 'key.pem'))
    };
    wsClient = new WebSocket(`wss://127.0.0.1:${serverPort}`, { 
      ...wsOptions
    });
    
    // Wait for connection to be established
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
        resolve();
      });
      
      wsClient.on('error', (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      });
      
      wsClient.on('close', (code, reason) => {
        console.log('WebSocket closed:', code, reason);
        reject(new Error(`WebSocket closed unexpectedly: ${reason}`));
      });
    }).catch((error) => {
      console.error('Failed to connect:', error);
      throw error;
    });

    let hoptoken;
    let summaryReceived = false;
    let networkDataReceived = false;
    let chartDataReceived = false;
    let chartData;
    
    // Wait for all responses using a single message handler
    await new Promise((resolve, reject) => {
      const messageHandler = (data) => {
        const message = JSON.parse(data.toString());
       
        try {
          if (message.type === 'hop-auth' && message.action === 'start') {
            // Store the token for later use
            hoptoken = message.data.jwt;
            
            // Send the verification message
            const verifyMessage = {
              type: 'account',
              action: 'hop-verify',
              data: { auth: true, jwt: hoptoken }
            };
            wsClient.send(JSON.stringify(verifyMessage));
          } else if (message.type === 'account' && message.action === 'hop-verify') {
            // Send the chart command with JWT token using HOP's message format
            const chartCommand = 'chart 1 2 3';
            const inFlow = {
              type: 'bbai',
              reftype: 'ignore',
              action: 'question',
              data: { text: chartCommand },
              bbid: 'test-123',
              jwt: message.data.jwt
            };
            wsClient.send(JSON.stringify(inFlow));
          } else if (message.type === 'sf-summary') {
            summaryReceived = true;
            expect(message.type).toBe('sf-summary');
          } else if (message.type === 'sf-newEntityRange') {
            // Extract and validate chart data
            chartData = message.data;
            expect(chartData).toBeDefined();
            
            // Validate chart data structure
            const dataset = chartData.data.chartPackage.datasets[0];
            expect(dataset).toBeDefined();
            expect(dataset.data).toBeDefined();
            expect(Array.isArray(dataset.data)).toBe(true);
            expect(dataset.data.length).toBe(3);
            
            // Verify the actual data values
            expect(dataset.data).toEqual(['1', '2', '3']);
            
            // Verify other chart properties
            expect(dataset.fillColor).toBeDefined();
            expect(dataset.borderWidth).toBe(1);
            expect(dataset.borderColor).toBeDefined();
            expect(dataset.backgroundColor).toBeDefined();
            
            chartDataReceived = true;
            resolve();
          } else if (message.type === 'sf-networkdata') {
            networkDataReceived = true;
            expect(message.type).toBe('sf-networkdata');
            expect(message.data.sequence).toEqual([1, 2, 3]);
          }
          
          // Resolve when all expected messages and data are received
          if (chartDataReceived && summaryReceived && networkDataReceived) {
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      };
      
      // Add event listener for response
      wsClient.on('message', messageHandler);
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        wsClient.off('message', messageHandler);
        reject(new Error('Authentication timeout'));
      }, testTimeout);
    });
  }, testTimeout); // Set timeout for this specific test
});