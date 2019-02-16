const TokenModel = require('../models/token')
const Server = require('../lib/server')

class PaymentPointerController {
  constructor (deps) {
    this.tokens = deps(TokenModel)
    this.server = deps(Server)
  }

  async init (router) {
    await this.server.listen()

    router.get('/.well-known/pay', async ctx => {
      if (ctx.get('Accept').indexOf('application/spsp4+json') === -1) {
        return ctx.throw(404)
      }

      const { destinationAccount, sharedSecret } = this.server.generateAddressAndSecret()

      ctx.body = {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64')
      }
      ctx.set('Content-Type', 'application/spsp4+json')
    })

    router.get('/:token', async ctx => {
      if (ctx.get('Accept').indexOf('application/spsp4+json') === -1) {
        return ctx.throw(404)
      }

      const token = await this.tokens.get(ctx.params.token)
      if (!token) {
        return ctx.throw(404, 'Token not found')
      }

      const { destinationAccount, sharedSecret } =
        this.server.generateAddressAndSecret(ctx.params.token.split('.').join('~'))

      ctx.body = {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64'),
        balance: {
          interval: String(token.balanceInterval),
          total: String(token.balanceTotal)
        }
      }
      ctx.set('Content-Type', 'application/spsp4+json')
    })
  }
}

module.exports = PaymentPointerController
