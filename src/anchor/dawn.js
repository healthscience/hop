'use strict'
/**
*  HOP dawning of new peer and integrity every peer experience
*
* @class AnchorDawn
* @package    HOP
* @copyright  Copyright (c) 2026 James Littlejohn
* @license    http://www.gnu.org/licenses/old-licenses/gpl-3.0.html
* @version    $Id$
*/
import EventEmitter from 'events'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'
import b4a from 'b4a'
import initHeli, { HeliCore } from 'heliclock-hop'
import initCrypto, { SovereignKeypair, initSync, derive_master_seed } from 'hop-crypto'

class AnchorDawn extends EventEmitter {

  constructor(storeName) {
    super()
    this.peerStore = ''
    this.setStorename(storeName)
    this.wasmCrypto = {}
    this.HeliClock = {}
  }

  /**
   * set store name
   * @method setStorename
   *
  */
  setStorename = function (storeName) {
    if (storeName === undefined || storeName?.length === 0) {
      this.peerStore = '.hop-storage'
    } else {
      this.peerStore = '.' + storeName
    }
  }

  /**
   * initialize WASM modules
   * @method initWASM
   *
  */
  initWASM = async function () {
    // Initialize HeliClock WASM
    try {
      await initHeli()
      this.HeliClock = HeliCore
    } catch (err) {
      console.warn('HeliClock init failed or already initialized', err)
    }

    // Initialize hop-crypto WASM
    try {
      if (typeof window === 'undefined') {
        const wasmPath = new URL('../../node_modules/hop-crypto/hop_crypto_bg.wasm', import.meta.url)
        const wasmBuffer = await fs.readFile(fileURLToPath(wasmPath))
        const wasmExports = initSync({ module: wasmBuffer })
        console.log('hop-crypto WASM initialized (Node.js)')
        if (wasmExports.init_panic_hook) wasmExports.init_panic_hook()
        return wasmExports
      } else {
        const wasmExports = await initCrypto()
        if (wasmExports.init_panic_hook) wasmExports.init_panic_hook()
        return wasmExports
      }
    } catch (err) {
      console.warn('hop-crypto init failed or already initialized', err)
      return await import('hop-crypto')
    }
  }

  setCryptoWASM = function () {
    const wasmPath = new URL('../node_modules/hop-crypto/hop_crypto_bg.wasm', import.meta.url);
    this.wasmCrypto = wasmPath.init()
  }


  /**
   * get identity path
   * @method getIdentityPath
   *
  */
  getIdentityPath = function () {
    return path.join(os.homedir(), this.peerStore, 'dawn', 'seed.enc')
  }

  /**
   * check if encrypted seed exists
   * @method initialize
   *
  */
  initialize = async function () {
    const IDENTITY_PATH = this.getIdentityPath()

    // 1. Check for physical file presence
    let hasIdentity = false
    try {
      await fs.access(IDENTITY_PATH)
      hasIdentity = true
    } catch (e) {
      hasIdentity = false
    }

    if (!hasIdentity) {
      // Peer is new. We stay in Cold Mode.
      // We notify BentoBoxDS to start the "Genesis handshake".
      return { type: 'STATUS_GENESIS' }
    }

    // 2. Identity exists. Wait for Peer to provide the Unlock Key.
    return { type: 'STATUS_LOCKED' }
  }

  // Inside HOP Anchor (Using the same Sovereign WASM)
  /**
   * generate master identity
   * @method generateMasterIdentity
   *
  */
  generateMasterIdentity = async function (password, salt) {
    const IDENTITY_PATH = this.getIdentityPath()

    // Security: Ensure we don't overwrite an existing seed
    try {
      await fs.access(IDENTITY_PATH)
      throw new Error('Identity already exists. Cannot overwrite.')
    } catch (e) {
      if (e.message === 'Identity already exists. Cannot overwrite.') throw e
      // File doesn't exist, proceed
    }

    // 1. Key Stretching (The "Shield")
    // We use Argon2id via WASM to turn a human password into a 32-byte Master Seed.
    // This takes ~500ms-1s to make brute-force attacks expensive.
    const wasmExports = await this.initWASM()
    
    // Ensure salt is a proper Uint8Array (handles Object with numeric keys)
    let saltBuffer
    if (salt && typeof salt === 'object' && !ArrayBuffer.isView(salt)) {
      saltBuffer = new Uint8Array(Object.values(salt))
    } else {
      saltBuffer = (typeof salt === 'string') ? b4a.from(salt) : (salt || crypto.randomBytes(16))
    }

    const masterSeed = derive_master_seed(password, saltBuffer)
    console.log('masterSeed length:', masterSeed.length, 'first 4 bytes:', masterSeed.subarray(0, 4))
    
    // 2. Identity Birth
    // Now we use that Seed to initialize the Sovereign Keypair
    const pair = new SovereignKeypair(masterSeed)
    const pubKey = pair.get_public_key()

    // 3. Persistent Storage
    // We encrypt the Master Seed using a derivative of the password 
    // and save it as seed.enc.
    await this.saveEncryptedSeed(masterSeed, password)

    // 4. Clean the Buffer
    // masterSeed.fill(0) // Using zeroize if available or fill(0)
    if (wasmExports.zeroize) {
      wasmExports.zeroize(masterSeed)
    } else if (masterSeed.fill) {
      masterSeed.fill(0)
    }

    return b4a.toString(pubKey, 'hex')
  }

  /**
   * save encrypted seed
   * @method saveEncryptedSeed
   *
  */
  saveEncryptedSeed = async function (masterSeed, password) {
    const IDENTITY_PATH = this.getIdentityPath()
    const IDENTITY_DIR = path.dirname(IDENTITY_PATH)

    // Ensure directory exists
    await fs.mkdir(IDENTITY_DIR, { recursive: true })

    // 1. Derive a 32-byte key from the password using Argon2id
    // We use a unique salt for the encryption key derivation
    const wasmExports = await this.initWASM()
    
    // Ensure salt is a proper Uint8Array (handles Object with numeric keys)
    const encryptionSalt = crypto.randomBytes(16)
    const encryptionKey = derive_master_seed(password, encryptionSalt)

    // 2. Encrypt the master seed using AES-256-GCM
    const iv = crypto.randomBytes(12) // 96-bit IV for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey, iv)
    
    let encryptedSeed = cipher.update(masterSeed)
    encryptedSeed = Buffer.concat([encryptedSeed, cipher.final()])
    const authTag = cipher.getAuthTag()

    // 3. Combine Salt, IV, Auth Tag, and Encrypted Seed
    // Format: [salt(16)][iv(12)][authTag(16)][encryptedSeed]
    const finalPayload = Buffer.concat([encryptionSalt, iv, authTag, encryptedSeed])

    // 4. Write to file
    await fs.writeFile(IDENTITY_PATH, finalPayload)
    
    // Clean up sensitive key
    if (wasmExports.zeroize) {
      wasmExports.zeroize(encryptionKey)
    } else if (encryptionKey.fill) {
      encryptionKey.fill(0)
    }
  }

  /**
   * unlock identity and activate P2P network
   * @method unlockAndActivate
   *
  */
  unlockAndActivate = async function (password) {
    const IDENTITY_PATH = this.getIdentityPath()
    
    // 1. Read encrypted seed
    const payload = await fs.readFile(IDENTITY_PATH)
    
    // Format: [salt(16)][iv(12)][authTag(16)][encryptedSeed]
    const salt = payload.subarray(0, 16)
    const iv = payload.subarray(16, 28)
    const authTag = payload.subarray(28, 44)
    const encryptedSeed = payload.subarray(44)

    // 2. Initialize WASM for decryption
    await this.initWASM()

    // 3. Derive encryption key
    const wasmExports = await this.initWASM()
    
    // Ensure salt is a proper Uint8Array (handles Object with numeric keys)
    let saltBuffer
    if (salt && typeof salt === 'object' && !ArrayBuffer.isView(salt)) {
      saltBuffer = new Uint8Array(Object.values(salt))
    } else {
      saltBuffer = (typeof salt === 'string') ? b4a.from(salt) : salt
    }

    const encryptionKey = derive_master_seed(password, saltBuffer)
    console.log('encryptionKey length:', encryptionKey.length)

    // 4. Decrypt
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey, iv)
    decipher.setAuthTag(authTag)
    
    let masterSeed = decipher.update(encryptedSeed)
    masterSeed = Buffer.concat([masterSeed, decipher.final()])

    // 5. Initialize Sovereign Keypair
    const pair = new SovereignKeypair(masterSeed)
    const pubKey = pair.get_public_key()

    // 6. Clean up
    if (wasmExports.zeroize) {
      wasmExports.zeroize(encryptionKey)
    } else if (encryptionKey.fill) {
      encryptionKey.fill(0)
    }
    // masterSeed.fill(0) // Keep if needed for P2P init, but usually we just need the pair

    return { pubKey: b4a.toString(pubKey, 'hex'), masterSeed }
  }

}

export default AnchorDawn
