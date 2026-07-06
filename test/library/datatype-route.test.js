import { describe, it, expect, beforeAll, afterAll } from 'vitest';    
import { setupHopTestEnvironment, teardownHopTestEnvironment } from '../helpers/ws-hop-setup.js'; // Adjust path  
  
const testTimeout = 25000;    
let wsClient, JWTlive, waitForMessage;  
  
beforeAll(async () => {    
  // Destructure the tools from our helper  
  const env = await setupHopTestEnvironment('../../src/index.js');  
  wsClient = env.wsClient;  
  JWTlive = env.jwt;  
  waitForMessage = env.waitForMessage;  
}, testTimeout);    
  
describe('HOP route for datatype create', () => {    
  it('should process a datatype reference contract save and confirm', async () => {    
    const inputData = {    
      primary: 'yes',    
      name: 'Heart Rate',    
      description: 'Beats per minute',    
      wiki: 'https://en.wikipedia.org/wiki/Heart_rate',    
      rdf: 'https://dbpedia.org/page/Heart_rate',    
      // measurement: 'bpm',    
      // datatypeType: 'integer'    
    };    
    
    const routerMessage = {    
      type: 'library',    
      action: 'contracts',    
      task: 'PUT',    
      privacy: 'public',    
      reftype: 'datatype',  
      jwt: JWTlive,   
      data: inputData    
    };    
    
    wsClient.send(JSON.stringify(routerMessage));    
  
    const returnPayload = await waitForMessage((msg) => {  
      return msg.action === 'reference-contract' && msg.task === 'save-complete';  
    }, 15000);  
    
    // Assertions  
    expect(returnPayload.data).toBeDefined();  
    expect(typeof returnPayload.data).toBe('object');  
    expect(returnPayload.data).not.toBeNull();
    expect(returnPayload.data.value.concept.name).toBe(inputData.name)
    expect(returnPayload.data.value.concept.description).toBe(inputData.description)
    expect(returnPayload.data.value.concept.wiki).toBe(inputData.wiki)
    expect(returnPayload.data.value.concept.rdf).toBe(inputData.rdf)
    // expect(returnPayload.data.contract.concept.measurement).toBe(inputData.measurement)
    // expect(returnPayload.data.contract.concept.datatypeType).toBe(inputData.datatypeType)        
  }, testTimeout);    
});    
    
afterAll(async () => {    
  teardownHopTestEnvironment(wsClient);  
});