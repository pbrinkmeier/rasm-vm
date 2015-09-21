'use strict'

var Vm = require('../src/vm.js')

function equal (a, b) {
  if (a !== b) {
    throw new Error(String(a) + ' !== ' + String(b))
  }
}

describe('rasm-vm', function () {
  describe('0x0000 HLT', function () {
    it('sets the VM status to halted', function () {
      var test = new Vm()
      test.reset()

      // halt

      test.writeRam(0, 0x00)
      test.writeRam(1, 0x00)

      test.step()

      equal(test.halted, true)
    })
  })

  describe('0x1x INT', function () {
    it('has a method to add an asynchronous interrupt for an id', function (done) {
      var test = new Vm()
      test.reset()

      var fourtyTwoInterrupt = function (done) {
        setTimeout(function () {
          this.writeRegister(0, 0x2a)

          done()
        }.bind(this), 200)
      }

      test.addInterrupt(0x60, fourtyTwoInterrupt)

      equal(test.interrupts[0x60], fourtyTwoInterrupt)

      // int #60

      test.writeRam(0, 0x10)
      test.writeRam(1, 0x60)

      test.step()

      equal(test.interrupted, true)

      setTimeout(function () {
        equal(test.registers[0], 0x2a)
        equal(test.interrupted, false)

        done()
      }, 200)
    })

    describe('Interrupt 0x20 - random', function () {
      it('loads a random number from #00 to #ff into r0', function () {
        var test = new Vm()
        test.reset()

        // int #20

        test.writeRam(0, 0x10)
        test.writeRam(1, 0x20)

        test.step()

        // await interrupt
        while (test.interrupted) {}

        equal(
          test.registers[0] >= 0x00 &&
          test.registers[0] <= 0xff,
          true
        )
      })
    })
  })

  describe('0x2x CMP', function () {
    it('compares two values and set the Z bit to 1 if they are equal', function () {
      var test = new Vm()
      test.reset()

      // cmp r0 #2a

      test.writeRam(0, 0x21)
      test.writeRam(1, 0x2a)

      test.writeRegister(0, 0x2a)
      test.step()

      equal(test.bits.z, 1)
    })

    it('compares two values and set the Z bit to 0 if they are not equal', function () {
      var test = new Vm()
      test.reset()

      // cmp r0 #2a

      test.writeRam(0, 0x21)
      test.writeRam(1, 0x2a)

      test.writeRegister(0, 0x29)
      test.step()

      equal(test.bits.z, 0)
    })

    it('can also compare two registers', function () {
      var test = new Vm()
      test.reset()

      // cmp r0 r1

      test.writeRam(0, 0x20)
      test.writeRam(1, 0x01)

      test.writeRegister(0, 0x2a)
      test.writeRegister(1, 0x2a)
      test.step()

      equal(test.bits.z, 1)
    })
  })

  describe('0x31 JMP', function () {
    it('sets the instruction pointer to some value', function () {
      var test = new Vm()
      test.reset()

      // jmp #2a

      test.writeRam(0, 0x31)
      test.writeRam(1, 0x2a)

      test.step()

      equal(test.ip, 0x2a)
    })
  })

  describe('0x41 CALL', function () {
    it('pushes the instruction pointer to the stack then sets it to some value', function () {
      var test = new Vm()
      test.reset()

      // call #2a

      test.writeRam(0, 0x41)
      test.writeRam(1, 0x2a)

      var oldIp = test.ip + 2
      var oldSp = test.sp
      test.step()

      equal(test.ip, 0x2a)
      equal(test.sp, oldSp - 1)
      equal(test.Ram[oldSp], oldIp)
    })
  })

  describe('0x5000 RET', function () {
    it('pops the stack into the instruction pointer', function () {
      var test = new Vm()
      test.reset()

      // ret

      test.writeRam(0, 0x50)
      test.writeRam(1, 0x00)

      test.writeRam(test.sp, 0x2a)
      test.writeSp(test.sp - 1)
      var oldSp = test.sp
      test.step()

      equal(test.ip, 0x2a)
      equal(test.sp, oldSp + 1)
    })
  })

  describe('0x60 JZ', function () {
    it('sets the instruction pointer if the zero bit is 1', function () {
      var test = new Vm()
      test.reset()

      // jz #2a
      // jz #2b

      test.writeRam(0, 0x60)
      test.writeRam(1, 0x2a)
      test.writeRam(2, 0x60)
      test.writeRam(3, 0x2b)

      test.writeZBit(0)
      test.step()

      equal(test.ip, 2)

      test.writeZBit(1)
      test.step()

      equal(test.ip, 0x2b)
    })
  })

  describe('0x61 JNZ', function () {
    it('sets the instruction pointer if the zero bit is 0', function () {
      var test = new Vm()
      test.reset()

      // jnz #2a
      // jnz #2b

      test.writeRam(0, 0x61)
      test.writeRam(1, 0x2a)
      test.writeRam(2, 0x61)
      test.writeRam(3, 0x2b)

      test.writeZBit(1)
      test.step()

      equal(test.ip, 2)

      test.writeZBit(0)
      test.step()

      equal(test.ip, 0x2b)
    })
  })

  describe('0x62 JC', function () {
    it('sets the instruction pointer if the carry bit is 0', function () {
      var test = new Vm()
      test.reset()

      // jc #2a
      // jc #2b

      test.writeRam(0, 0x62)
      test.writeRam(1, 0x2a)
      test.writeRam(2, 0x62)
      test.writeRam(3, 0x2b)

      test.writeCBit(0)
      test.step()

      equal(test.ip, 2)

      test.writeCBit(1)
      test.step()

      equal(test.ip, 0x2b)
    })
  })

  describe('0x63 JNC', function () {
    it('sets the instruction pointer if the carry bit is 0', function () {
      var test = new Vm()
      test.reset()

      // jnc #2a
      // jnc #2b

      test.writeRam(0, 0x63)
      test.writeRam(1, 0x2a)
      test.writeRam(2, 0x63)
      test.writeRam(3, 0x2b)

      test.writeCBit(1)
      test.step()

      equal(test.ip, 2)

      test.writeCBit(0)
      test.step()

      equal(test.ip, 0x2b)
    })
  })

  describe('0x7x LD', function () {
    it('loads a value from another register', function () {
      var test = new Vm()
      test.reset()

      // ld r0 r1

      test.writeRam(0, 0x70)
      test.writeRam(1, 0x01)

      test.writeRegister(1, 0x2a)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('loads a constant value', function () {
      var test = new Vm()
      test.reset()

      // ld r3 #2a

      test.writeRam(0, 0x7d)
      test.writeRam(1, 0x2a)

      test.step()

      equal(test.registers[3], 0x2a)
    })

    it('loads a value from an address', function () {
      var test = new Vm()
      test.reset()

      // ld r0 @a2

      test.writeRam(0, 0x72)
      test.writeRam(1, 0xa2)

      test.writeRam(0xa2, 0x2a)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('loads a value from an address stored in a register', function () {
      var test = new Vm()
      test.reset()

      // ld r0 @r1

      test.writeRam(0, 0x73)
      test.writeRam(1, 0x01)

      test.writeRam(0xa2, 0x2a)
      test.writeRegister(1, 0xa2)
      test.step()

      equal(test.registers[0], 0x2a)
    })
  })

  describe('0x8x ST', function () {
    it('stores a value at an address', function () {
      var test = new Vm()
      test.reset()

      // st r0 @a2

      test.writeRam(0, 0x82)
      test.writeRam(1, 0xa2)

      test.writeRegister(0, 0x2a)
      test.step()

      equal(test.Ram[0xa2], 0x2a)
    })

    it('stores a value at an address stored in a register', function () {
      var test = new Vm()
      test.reset()

      // st r0 @r1

      test.writeRam(0, 0x83)
      test.writeRam(1, 0x01)

      test.writeRegister(0, 0x2a)
      test.writeRegister(1, 0xa2)
      test.step()

      equal(test.Ram[0xa2], 0x2a)
    })
  })

  describe('0x9x ADD', function () {
    it('adds up two registers', function () {
      var test = new Vm()
      test.reset()

      // add r0 r1

      test.writeRam(0, 0x90)
      test.writeRam(1, 0x01)

      test.writeRegister(0, 0x20)
      test.writeRegister(1, 0x0a)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('adds a constant to a register', function () {
      var test = new Vm()
      test.reset()

      // add r0 #0a

      test.writeRam(0, 0x91)
      test.writeRam(1, 0x0a)

      test.writeRegister(0, 0x20)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()
      test.reset()

      // add r0 #ff
      // add r0 #2a

      test.writeRam(0, 0x91)
      test.writeRam(1, 0xff)
      test.writeRam(2, 0x91)
      test.writeRam(3, 0x2a)

      test.writeRegister(0, 0x01)
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
      test.reset()

      // sub r0 r1

      test.writeRam(0, 0xa0)
      test.writeRam(1, 0x01)

      test.writeRegister(0, 0x33)
      test.writeRegister(1, 0x09)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('subtracts a constant from a register', function () {
      var test = new Vm()
      test.reset()

      // sub r0 #09

      test.writeRam(0, 0xa1)
      test.writeRam(1, 0x09)

      test.writeRegister(0, 0x33)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()
      test.reset()
      test.reset()

      // sub r0 #02
      // sub r0 #d5

      test.writeRam(0, 0xa1)
      test.writeRam(1, 0x02)
      test.writeRam(2, 0xa1)
      test.writeRam(3, 0xd5)

      test.writeRegister(0, 0x01)
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
      test.reset()

      // and r0 r1

      test.writeRam(0, 0xb0)
      test.writeRam(1, 0x01)

      test.writeRegister(0, 0xfa)
      test.writeRegister(1, 0x2f)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('computes the logical AND of a register and a constant', function () {
      var test = new Vm()
      test.reset()

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
      test.reset()

      // or r0 r1

      test.writeRam(0, 0xc0)
      test.writeRam(1, 0x01)

      test.writeRegister(0, 0x0a)
      test.writeRegister(1, 0x20)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('computes the logical OR of a register and a constant', function () {
      var test = new Vm()
      test.reset()

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
      test.reset()

      // xor r0 r1

      test.writeRam(0, 0xd0)
      test.writeRam(1, 0x01)

      test.writeRegister(0, 0x4c)
      test.writeRegister(1, 0x66)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('computes the logical XOR of a register and a constant', function () {
      var test = new Vm()
      test.reset()

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
      test.reset()

      // inc r0

      test.writeRam(0, 0xe0)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0x29)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()
      test.reset()
      test.reset()

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
      test.reset()

      // dec r0

      test.writeRam(0, 0xe1)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0x2b)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()
      test.reset()

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
      test.reset()
      test.reset()
      test.reset()

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
      test.reset()
      test.reset()

      // asl r0

      test.writeRam(0, 0xe3)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0x15)
      test.step()

      equal(test.registers[0], 0x2a)
    })

    it('sets the carry flag', function () {
      var test = new Vm()
      test.reset()

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
      test.reset()
      test.reset()

      // asr r0

      test.writeRam(0, 0xe4)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0x54)
      test.step()

      equal(test.registers[0], 0x2a)
    })
  })

  describe('0xf0 PUSH', function () {
    it('puts a register into the RAM at the addres of the current stack pointer and decrements it', function () {
      var test = new Vm()
      test.reset()

      // push r0

      test.writeRam(0, 0xf0)
      test.writeRam(1, 0x00)

      test.writeRegister(0, 0x2a)
      var oldSp = test.sp
      test.step()

      equal(test.sp, oldSp - 1)
      equal(test.Ram[oldSp], 0x2a)
    })
  })

  describe('0xf1 POP', function () {
    it('increments the stack pointer and puts the value at its address into a register', function () {
      var test = new Vm()
      test.reset()

      // pop r0

      test.writeRam(0, 0xf1)
      test.writeRam(1, 0x00)

      test.writeRam(test.sp + 1, 0x2a)
      var oldSp = test.sp
      test.step()

      equal(test.sp, oldSp + 1)
      equal(test.registers[0], 0x2a)
    })
  })
})
