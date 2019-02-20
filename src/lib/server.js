const { createServer } = require('ilp-protocol-stream')
const crypto = require('crypto')

const Config = require('./config')
const TokenModel = require('../models/token')
const Exchange = require('./exchange')
const Webhooks = require('./webhooks')

class Server {
  constructor (deps) {
    this.config = deps(Config)
    this.tokens = deps(TokenModel)
    this.exchange = deps(Exchange)
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

      const tag = connection.connectionTag

      if (!tag) {
        // push payment
        connection.on('stream', (stream) => {
          stream.setReceiveMax(Infinity)
          stream.on('money', amount => {
            console.log('Received ' + amount + ' units from ' + connection._sourceAccount)
          })
        })
      } else {
        // pull payment
        const token = tag.split('~').join('.')
        const tokenInfo = await this.tokens.get(token)

        connection.on('stream', async (stream) => {
          const exchangeRate = await this.exchange.fetchRate(tokenInfo.assetCode, tokenInfo.assetScale, this.server.serverAssetCode, this.server.serverAssetScale)
          if (exchangeRate) {
            const pullable = Math.floor(tokenInfo.balanceAvailable * exchangeRate)
            stream.setSendMax(pullable)

            await stream.on('outgoing_money', pulled => {
              console.log('Streamed ' + pulled + ' units to ' + connection._sourceAccount)
              const amount = Math.ceil(pulled / exchangeRate)
              this.tokens.pull({ token, amount })
              this.webhooks.call({ token })
                .catch(e => {
                })
            })
          }
          await stream.end()
          await connection.end()
        })
      }
    })
  }

  generateAddressAndSecret (connectionTag) {
    return this.server.generateAddressAndSecret(connectionTag)
  }
}

module.exports = Server
