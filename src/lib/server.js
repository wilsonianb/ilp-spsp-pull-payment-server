const { createServer } = require('ilp-protocol-stream')
const debug = require('debug')('ilp-spsp-invoice:receiver')
const BigNumber = require('bignumber.js')
const crypto = require('crypto')

const Config = require('./config')
const Webhooks = require('./webhooks')
const TokenModel = require('../models/token')

class Server {
  constructor (deps) {
    this.config = deps(Config)
    this.tokens = deps(TokenModel)
    this.webhooks = deps(Webhooks)
    this.plugin = this.config.plugin
    this.server = null
  }

  async listen () {
    this.server = await createServer({
      plugin: this.plugin,
      serverSecret: crypto.randomBytes(32)
    })

    this.server.on('connection', async (connection) => {
      console.log('server got connection')

      const id = connection.connectionTag

      if (!id) {
        // push payment
        connection.on('stream', (stream) => {
          stream.setReceiveMax(Infinity)
          stream.on('money', amount => {
            console.log('Received ' + amount + ' units from ' + connection._sourceAccount)
          })
          stream.end()
        })
        connection.end()
      } else {
        // pull payment
        const token = await this.tokens.get(id)

        const stream = connection.createStream()

        if (BigNumber(token.cooldown) < BigNumber(Date.now())) {
          if (BigNumber(token.balance).plus(token.amount) < BigNumber(token.maximum)) {
            await stream.sendTotal(token.amount)
            this.tokens.pull({ id, token })
            console.log('Streaming ' + token.amount + ' units to ' + connection._sourceAccount)
            this.webhooks.call({ id })
              .catch(e => {
                debug('failed to call webhook. error=', e)
              })
          } else {
            await stream.write('Maximum pull amount is reached.')
          }
        } else {
          await stream.write('Cooldown period is not over.')
        }
        await stream.end()
        await connection.end()
      }
    })
  }

  generateAddressAndSecret (connectionTag) {
    return this.server.generateAddressAndSecret(connectionTag)
  }
}

module.exports = Server
