const fetch = require('node-fetch')

const Config = require('../lib/config')
const TokenModel = require('../models/token')

class Webhooks {
  constructor (deps) {
    this.config = deps(Config)
    this.tokens = deps(TokenModel)
  }

  async call (id) {
    const token = await this.tokens.get(id)

    if (!token.webhook) {
      return
    }

    return fetch(token.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.config.token
      },
      body: JSON.stringify({ token, pointer: token.pointer() })
    })
  }
}

module.exports = Webhooks
