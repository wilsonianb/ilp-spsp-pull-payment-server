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

    router.get('/:token_id', async ctx => {
      if (ctx.get('Accept').indexOf('application/spsp4+json') === -1) {
        return ctx.throw(404)
      }

      const token = await this.tokens.get(ctx.params.token_id)
      if (!token) {
        return ctx.throw(404, 'Token not found')
      }

      const { destinationAccount, sharedSecret } =
        this.server.generateAddressAndSecret(ctx.params.token_id)

      ctx.body = {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64'),
        balance: {
          amount: String(token.amount),
          current: String(token.balance),
          maximum: String(token.maximum)
        },
        receiver_info: {
          name: String(token.name),
          interval: String(token.interval),
          cooldown: String(token.cooldown)
        }
      }
      ctx.set('Content-Type', 'application/spsp4+json')
    })
  }
}

module.exports = PaymentPointerController
