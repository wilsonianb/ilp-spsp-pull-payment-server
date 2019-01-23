# ILP SPSP Pull Payment Server
> SPSP server that supports pull payments

- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [API](#api)
  - [Create a pull payment token](#create-a-pull-payment-token)
  - [Query a pull payment token](#query-a-pull-payment-token)
  - [Webhooks](#webhooks)

## Usage

```sh
SPSP_LOCALTUNNEL=true SPSP_LOCALTUNNEL_SUBDOMAIN=mysubdomain npm start

# creates a pull payment token including the amount of each payment, the maximum that can be pulled from this endpoint, and an interval in days describing how often money can be pulled
http POST mysubdomain.localtunnel.me amount=100 frequency=WEEK interval=2 cycles=52 assetCode=XRP assetScale=6 Authorization:"Bearer test"
# {
#     "token": "$mysubdomain.localtunnel.me/42d2e38d-e324-4adf-86eb-4efd4068fad8"
# }

ilp-spsp query -p '$mysubdomain.localtunnel.me/42d2e38d-e324-4adf-86eb-4efd4068fad8'
# {
#   "destinationAccount": "private.moneyd.local.7sU0UU1CjjwtTljClHjuBE_je287LqcvQShNM_j6xFM.NAg8G0TwKXJ7NVvffuID3mM6~42d2e38d-e324-4adf-86eb-4efd4068fad8",
#   "sharedSecret": "kpKd+wMzxLmgZK8+sK9slbcnIBuunSU4TELe0BNSep8=",
#   "balance": {
#     "current": "100",
#     "maximum": "100"
#   },
#   "assetInfo": {
#     "asset_code": "XRP",
#     "asset_scale": "6"
#   },
#   "frequencyInfo": {
#     "type": "WEEK",
#     "interval": 2
#   },
#   "timelineInfo": {
#     "refill_time": "2019-02-06T00:52:55Z",
#     "expiry_time": "2021-01-20T00:52:55Z"
#   },
#   "contentType": "application/spsp4+json"
# }


# !!! For this to work, you have to run a version of ilp-spsp that supports pull payments.
ilp-spsp pull -p '$mysubdomain.localtunnel.me/42d2e38d-e324-4adf-86eb-4efd4068fad8'
# pulling from "$mysubdomain.localtunnel.me/42d2e38d-e324-4adf-86eb-4efd4068fad8"...
# pulled 100 units!

ilp-spsp query -p '$mysubdomain.localtunnel.me/42d2e38d-e324-4adf-86eb-4efd4068fad8'
# {
#   "destinationAccount": "private.moneyd.local.7sU0UU1CjjwtTljClHjuBE_je287LqcvQShNM_j6xFM.ju-1yyu7MYas0yQB3Mtr2ISe~42d2e38d-e324-4adf-86eb-4efd4068fad8",
#   "sharedSecret": "LwYhK9Mg96udCTYdGbvmfCBOVnDdCdLhmmuVfo4qnHg=",
#   "balance": {
#     "current": "0",
#     "maximum": "100"
#   },
#   "assetInfo": {
#     "asset_code": "XRP",
#     "asset_scale": "6"
#   },
#   "frequencyInfo": {
#     "type": "WEEK",
#     "interval": 2
#   },
#   "timelineInfo": {
#     "refill_time": "2019-02-06T00:52:55Z",
#     "expiry_time": "2021-01-20T00:52:55Z"
#   },
#   "contentType": "application/spsp4+json"
# }


ilp-spsp send -a 100 -p '$mysubdomain.localtunnel.me'
# paying 100 to "$mysubdomain.localtunnel.me"...
# sent!
```

## Environment Variables

| Name | Default | Description |
|:---|:---|:---|
| `SPSP_PORT` | `6000` | port to listen on locally. |
| `SPSP_LOCALTUNNEL` | | If this variable is defined, `SPSP_PORT` will be proxied by localtunnel under `SPSP_LOCALTUNNEL_SUBDOMAIN`. |
| `SPSP_LOCALTUNNEL_SUBDOMAIN` | | Subdomain to forward `SPSP_PORT` to. Must be defined if you set `SPSP_LOCALTUNNEL` |
| `SPSP_DB_PATH` | | Path for leveldb database. Uses in-memory database if unspecified. |
| `SPSP_AUTH_TOKEN` | `test` | Bearer token for creating invoices and receiving webhooks. |
| `SPSP_HOST` | localhost or localtunnel | Host to include in payment pointers |

## API

### Create a pull payment token

```http
POST /
```

Requires authentication. Creates a pull payment token.

#### Request

- `amount` -  Amount to be pulled each interval.
- `frequency` - Frequency in which the pull amount `balance.maximum` is refilled. Possible values are `DAY`, `WEEK`, `MONTH`, `YEAR`.
- `interval` - Interval correponding to the `frequency`. If `interval` equal to `2` and `frequency` equal to `WEEK`, `balance.maximum` is refilled every 2 weeks.
- `cycle` - Number of times `timing_info.refill_time` is decreased by `interval` + `frequency`. It defines `timing_info.expiry_time`.
- `assetCode` - Asset the pull payment is made in.
- `assetScale` - Scale the asset is measured in. If `amount` equal to `1000`, `assetCode` equal to `USD` and `assetScale` equal to `2`, amount denotes 10.00 USD.
- `webhook` - (Optional) Webhook to `POST` to after the endpoint has been pulled from. See [Webhooks](#webhooks)

#### Response

- `token` - Payment pointer to be pulled from.

### Query a pull payment token

```http
GET /:token_id 
```
Needs the header `Accept:"application/spsp4+json"`.

SPSP endpoint storing the information of the pull payment agreement corresponding to the token with `:token_id`. The payment pointer
returned by [Create a pull payment token](#create-a-pull-payment-token) resolves to this endpoint.

### Webhooks

When you [Create a pull payment token](#create-a-pull-payment-token) and specify a webhook, it will
call the specified webhook when the payment has been pulled. The request is a `POST` with

```http
Authorization: Bearer <SPSP_AUTH_TOKEN>

{
  "balance": "0",
  "maximum": "100",
  "refill_time": "2019-02-06T00:52:55Z",
  "expiry_time": "2021-01-20T00:52:55Z",
  "frequency": "WEEK",
  "interval": 2,
  "asset_code": "XRP",
  "asset_scale": 6,
  "webhook": "http://example.com/webhook",
  "pointer": "$mysubdomain.localtunnel.me/42d2e38d-e324-4adf-86eb-4efd4068fad8",
}
```
