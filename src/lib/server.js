const { createServer } = require('ilp-protocol-stream')
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
        })
      } else {
        // pull payment
        const token = await this.tokens.get(id)

        connection.on('stream', async (stream) => {
          await stream.sendTotal(token.balance)
          console.log('Streaming ' + token.balance + ' units to ' + connection._sourceAccount)
          this.tokens.pull({ id, token })
          this.webhooks.call({ id })
            .catch(e => {
            })
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
