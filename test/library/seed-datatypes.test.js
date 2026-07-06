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
  
describe('HOP library get of all datatype reference contracts', () => {    
  it('all the see reference contracts for HOP', async () => {        
    
    const routerMessage = {    
      type: 'library',    
      action: 'contracts',    
      task: 'GET',    
      privacy: 'public',    
      reftype: 'datatype',  
      jwt: JWTlive,   
      data: {}    
    };    
    
    wsClient.send(JSON.stringify(routerMessage));    
  
    const returnPayload = await waitForMessage((msg) => {
      return msg.action === 'publiclibrary-ref';
    }, 15000);  
    
    const libraryData = returnPayload.referenceContracts;
    
    // Assertions  
    console.log('after flter')
    console.log(libraryData)
    expect(libraryData[0]).toBeDefined();  
    expect(typeof libraryData[0]).toBe('object');  
    // expect(returnPayload.data).not.toBeNull();
    // expect(returnPayload.data.value.concept.name).toBe('dddd')
    // expect(returnPayload.data.value.concept.description).toBe('dddd')
    // expect(returnPayload.data.value.concept.wiki).toBe('')
    // expect(returnPayload.data.value.concept.rdf).toBe('')
    // expect(returnPayload.data.contract.concept.measurement).toBe(inputData.measurement)
    // expect(returnPayload.data.contract.concept.datatypeType).toBe(inputData.datatypeType)        
  }, testTimeout);    
});    
    
afterAll(async () => {    
  teardownHopTestEnvironment(wsClient);  
});