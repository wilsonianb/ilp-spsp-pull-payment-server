const TokenModel = require('../models/token')
const Receiver = require('../lib/receiver')

class PaymentPointerController {
  constructor (deps) {
    this.tokens = deps(TokenModel)
    this.receiver = deps(Receiver)
  }

  async init (router) {
    await this.receiver.listen()

    router.get('/:token_id', async ctx => {
      console.log(ctx.get('Accept').indexOf('application/spsp+json'))
      if (ctx.get('Accept').indexOf('application/spsp+json') === -1) {
        return ctx.throw(404)
      }

      const token = await this.tokens.get(ctx.params.token_id)
      console.log(token)
      if (!token) {
        return ctx.throw(404, 'Token not found')
      }

      const { destinationAccount, sharedSecret } =
        this.receiver.generateAddressAndSecret()

      const segments = destinationAccount.split('.')
      const resultAccount = segments.slice(0, -2).join('.') +
        '.' + ctx.params.token_id +
        '.' + segments.slice(-2).join('.')

      ctx.set('Content-Type', 'application/spsp+json')
      ctx.body = {
        destination_account: resultAccount,
        shared_secret: sharedSecret,
        balance: {
          amount: String(token.amount),
          current: String(token.balance),
          maximum: String(token.maximum)
        },
        receiver_info : {
          interval: String(token.interval),
          merchant: String(token.merchant)
        }
      }
    })
  }
}

module.exports = PaymentPointerController
