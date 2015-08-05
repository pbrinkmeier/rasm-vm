'use strict'

module.exports = function limit (bits, value) {
  return {
    value: value & (Math.pow(2, bits) - 1),
    carry: (value >> bits) === 0 ? 0 : 1
  }
}
