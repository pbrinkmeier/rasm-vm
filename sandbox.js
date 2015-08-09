'use strict'

module.exports = function dumpVm (sandbox) {
  sandbox.events.on('updateRam', function (address, value) {
    console.log('Write to RAM: #' + address.toString(16) + ' <- #' + value.toString(16))
  })

  sandbox.events.on('updateRegister', function (register, value) {
    console.log('Write to Reg: r' + String(register) + ' <- #' + value.toString(16))
  })

  sandbox.events.on('updateInstructionPointer', function (value) {
    console.log('Write to IP: #' + value.toString(16))
  })

  sandbox.events.on('updateStackPointer', function (value) {
    console.log('Write to SP: #' + value.toString(16))
  })

  sandbox.events.on('updateZBit', function (value) {
    console.log('Z Bit set to ' + String(value))
  })

  sandbox.events.on('updateCBit', function (value) {
    console.log('C Bit set to ' + String(value))
  })
}
