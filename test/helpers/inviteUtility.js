// inviteUtils.js  
// Universal Utility for Invite Generation (Browser & Node.js)  
  
export const nameTo32Bytes = (name) => {  
  const buffer = new Uint8Array(32);  
  const encoded = new TextEncoder().encode(name || '');  
  buffer.set(encoded.slice(0, 32));  
  return buffer;  
};  
  
// Independent, reusable hashing function using standard Web Crypto API  
export const sha256Make = async (message) => {  
  const msgBuffer = new TextEncoder().encode(message);  
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);  
    
  const hashArray = Array.from(new Uint8Array(hashBuffer));  
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');  
  return hashHex;  
};  
  
// The main orchestration function  
export const createInviteBundle = async (peerName, publicKey) => {  
  const byteBuffer = nameTo32Bytes(peerName);  
    
  let binaryString = '';  
  for (let i = 0; i < byteBuffer.length; i++) {  
    binaryString += String.fromCharCode(byteBuffer[i]);  
  }  
    
  // Safe base64 encoding across environments  
  const base64String = typeof btoa !== 'undefined'   
    ? btoa(binaryString)   
    : Buffer.from(binaryString, 'binary').toString('base64');  
      
  // Calling the independent hashing function  
  const inviteHash = await sha256Make(base64String);  
    
  return {  
    bundle: {   
      name: peerName,   
      publickey: publicKey,   
      codename: inviteHash,   
      matched: false   
    },  
    base64String: base64String  
  };  
};