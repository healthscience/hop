import WebSocket from 'ws';  
  
/**  
 * Boots the HOP engine, connects a WebSocket, authenticates,   
 * and returns the client along with the JWT and message helper.  
 */  
export async function setupHopTestEnvironment(enginePath = '../../src/index.js') {  
  // 1. Inject storage parameter  
  if (!process.argv.includes('test-hop-storage')) {  
    process.argv.push('test-hop-storage');  
  }  
  
  // 2. Load the core engine in-memory  
  await import(enginePath);  
  
  // Prevent hard crash on disconnect  
  process.exit = (code) => console.log(`[Test Environment] Intercepted process.exit(${code}) cleanly.`);  
  
  // Give server time to bind  
  await new Promise((resolve) => setTimeout(resolve, 4000));  
  
  const wsClient = new WebSocket(`wss://127.0.0.1:9888`, {   
    rejectUnauthorized: false,  
    headers: { origin: 'https://localhost:5173' }  
  });   
  
  await new Promise((resolve, reject) => {  
    wsClient.once('open', resolve);  
    wsClient.once('error', reject);  
  });  
  
  // --- Setup the Global Listener ---  
  let messageWaiters = [];  
  wsClient.on('message', (rawBuffer) => {  
    try {  
      const msg = JSON.parse(rawBuffer.toString());  
      messageWaiters = messageWaiters.filter(waiter => {  
        if (waiter.conditionFn(msg)) {  
          waiter.resolve(msg);  
          return false;  
        }  
        return true;  
      });  
    } catch (err) {  
      // Ignore non-JSON  
    }  
  });  
  
  const waitForMessage = (conditionFn, timeoutMs = 15000) => {  
    return new Promise((resolve, reject) => {  
      const timer = setTimeout(() => reject(new Error('Timeout waiting for message')), timeoutMs);  
      messageWaiters.push({  
        conditionFn,  
        resolve: (msg) => {  
          clearTimeout(timer);  
          resolve(msg);  
        }  
      });  
    });  
  };  
  
  // --- Authenticate ---  
  wsClient.send(JSON.stringify({    
    type: 'hop-auth',    
    action: 'verify-crypto-wasm',    
    reftype: 'verify-return',    
    task: 'verify-peer',    
    data: { pwd: 'testbee' }    
  }));  
  
  let jwt = '';  
  await waitForMessage((msg) => {  
    if (msg.action === 'hop-holepunch-live') {  
      jwt = msg.data.jwt;  
      return true;  
    }  
    return false;  
  }, 8000).catch(() => console.warn('[Test] Auth timeout'));  
  
  await new Promise((resolve) => setTimeout(resolve, 1000));  
  
  // Return the necessary tools to the test file  
  return {  
    wsClient,  
    jwt,  
    waitForMessage  
  };  
}  
  
/**  
 * Safely closes the WebSocket connection.  
 */  
export function teardownHopTestEnvironment(wsClient) {  
  if (wsClient && wsClient.readyState === WebSocket.OPEN) {  
    wsClient.close();  
  }  
}