'use strict'

// TODO: only allow certain addressing modes on some of the instructions

var fill = require('./util/fill.js')
var limit = require('./util/limit.js')
var Reeal = require('reeal')

var HALT = 0x0
var INTERRUPT = 0x1
var COMPARE = 0x2
var JUMP = 0x3
var CALL = 0x4
var RETURN = 0x5
var CONDJUMP = 0x6
var JZ = 0x0
var JNZ = 0x1
var JC = 0x2
var JNC = 0x3
var LOAD = 0x7
var STORE = 0x8
var ADD = 0x9
var SUBTRACT = 0xa
var AND = 0xb
var OR = 0xc
var XOR = 0xd
var UNARY = 0xe
var INC = 0x0
var DEC = 0x1
var NOT = 0x2
var ASL = 0x3
var ASR = 0x4
var STACK = 0xf
var PUSH = 0x0
var POP = 0x1
var AM_REGISTER = 0x0
var AM_CONSTANT = 0x1
var AM_ADDRESS = 0x2
var AM_INDEX = 0x3

function Vm () {
  this.events = new Reeal()

  this.reset()
}

Vm.prototype.reset = function () {
  this.halted = false

  this.Ram = new Array(256)
  this.registers = new Array(4)
  this.ip = 0
  this.sp = 0xbf
  this.bits = {
    z: 0,
    c: 0
  }

  fill(this.Ram, 0)
  fill(this.registers, 0)
}

Vm.prototype.writeRam = function (address, value) {
  var result = limit(8, value)

  this.Ram[address] = result.value

  this.events.trigger('updateRam', [address, value])
  this.events.trigger('updateRam:' + String(address), [address, value])
}

Vm.prototype.writeRegister = function (register, value) {
  var result = limit(8, value)

  this.registers[register] = result.value
  this.writeCBit(result.carry)

  this.events.trigger('updateRegister', [register, value])
  this.events.trigger('updateRegister:' +  String(register), [register, value])
}

Vm.prototype.writeIp = function (value) {
  var result = limit(8, value)

  this.ip = result.value

  this.events.trigger('updateInstructionPointer', [value])
}

Vm.prototype.writeSp = function (value) {
  var result = limit(8, value)

  this.sp = result.value

  this.events.trigger('updateStackPointer', [value])
}

Vm.prototype.writeZBit = function (value) {
  this.bits.z = value

  this.events.trigger('updateZBit', [value])
}

Vm.prototype.writeCBit = function (value) {
  this.bits.c = value

  this.events.trigger('updateCBit', [value])
}

Vm.prototype.step = function () {
  function getValue () {
    switch (addressingMode) {
      case AM_REGISTER:
        value = self.registers[registerAlt]

        break
      case AM_CONSTANT:
        value = operand

        break
      case AM_ADDRESS:
        value = self.Ram[operand]

        break
      case AM_INDEX:
        value = self.Ram[self.registers[registerAlt]]

        break
    }
  }

  function getAddress () {
    switch (addressingMode) {
      case AM_ADDRESS:
        address = operand

        break
      case AM_INDEX:
        address = self.registers[registerAlt]

        break
    }
  }

  var self = this

  var instruction = this.Ram[this.ip]
  var operand = this.Ram[this.ip + 0x1]

  var register = (instruction & 0xc) >> 0x2
  var addressingMode = (instruction & 0x3)
  var registerAlt = operand & 0x3

  var value
  var address

  if (!this.halted) {
    this.writeIp(this.ip + 0x2)

    switch (instruction >> 0x4) {
      case HALT:
        this.halted = true

        break
      case INTERRUPT:
        // TODO

        break
      case COMPARE:
        getValue()

        if (this.registers[register] === value) {
          this.writeZBit(1)
        } else {
          this.writeZBit(0)
        }

        break
      case JUMP:
        this.writeIp(operand)

        break
      case CALL:
        getValue()

        this.writeRam(this.sp, this.ip)
        this.writeSp(this.sp - 1)
        this.writeIp(value)

        break
      case RETURN:
        this.writeSp(this.sp + 1)
        this.writeIp(this.Ram[this.sp])

        break
      case CONDJUMP:
        switch (instruction & 0x3) {
          case JZ:
            if (this.bits.z === 0x1) {
              this.writeIp(operand)
            }

            break
          case JNZ:
            if (this.bits.z === 0x0) {
              this.writeIp(operand)
            }

            break
          case JC:
            if (this.bits.c === 0x1) {
              this.writeIp(operand)
            }

            break
          case JNC:
            if (this.bits.c === 0x0) {
              this.writeIp(operand)
            }

            break
        }

        break
      case LOAD:
        getValue()

        this.writeRegister(register, value)

        break
      case STORE:
        getAddress()

        this.writeRam(address, this.registers[register])

        break
      case ADD:
        getValue()

        this.writeRegister(register, this.registers[register] + value)

        break
      case SUBTRACT:
      getValue()

      this.writeRegister(register, this.registers[register] - value)

        break
      case AND:
        getValue()

        this.writeRegister(register, this.registers[register] & value)

        break
      case OR:
        getValue()

        this.writeRegister(register, this.registers[register] | value)

        break
      case XOR:
        getValue()

        this.writeRegister(register, this.registers[register] ^ value)

        break
      case UNARY:
        switch (instruction & 0x7) {
          case INC:
            this.writeRegister(registerAlt, this.registers[registerAlt] + 0x1)

            break
          case DEC:
            this.writeRegister(registerAlt, this.registers[registerAlt] - 0x1)

            break
          case NOT:
            this.writeRegister(registerAlt, ~this.registers[registerAlt])

            break
          case ASL:
            this.writeRegister(registerAlt, this.registers[registerAlt] << 1)

            break
          case ASR:
            this.writeRegister(registerAlt, this.registers[registerAlt] >> 1)

            break
        }

        break
      case STACK:
        switch (instruction & 1) {
          case PUSH:
            this.writeRam(this.sp, this.registers[register])
            this.writeSp(this.sp - 1)

            break
          case POP:
            this.writeSp(this.sp + 1)
            this.writeRegister(register, this.Ram[this.sp])

            break
        }

        break
    }
  }

  this.events.trigger('step')
}

module.exports = Vm
