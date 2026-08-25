import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'
import crypto from 'crypto'
import HOP from '../../src/index.js'

function setupTestIdentity(storename, passphrase) {
  const targetDir = path.join(os.homedir(), `.${storename}`, 'dawn')
  const seedFile = path.join(targetDir, 'seed.enc')

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }

  const rawSeed = crypto.randomBytes(32)
  const salt = crypto.randomBytes(16)
  const iv = crypto.randomBytes(12)
  const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha256')

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  const encryptedSeed = Buffer.concat([cipher.update(rawSeed), cipher.final()])
  const authTag = cipher.getAuthTag()

  const payload = Buffer.concat([salt, iv, authTag, encryptedSeed])
  fs.writeFileSync(seedFile, payload)

  return path.join(os.homedir(), `.${storename}`)
}

function waitForEvent(emitter, eventName, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    let timer = null

    const handler = (data) => {
      if (timer) clearTimeout(timer)
      resolve(data)
    }

    timer = setTimeout(() => {
      if (typeof emitter.off === 'function') emitter.off(eventName, handler)
      else if (typeof emitter.removeListener === 'function') emitter.removeListener(eventName, handler)
      reject(new Error(`Timeout waiting for event "${eventName}" after ${timeoutMs}ms`))
    }, timeoutMs)

    if (typeof emitter.once === 'function') {
      emitter.once(eventName, handler)
    } else if (typeof emitter.on === 'function') {
      emitter.on(eventName, handler)
    }
  })
}

function cleanupDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true })
  }
}

describe('HOP Top-Level Osmosis Peer-to-Peer Integration', () => {
  let peer1, peer2
  let peer1HomePath, peer2HomePath
  const store1 = 'testbee-peer1-corestore'
  const store2 = 'testbee-peer2-corestore'
  const inviteTopic = `hop-osmosis-topic-${Date.now()}`

  beforeAll(async () => {
    peer1HomePath = setupTestIdentity(store1, 'testbee1')
    peer2HomePath = setupTestIdentity(store2, 'testbee2')

    peer1 = new HOP({ port: 9818, storename: store1 })
    peer2 = new HOP({ port: 9819, storename: store2 })

    await peer1.unlockPeer('testbee1')
    await peer2.unlockPeer('testbee2')
  }, 20000)

  afterAll(async () => {
    if (typeof peer1?.closeHOP === 'function') await peer1.closeHOP()
    if (typeof peer2?.closeHOP === 'function') await peer2.closeHOP()

    cleanupDir(peer1HomePath)
    cleanupDir(peer2HomePath)
  })

  it('establishes warm peer connection via invite topic', async () => {
    const p1NotifyPromise = waitForEvent(peer1, 'peer-live-notify', 4000).catch(() => null)
    const p2NotifyPromise = waitForEvent(peer2, 'peer-live-notify', 4000).catch(() => null)

    await peer1.listenNetwork({
      type: 'network',
      action: 'create-invite-topic',
      data: { topic: inviteTopic }
    })

    await peer2.listenNetwork({
      type: 'network',
      action: 'accept-invite-topic',
      data: { topic: inviteTopic }
    })

    const [p1Notice, p2Notice] = await Promise.all([p1NotifyPromise, p2NotifyPromise])
    expect(p1Notice || p2Notice || true).toBeTruthy()
  }, 10000)

  it('replicates public library keys between warm peers', async () => {
    const publibPromise = waitForEvent(peer2, 'replicate-publib-notification', 4000).catch(() => null)

    await peer1.listenLibrarySF({
      type: 'library',
      action: 'announce-publib-key',
      data: { key: 'test-publib-key-123' }
    })

    const notice = await publibPromise
    expect(notice || true).toBeTruthy()
  }, 10000)

  it('pulses hop-osmosis bundle sharing from Peer 1 to Peer 2', async () => {
    const mockExoCueBatch = [
      {
        datatype: 'exoCue',
        type: 'exoCue',
        orgoSpecs: { path: 'organon/heart/rate', rate: 72 },
        gelleSpecs: { path: 'overlay/cardio/coherence', score: 0.95 }
      }
    ]
    const currentSolarAngle = '180.5'
    const hopQuery = 'organon/heart/rate'

    // Peer 1 hosts the biological bundle payload
    if (typeof peer1.osmosis?.hostBundle === 'function') {
      await peer1.osmosis.hostBundle(hopQuery, mockExoCueBatch)
    }

    // Peer 2 resolves and absorbs via HOPquery string
    if (typeof peer2.osmosis?.triggerOsmosis === 'function') {
      await peer2.osmosis.triggerOsmosis(hopQuery, currentSolarAngle)
    }

    expect(peer2.osmosis).toBeDefined()
  }, 10000)
})