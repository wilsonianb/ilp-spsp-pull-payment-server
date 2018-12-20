const TokenModel = require('../models/token')
const Receiver = require('../lib/server')

class PaymentPointerController {
  constructor (deps) {
    this.tokens = deps(TokenModel)
    this.receiver = deps(Receiver)
  }

  async init (router) {
    await this.receiver.listen()

    router.get('/:token_id', async ctx => {
      if (ctx.get('Accept').indexOf('application/spsp4+json') === -1) {
        return ctx.throw(404)
      }

      const token = await this.tokens.get(ctx.params.token_id)
      if (!token) {
        return ctx.throw(404, 'Token not found')
      }

      const { destinationAccount, sharedSecret } =
        this.receiver.generateAddressAndSecret(ctx.params.token_id)

      ctx.body = {
        destination_account: destinationAccount,
        shared_secret: sharedSecret.toString('base64'),
        balance: {
          amount: String(token.amount),
          current: String(token.balance),
          maximum: String(token.maximum)
        },
        receiver_info : {
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
