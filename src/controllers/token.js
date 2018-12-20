const TokenModel = require('../models/token')
const Auth = require('../lib/auth')
const debug = require('debug')('ilp-spsp-pull-payment:token')

class TokenController {
  constructor (deps) {
    this.tokens = deps(TokenModel)
    this.auth = deps(Auth)
  }

  async init (router) {
    router.post('/', this.auth.getMiddleware(), async ctx => {
      debug('creating pull token')
      const { amount, maximum, interval, name, webhook } = ctx.request.body
      const { receiver } = await this.tokens.create({ amount, maximum, interval, name, webhook })
      ctx.body = { receiver }
    })
  }
}

module.exports = TokenController
