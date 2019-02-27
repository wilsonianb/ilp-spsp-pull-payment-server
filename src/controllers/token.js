const TokenModel = require('../models/token')
const Auth = require('../lib/auth')
const JWT = require('../lib/jwt')
const debug = require('debug')('ilp-spsp-pull:token-controller')
class TokenController {
  constructor (deps) {
    this.tokens = deps(TokenModel)
    this.auth = deps(Auth)
    this.jwt = deps(JWT)
  }

  async init (router) {
    router.post('/', this.auth.getMiddleware(), async ctx => {
      debug('creating pull token')
      const { amount, start, expiry, interval, cycles, cap, assetCode, assetScale, webhook } = ctx.request.body
      const { pointer } = await this.tokens.create({ amount, start, expiry, interval, cycles, cap, assetCode, assetScale, webhook })
      ctx.body = { pointer }
    })

    router.post('/:token', async ctx => {
      debug('creating pull token')
      const token = ctx.params.token
      const tokenInfo = await this.jwt.verify({ token })
      if (tokenInfo) {
        tokenInfo.token = token
        const { pointer } = await this.tokens.create(tokenInfo)
        ctx.body = { pointer }
      } else {
        ctx.throw(401, 'Unauthorized: Token could not be verified.')
      }
    })

    router.post('/update/:token', this.auth.getMiddleware(), async ctx => {
      debug('updating pull token')
      const updatedInfo = await this.tokens.update(ctx.params.token, ctx.request.body)
      ctx.body = updatedInfo
    })
  }
}

module.exports = TokenController
