import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import liveHOP from '../src/index.js'
import { createServer } from 'http'

// Helper function to find an available port
describe('HOP Server Initialization', () => {
  let hopECS
  let serverPort

  // Helper function to find an available port
  async function findAvailablePort() {
    return new Promise((resolve) => {
      const server = createServer()
      server.listen(0, () => {
        const { port } = server.address()
        server.close(() => resolve(port))
      })
    })
  }

  // Setup before each test
  beforeEach(async () => {
    try {
      serverPort = await findAvailablePort()
      const options = { port: serverPort }
      hopECS = new liveHOP(options)
    } catch (error) {
      console.error('Error setting up test:', error)
      throw error
    }
  })

  // Cleanup after each test
  afterEach(() => {
    if (hopECS) {
      try {
        // Close the HOP server
        hopECS.closeHOP()
      } catch (error) {
        console.error('Error closing server:', error)
      }
    }
    hopECS = null
  })

  it('should initialize server with correct port', () => {
    // Verify server is initialized with correct port
    expect(hopECS.options.port).toBe(serverPort)
    
    // Verify server is running
    // expect(hopECS.isRunning).toBe(true)
  })
})

// Export nothing for now
