import assert from 'assert'
import liveHOP from '../src/index.js'

describe('bring the protocol to life', function () {
  it('connecting server, socket, safeflow', function () {
    let options = {}
    options.port = 9888
    let hopSF = new liveHOP(options)
    assert.equal(hopSF.options.port, 9888)
  })
})
