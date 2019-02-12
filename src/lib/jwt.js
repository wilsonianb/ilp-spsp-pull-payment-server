const jwt = require('jsonwebtoken')

const Config = require('./config')

class JWT {
  constructor (deps) {
    this.config = deps(Config)
  }

  create ({ payload, options }) {
    options = addAlgorithm(options)

    return jwt.sign(payload, this.config.jwtSecret, options)
  }

  verify ({ token, options }) {
    options = addAlgorithm(options)
    try {
      return jwt.verify(token, this.config.jwtSecret, options)
    } catch (err) {
      return false
    }
  }

  decode (token) {
    return jwt.decode(token, { complete: true })
  }
}

function addAlgorithm (options) {
  if (options) {
    options['algorithm'] = 'HS256'
  } else {
    options = { algorithm: 'HS256' }
  }
  return options
}

module.exports = JWT
