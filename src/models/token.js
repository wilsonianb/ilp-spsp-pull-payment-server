const uuid = require('uuid')
const levelup = require('levelup')
const leveldown = require('leveldown')
const memdown = require('memdown')
const BigNumber = require('bignumber.js')

const Config = require('../lib/config')

class TokenModel {
  constructor (deps) {
    this.config = deps(Config)
    this.db = levelup(this.config.dbPath
      ? leveldown(this.config.dbPath)
      : memdown())
  }

  async pull ({ id, token }) {
    token.balance = BigNumber(token.balance).plus(BigNumber(token.amount))
    token.cooldown = BigNumber(token.cooldown).plus(BigNumber(token.interval).times(BigNumber(86400)))
    this.db.put(id, JSON.stringify(token))
  }

  async get (id) {
    return JSON.parse(await this.db.get(id))
  }

  async create ({ amount, maximum, interval, name, webhook }) {
    const id = uuid()

    await this.db.put(id, JSON.stringify({
      balance: String(0),
      amount,
      maximum,
      name,
      interval,
      cooldown: String(Date.now() / 1000 | 0),
      webhook
    }))

    return {
      id,
      token: '$' + this.config.host + '/' + id
    }
  }
}

module.exports = TokenModel
