const levelup = require('levelup')
const leveldown = require('leveldown')
const memdown = require('memdown')
const moment = require('moment')
const uuid = require('uuid')

const Config = require('../lib/config')
const Token = require('../lib/token')

class TokenModel {
  constructor (deps) {
    this.config = deps(Config)
    this.token = deps(Token)
    this.db = levelup(this.config.dbPath
      ? leveldown(this.config.dbPath)
      : memdown())
  }

  async pull ({ token, amount }) {
    let tokenInfo = await this.get(token)
    tokenInfo = this.token.pull(tokenInfo, amount)
    this.db.put(token, JSON.stringify(tokenInfo))
  }

  async get (token) {
    let tokenInfo = JSON.parse(await this.db.get(token))
    tokenInfo = this.token.get(tokenInfo)
    this.db.put(token, JSON.stringify(tokenInfo))
    return tokenInfo
  }

  async create ({ token, amount, start, interval, cycles, cap, assetCode, assetScale, webhook }) {
    if (!token) {
      token = uuid()
    }
    await this.db.put(token, JSON.stringify({
      balanceTotal: String(0),
      balanceInterval: String(0),
      balanceAvailable: String(0),
      amount,
      start: start || moment().toISOString(),
      interval,
      cycles: Number(cycles),
      cycleCurrent: 1,
      cap: cap === 'true',
      assetCode,
      assetScale,
      webhook
    }))

    return {
      token,
      pointer: '$' + this.config.host + '/' + token
    }
  }

  async update (token, values) {
    let tokenInfo = await this.get(token)
    tokenInfo = await this.token.update(tokenInfo, values)
    this.db.put(token, JSON.stringify(tokenInfo))
    return tokenInfo
  }
}

module.exports = TokenModel
