'use strict'

// TODO: rewrite all with .writeRam, .writeRegister, etc.

var Vm = require('../src/vm.js')

function equal (a, b) {
  if (a !== b) {
    throw new Error(String(a) + ' !== ' + String(b))
  }
}

describe('rasm-vm', function () {
  describe('0x0x HLT', function () {
    it('sets the VM status to halted', function () {
      var test = new Vm()

      // halt

      test.Ram[0] = 0x00
      test.Ram[1] = 0x00

      test.step()

      equal(test.halted, true)
    })
  })

  describe('0x1x INT', function () {
    // TODO
  })

  describe('0x2x CMP', function () {
    it('compares two values and set the Z bit to 1 if they are equal', function () {
      var test = new Vm()

      // cmp r0 #2a

      test.Ram[0] = 0x21
      test.Ram[1] = 0x2a

      test.registers[0] = 0x2a
      test.step()

      equal(test.bits.z, 1)
    })

    it('compares two values and set the Z bit to 0 if they are not equal', function () {
      var test = new Vm()

      // cmp r0 #2a

      test.Ram[0] = 0x21
      test.Ram[1] = 0x2a

      test.registers[0] = 0x29
      test.step()

      equal(test.bits.z, 0)
    })

    it('can also compare two registers', function () {
      var test = new Vm()

      // cmp r0 r1

      test.Ram[0] = 0x20
      test.Ram[1] = 0x01

      test.registers[0] = 0x2a
      test.registers[1] = 0x2a
      test.step()

      equal(test.bits.z, 1)
    })
  })

  describe('0x3x JMP', function () {
    it('sets the instruction pointer to some value', function () {
      var test = new Vm()

      // jmp #2a

      test.Ram[0] = 0x31
      test.Ram[1] = 0x2a

      test.step()

      equal(test.ip, 0x2a)
    })
  })

  describe('0x4x CALL', function () {
    // TODO
  })

  describe('0x5x RET', function () {
    // TODO
  })

  describe('0x60 JZ', function () {
    it('sets the instruction pointer if the zero bit is 1', function () {
      var test = new Vm()

      // jz #2a
      // jz #2b

      test.Ram[0] = 0x60
      test.Ram[1] = 0x2a
      test.Ram[2] = 0x60
      test.Ram[3] = 0x2b

      test.bits.z = 0
      test.step()

      equal(test.ip, 2)

      test.bits.z = 1
      test.step()

      equal(test.ip, 0x2b)
    })
  })

  describe('0x61 JNZ', function () {
    it('sets the instruction pointer if the zero bit is 0', function () {
      var test = new Vm()

      // jnz #2a
      // jnz #2b

      test.Ram[0] = 0x61
      test.Ram[1] = 0x2a
      test.Ram[2] = 0x61
      test.Ram[3] = 0x2b

      test.bits.z = 1
      test.step()

      equal(test.ip, 2)

      test.bits.z = 0
      test.step()

      equal(test.ip, 0x2b)
    })
  })

  describe('0x62 JC', function () {
    it('sets the instruction pointer if the carry bit is 0', function () {
      var test = new Vm()

      // jc #2a
      // jc #2b

      test.Ram[0] = 0x62
      test.Ram[1] = 0x2a
      test.Ram[2] = 0x62
      test.Ram[3] = 0x2b

      test.bits.c = 0
      test.step()

      equal(test.ip, 2)

      test.bits.c = 1
      test.step()

      equal(test.ip, 0x2b)
    })
  })

  describe('0x63 JNC', function () {
    it('sets the instruction pointer if the carry bit is 0', function () {
      var test = new Vm()

      // jnc #2a
      // jnc #2b

      test.Ram[0] = 0x63
      test.Ram[1] = 0x2a
      test.Ram[2] = 0x63
      test.Ram[3] = 0x2b

      test.bits.c = 1
      test.step()

      equal(test.ip, 2)

      test.bits.c = 0
      test.step()

      equal(test.ip, 0x2b)
    })
  })

  describe('0x7x LD', function () {
    it('loads a value from another register', function () {
      var test = new Vm()

      // ld r0 r1

      test.Ram[0] = 0x70
      test.Ram[1] = 0x01

      test.registers[1] = 0x2a
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('loads a constant value', function () {
      var test = new Vm()

      // ld r3 #2a

      test.Ram[0] = 0x7d
      test.Ram[1] = 0x2a

      test.step()

      equal(test.registers[3], 0x2a)
    })

    it('loads a value from an address', function () {
      var test = new Vm()

      // ld r0 @a2

      test.Ram[0] = 0x72
      test.Ram[1] = 0xa2

      test.Ram[0xa2] = 0x2a
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('loads a value from an address stored in a register', function () {
      var test = new Vm()

      // ld r0 @r1

      test.Ram[0] = 0x73
      test.Ram[1] = 0x01

      test.Ram[0xa2] = 0x2a
      test.registers[1] = 0xa2
      test.step()

      equal(test.registers[0], 0x2a)
    })
  })

  describe('0x8x ST', function () {
    it('stores a value at an address', function () {
      var test = new Vm()

      // st r0 @a2

      test.Ram[0] = 0x82
      test.Ram[1] = 0xa2

      test.registers[0] = 0x2a
      test.step()

      equal(test.Ram[0xa2], 0x2a)
    })

    it('stores a value at an address stored in a register', function () {
      var test = new Vm()

      // st r0 @r1

      test.Ram[0] = 0x83
      test.Ram[1] = 0x01

      test.registers[0] = 0x2a
      test.registers[1] = 0xa2
      test.step()

      equal(test.Ram[0xa2], 0x2a)
    })
  })

  describe('0x9x ADD', function () {
    it('adds up two registers', function () {
      var test = new Vm()

      // add r0 r1

      test.Ram[0] = 0x90
      test.Ram[1] = 0x01

      test.registers[0] = 0x20
      test.registers[1] = 0x0a
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('adds a constant to a register', function () {
      var test = new Vm()

      // add r0 #0a

      test.Ram[0] = 0x91
      test.Ram[1] = 0x0a

      test.registers[0] = 0x20
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()

      // add r0 #ff
      // add r0 #2a

      test.Ram[0] = 0x91
      test.Ram[1] = 0xff
      test.Ram[2] = 0x91
      test.Ram[3] = 0x2a

      test.registers[0] = 0x01
      test.step()

      equal(test.bits.c, 1)
      equal(test.registers[0], 0x0)

      test.step()

      equal(test.bits.c, 0)
      equal(test.registers[0], 0x2a)
    })
  })

  describe('0xax SUB', function () {
    it('subtracts one register from another', function () {
      var test = new Vm()

      // sub r0 r1

      test.Ram[0] = 0xa0
      test.Ram[1] = 0x01

      test.registers[0] = 0x33
      test.registers[1] = 0x09
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('subtracts a constant from a register', function () {
      var test = new Vm()

      // sub r0 #09

      test.Ram[0] = 0xa1
      test.Ram[1] = 0x09

      test.registers[0] = 0x33
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()

      // sub r0 #02
      // sub r0 #d5

      test.Ram[0] = 0xa1
      test.Ram[1] = 0x02
      test.Ram[2] = 0xa1
      test.Ram[3] = 0xd5

      test.registers[0] = 0x01
      test.step()

      equal(test.bits.c, 1)
      equal(test.registers[0], 0xff)

      test.step()

      equal(test.bits.c, 0)
      equal(test.registers[0], 0x2a)
    })
  })

  describe('0xbx AND', function () {
    it('computes the logical AND of two registers', function () {
      var test = new Vm()

      // and r0 r1

      test.Ram[0] = 0xb0
      test.Ram[1] = 0x01

      test.registers[0] = 0xfa
      test.registers[1] = 0x2f
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('computes the logical AND of a register and a constant', function () {
      var test = new Vm()

      // and r0 #2f

      test.writeRam(0, 0xb1)
      test.writeRam(1, 0x2f)

      test.writeRegister(0, 0xfa)
      test.step()

      equal(test.registers[0], 0x2a)
    })
  })

  describe('0xcx OR', function () {
    it('computes the logical OR of two registers', function () {
      var test = new Vm()

      // or r0 r1

      test.Ram[0] = 0xc0
      test.Ram[1] = 0x01

      test.registers[0] = 0x0a
      test.registers[1] = 0x20
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('computes the logical OR of a register and a constant', function () {
      var test = new Vm()

      // or r0 #2f

      test.writeRam(0, 0xc1)
      test.writeRam(1, 0x20)

      test.writeRegister(0, 0x0a)
      test.step()

      equal(test.registers[0], 0x2a)
    })
  })

  describe('0xdx XOR', function () {
    it('computes the logical XOR of two registers', function () {
      var test = new Vm()

      // xor r0 r1

      test.Ram[0] = 0xd0
      test.Ram[1] = 0x01

      test.registers[0] = 0x4c
      test.registers[1] = 0x66
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('computes the logical XOR of a register and a constant', function () {
      var test = new Vm()

      // xor r0 #66

      test.writeRam(0, 0xd1)
      test.writeRam(1, 0x4c)

      test.writeRegister(0, 0x66)
      test.step()

      equal(test.registers[0], 0x2a)
    })
  })

  describe('0xe0 INC', function () {
    it('increments a register', function () {
      var test = new Vm()

      // inc r0

      test.writeRam(0, 0xe0)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0x29)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()

      // inc r0
      // inc r0

      test.writeRam(0, 0xe0)
      test.writeRam(1, 0x00)
      test.writeRam(2, 0xe0)
      test.writeRam(3, 0x00)

      test.writeRegister(0, 0xff)
      test.step()

      equal(test.bits.c, 1)

      test.step()

      equal(test.bits.c, 0)
    })
  })

  describe('0xe1 DEC', function () {
    it('decrements a register', function () {
      var test = new Vm()

      // dec r0

      test.writeRam(0, 0xe1)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0x2b)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()

      // dec r0
      // dec r0

      test.writeRam(0, 0xe1)
      test.writeRam(1, 0x00)
      test.writeRam(2, 0xe1)
      test.writeRam(3, 0x00)

      test.writeRegister(0, 0x00)
      test.step()

      equal(test.bits.c, 1)

      test.step()

      equal(test.bits.c, 0)
    })
  })

  describe('0xe2 NOT', function () {
    it('bitwise NOTs a register', function () {
      var test = new Vm()

      // not r0

      test.writeRam(0, 0xe2)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0xd5)
      test.step()

      equal(test.registers[0], 0x2a)
    })
  })

  describe('0xe3 ASL', function () {
    it('bitshifts a register to the left', function () {
      var test = new Vm()

      // asl r0

      test.writeRam(0, 0xe3)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0x15)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()

      // asl r0
      // asl r0

      test.writeRam(0, 0xe3)
      test.writeRam(1, 0x00)
      test.writeRam(2, 0xe3)
      test.writeRam(3, 0x00)

      test.writeRegister(0, 0x80)
      test.step()

      equal(test.bits.c, 1)

      test.writeRegister(0, 0x2a)
      test.step()

      equal(test.bits.c, 0)
    })
  })

  describe('0xe4 ASR', function () {
    it('bitshifts a register to the right', function () {
      var test = new Vm()

      // asr r0

      test.writeRam(0, 0xe4)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0x54)
      test.step()

      equal(test.registers[0], 0x2a)
    })
  })
})
