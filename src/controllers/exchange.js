const Config = require('../lib/config')
const Exchange = require('../lib/exchange')
const ILDCP = require('ilp-protocol-ildcp')

class ExchangeController {
  constructor (deps) {
    this.config = deps(Config)
    this.exchange = deps(Exchange)
    this.plugin = this.config.plugin
  }

  async init (router) {
    this.assetDetails = await this.getAssetDetails()

    router.get('/exchange', async ctx => {
      const params = ctx.request.query
      const exchangeRate = await this.exchange.fetchRate(params.assetCode, params.assetScale, this.assetDetails.assetCode, this.assetDetails.assetScale)
      const amount = Math.floor(params.amount * exchangeRate)
      ctx.body = {
        amount,
        assetCode: this.assetDetails.assetCode,
        assetScale: this.assetDetails.assetScale
      }
    })
  }

  async getAssetDetails () {
    await this.plugin.connect()
    const details = await ILDCP.fetch(this.plugin.sendData.bind(this.plugin))
    return details
  }
}

module.exports = ExchangeController
