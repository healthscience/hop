import assert from 'assert'
import liveHOP from '../src/index.js'
// need to mock websocket e.g. sinon TODO

describe('bring the protocol to life', function () {
  it('connecting server, socket, safeflow', function () {
    let options = {}
    options.port = 9888
    let hopECS = new liveHOP(options)
    assert.equal(hopECS.options.port, 9888)

    setTimeout(closeHOP, 3000000)

    function closeHOP () {
      let startHOP = {}
      startHOP.reftype = 'ignore'
      startHOP.type = 'launch'
      let jsonStart = JSON.stringify(startHOP)
      // ws.send(jsonStart)
      // hopECS.closeHOP()
    }
  })
})
