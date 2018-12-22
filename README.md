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
http POST mysubdomain.localtunnel.me amount=100 maximum=10000 interval=7 name='Amazon' Authorization:"Bearer test"
# {
#  "token": "$mysubdomain.localtunnel.me/f8095a44-c77f-4414-a19d-7aeca03f17c7"
# }

ilp-spsp query -p '$mysubdomain.localtunnel.me/f8095a44-c77f-4414-a19d-7aeca03f17c7'
# {
#   "destinationAccount": "private.moneyd.local.PacgxNqHIKTlZGM3aB_2YrXQydNPASI_j8LyE4BFmnc.uNiOoTJbbJrcqb2aHO9Kh51W~f8095a44-c77f-4414-a19d-7aeca03f17c7",
#   "sharedSecret": "b88NPGVk5nubgM6zpnI/tVjRdgpUh+JvMueRFEMvPcY=",
#   "balance": {
#     "amount": "100",
#     "current": "0",
#     "maximum": "10000"
#   },
#   "receiverInfo": {
#     "name": "Amazon",
#     "interval": "7",
#     "cooldown": "1546037535"
#   },
#   "contentType": "application/spsp4+json"
# }


# !!! For this to work, you have to run a version of ilp-spsp that supports pull payments.
ilp-spsp pull -r '$mysubdomain.localtunnel.me/f8095a44-c77f-4414-a19d-7aeca03f17c7'
# pulling from "$mysubdomain.localtunnel.me/f8095a44-c77f-4414-a19d-7aeca03f17c7"...


ilp-spsp query -p '$mysubdomain.localtunnel.me/f8095a44-c77f-4414-a19d-7aeca03f17c7'
# {
#   "destinationAccount": "private.moneyd.local.PacgxNqHIKTlZGM3aB_2YrXQydNPASI_j8LyE4BFmnc.uNiOoTJbbJrcqb2aHO9Kh51W~f8095a44-c77f-4414-a19d-7aeca03f17c7",
#   "sharedSecret": "b88NPGVk5nubgM6zpnI/tVjRdgpUh+JvMueRFEMvPcY=",
#   "balance": {
#     "amount": "100",
#     "current": "100",
#     "maximum": "10000"
#   },
#   "receiverInfo": {
#     "name": "Amazon",
#     "interval": "7",
#     "cooldown": "1546037535"
#   },
#   "contentType": "application/spsp4+json"
# }
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

Create a pull payment token.

#### Request

- `amount` -  Amoount to be pulled each interval.
- `maximum` - Total of pull payments that can be made.
- `webhook` - (Optional) Webhook to `POST` to after the invoice is fully paid. See [Webhooks](#webhooks)

#### Response

- `token` - Payment pointer to be pulled from.

### Query a pull payment token

```http
GET /:token_id 
```
Needs the header `Accept:"application/spsp4+json"`.

SPSP endpoint for the token with `:toekn_id`. The payment pointer
returned by [Create a pull payment token](#create-a-pull-payment-token) resolves to this endpoint.

### Webhooks

When you [Create a pull payment token](#create-a-pull-payment-token) and specify a webhook, it will
call the specified webhook when the payment has been pulled. The request is a `POST` with

```http
Authorization: Bearer <SPSP_AUTH_TOKEN>

{
 "amount": "100",
  "current": "0",
  "maximum": "10000",
  "name": "Amazon",
  "interval": "7",
  "cooldown": "1545436808",
  "pointer": "$mysubdomain.localtunnel.me/f8095a44-c77f-4414-a19d-7aeca03f17c7",
}
```
