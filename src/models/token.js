const uuid = require('uuid')
const levelup = require('levelup')
const leveldown = require('leveldown')
const memdown = require('memdown')

const Config = require('../lib/config')

class TokenModel {
  constructor (deps) {
    this.config = deps(Config)
    this.db = levelup(this.config.dbPath
      ? leveldown(this.config.dbPath)
      : memdown())
  }

  async pull ({ id, token }) {
    token.balance = String(0)
    this.db.put(id, JSON.stringify(token))
  }

  async get (id) {
    let token = JSON.parse(await this.db.get(id))
    let refillTime = new Date(token.refillTime)
    let now = new Date(Date.now())
    if (refillTime < now) {
      token.balance = token.maximum
      token.refillTime = addTime(token.refillTime, token.frequency, token.interval)
      this.db.put(id, JSON.stringify(token))
    }
    return token
  }

  async create ({ amount, start, frequency, interval, cycles, assetCode, assetScale, webhook }) {
    const id = uuid()
    const refillTime = checkStartTime(start)
    const expiryTime = addTime(refillTime, frequency, Number(interval) * Number(cycles))

    await this.db.put(id, JSON.stringify({
      balance: String(0),
      maximum: amount,
      refillTime,
      expiryTime,
      frequency,
      interval: Number(interval),
      assetCode,
      assetScale,
      webhook
    }))

    return {
      id,
      token: '$' + this.config.host + '/' + id
    }
  }
}

function checkStartTime (start) {
  let now = new Date(Date.now()).toISOString()
  if (start) {
    let timestamp = new Date(start).toISOString()
    if (timestamp > now) {
      return timestamp
    }
  }
  return now
}

function addTime (start, frequency, interval) {
  let date = new Date(start)
  if (frequency === 'DAY') {
    date = new Date(date.setDate(date.getDate() + interval))
  } else if (frequency === 'WEEK') {
    date = new Date(date.setDate(date.getDate() + 7 * interval))
  } else if (frequency === 'MONTH') {
    date = new Date(date.setMonth(date.getMonth() + interval))
  } else if (frequency === 'YEAR') {
    date = new Date(date.setFullYear(date.getFullYear() + interval))
  }
  return date.toISOString()
}

module.exports = TokenModel
