'use strict'

module.exports = function fill (arrayLike, value) {
  var i = 0
  var length = arrayLike.length

  for (; i < length; i++) {
    arrayLike[i] = value
  }
}
