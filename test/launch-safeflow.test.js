import assert from 'assert'
import liveHOP from '../src/index.js'
// need to mock websocket e.g. sinon TODO

describe('bring the protocol to life', function () {
  it('connecting server, socket, safeflow', function () {
    let options = {}
    options.port = 9888
    let hopSF = new liveHOP(options)
    assert.equal(hopSF.options.port, 9888)

    setTimeout(closeHOP, 3000)

    function closeHOP () {
      console.log('message test out')
      let startHOP = {}
      startHOP.reftype = 'ignore'
      startHOP.type = 'launch'
      let jsonStart = JSON.stringify(startHOP)
      // ws.send(jsonStart)
      hopSF.closeHOP()
    }
  })
})
