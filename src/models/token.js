const levelup = require('levelup')
const leveldown = require('leveldown')
const memdown = require('memdown')
const BigNumber = require('bignumber.js')
const moment = require('moment')
const uuid = require('uuid')

const Config = require('../lib/config')
const JWT = require('../lib/jwt')

class TokenModel {
  constructor (deps) {
    this.config = deps(Config)
    this.jwt = deps(JWT)
    this.db = levelup(this.config.dbPath
      ? leveldown(this.config.dbPath)
      : memdown())
  }

  async pull ({ token, amount }) {
    let tokenInfo = await this.get(token)
    tokenInfo.balanceTotal = new BigNumber(tokenInfo.balanceTotal).plus(amount)
    tokenInfo.balanceInterval = new BigNumber(tokenInfo.balanceInterval).plus(amount)
    this.db.put(token, JSON.stringify(tokenInfo))
  }

  async get (token) {
    let tokenInfo = JSON.parse(await this.db.get(token))
    const currentCycle = Math.ceil((moment(moment().toISOString()) - moment(tokenInfo.start)) / moment.duration(tokenInfo.interval))
    if (tokenInfo.cycleCurrent < currentCycle) {
      tokenInfo.cycleCurrent = currentCycle
      tokenInfo.balanceInterval = String(0)
    }
    await this.db.put(token, JSON.stringify(tokenInfo))
    return tokenInfo
  }

  async create ({ token, amount, start, interval, cycles, cap, assetCode, assetScale, webhook }) {
    if (!token) {
      token = uuid()
    }
    await this.db.put(token, JSON.stringify({
      balanceTotal: String(0),
      balanceInterval: String(0),
      amount,
      start: start || moment().toISOString(),
      interval,
      cycles,
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
}

module.exports = TokenModel
