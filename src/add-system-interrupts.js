'use strict'

module.exports = function addSystemInterrupts (machine) {
  // 0x20 - random
  machine.addInterrupt(0x20, function (done) {
    this.writeRegister(
      0,
      Math.floor(Math.random() * 0xff)
    )

    done()
  })
}
