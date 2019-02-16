# ILP SPSP Pull Payment Server
> SPSP server that supports pull payments

- [Usage](#usage)
- [Environment Variables](#environment-variables)
- [API](#api)
  - [Create a pull payment token](#create-a-pull-payment-token)
  - [Query a pull payment token](#query-a-pull-payment-token)
  - [Webhooks](#webhooks)

## Usage

Start the server
```sh
SPSP_LOCALTUNNEL=true SPSP_LOCALTUNNEL_SUBDOMAIN=mysubdomain npm start
```
Online creation of a pull payment token (information about the query parameters are in section [Request](###Request))

```http
http POST mysubdomain.localtunnel.me amount=100 interval=P0Y0M0DT0H1M cycles=10 cap=false assetCode=XRP assetScale=6 Authorization:"Bearer test" 
HTTP/1.1 200 OK
Connection: keep-alive
Content-Length: 333
Content-Type: application/json; charset=utf-8
Date: Tue, 12 Feb 2019 19:33:45 GMT
Server: nginx/1.10.1

{
    "pointer": "$mysubdomain.localtunnel.me/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbW91bnQiOiIxMDAiLCJzdGFydCI6IjIwMTktMDItMTJUMTk6MzM6NDUuMTE1WiIsImludGVydmFsIjoiUDBZME0wRFQwSDFNIiwiY3ljbGVzIjoiMTAiLCJjYXAiOiJmYWxzZSIsImFzc2V0Q29kZSI6IlhSUCIsImFzc2V0U2NhbGUiOiI2IiwiaWF0IjoxNTUwMDAwMDI1fQ.qIf8kxq2DU3L6GcaPZSZJOBOksxEoEmUxWiRkyvmO44"
}
```
Query the token
```sh
ilp-spsp query -p '$mysubdomain.localtunnel.me/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbW91bnQiOiIxMDAiLCJzdGFydCI6IjIwMTktMDItMTJUMTk6MzM6NDUuMTE1WiIsImludGVydmFsIjoiUDBZME0wRFQwSDFNIiwiY3ljbGVzIjoiMTAiLCJjYXAiOiJmYWxzZSIsImFzc2V0Q29kZSI6IlhSUCIsImFzc2V0U2NhbGUiOiI2IiwiaWF0IjoxNTUwMDAwMDI1fQ.qIf8kxq2DU3L6GcaPZSZJOBOksxEoEmUxWiRkyvmO44'
{
  "destinationAccount": "private.moneyd.local.BWHJ-a8wR_pvtns2kZGPl2mZ9oMnhjgCkg0L38zIs6E.aaB89gkDgV22aG54_b8BVAua~eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9~eyJhbW91bnQiOiIxMDAiLCJzdGFydCI6IjIwMTktMDItMTJUMTk6MzM6NDUuMTE1WiIsImludGVydmFsIjoiUDBZME0wRFQwSDFNIiwiY3ljbGVzIjoiMTAiLCJjYXAiOiJmYWxzZSIsImFzc2V0Q29kZSI6IlhSUCIsImFzc2V0U2NhbGUiOiI2IiwiaWF0IjoxNTUwMDAwMDI1fQ~qIf8kxq2DU3L6GcaPZSZJOBOksxEoEmUxWiRkyvmO44",
  "sharedSecret": "/jIo5GsubZObjhf/41Y+il3+jJXsTrQfWG6EDOc8d80=",
  "balance": {
    "interval": "0",
    "total": "0"
  },
  "contentType": "application/spsp4+json"
}
```

Pull from that endpoint (!!! For this to work, you have to run a version of ilp-spsp that supports pull payments)
```sh
ilp-spsp pull -p '$mysubdomain.localtunnel.me/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbW91bnQiOiIxMDAiLCJzdGFydCI6IjIwMTktMDItMTJUMTk6MzM6NDUuMTE1WiIsImludGVydmFsIjoiUDBZME0wRFQwSDFNIiwiY3ljbGVzIjoiMTAiLCJjYXAiOiJmYWxzZSIsImFzc2V0Q29kZSI6IlhSUCIsImFzc2V0U2NhbGUiOiI2IiwiaWF0IjoxNTUwMDAwMDI1fQ.qIf8kxq2DU3L6GcaPZSZJOBOksxEoEmUxWiRkyvmO44'
pulling from "$mysubdomain.localtunnel.me/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbW91bnQiOiIxMDAiLCJzdGFydCI6IjIwMTktMDItMTJUMTk6MzM6NDUuMTE1WiIsImludGVydmFsIjoiUDBZME0wRFQwSDFNIiwiY3ljbGVzIjoiMTAiLCJjYXAiOiJmYWxzZSIsImFzc2V0Q29kZSI6IlhSUCIsImFzc2V0U2NhbGUiOiI2IiwiaWF0IjoxNTUwMDAwMDI1fQ.qIf8kxq2DU3L6GcaPZSZJOBOksxEoEmUxWiRkyvmO44"...
pulled 100 units!
```

Query again
```sh
ilp-spsp query -p '$mysubdomain.localtunnel.me/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbW91bnQiOiIxMDAiLCJzdGFydCI6IjIwMTktMDItMTJUMTk6MzM6NDUuMTE1WiIsImludGVydmFsIjoiUDBZME0wRFQwSDFNIiwiY3ljbGVzIjoiMTAiLCJjYXAiOiJmYWxzZSIsImFzc2V0Q29kZSI6IlhSUCIsImFzc2V0U2NhbGUiOiI2IiwiaWF0IjoxNTUwMDAwMDI1fQ.qIf8kxq2DU3L6GcaPZSZJOBOksxEoEmUxWiRkyvmO44'
{
  "destinationAccount": "private.moneyd.local.BWHJ-a8wR_pvtns2kZGPl2mZ9oMnhjgCkg0L38zIs6E.aaB89gkDgV22aG54_b8BVAua~eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9~eyJhbW91bnQiOiIxMDAiLCJzdGFydCI6IjIwMTktMDItMTJUMTk6MzM6NDUuMTE1WiIsImludGVydmFsIjoiUDBZME0wRFQwSDFNIiwiY3ljbGVzIjoiMTAiLCJjYXAiOiJmYWxzZSIsImFzc2V0Q29kZSI6IlhSUCIsImFzc2V0U2NhbGUiOiI2IiwiaWF0IjoxNTUwMDAwMDI1fQ~qIf8kxq2DU3L6GcaPZSZJOBOksxEoEmUxWiRkyvmO44",
  "sharedSecret": "/jIo5GsubZObjhf/41Y+il3+jJXsTrQfWG6EDOc8d80=",
  "balance": {
    "interval": "100",
    "total": "100"
  },
  "contentType": "application/spsp4+json"
}
```

### Using an offline token

A token can also be created offline by generating a JWT containing all the necessary [parameters](####Request) and signing it with the same secret ([SPSP_JWT_SECRET](##Environment-Variables)) used by the server. If the client tries to pull using an offline generated token, the server will try to verify it and if it can, it will allow the pull. 

### Making a push payment to the SPSP server
```sh
ilp-spsp send -a 100 -p '$mysubdomain.localtunnel.me'
paying 100 to "$mysubdomain.localtunnel.me"...
sent!
```

## Environment Variables

| Name | Default | Description |
|:---|:---|:---|
| `SPSP_PORT` | `6000` | port to listen on locally. |
| `SPSP_LOCALTUNNEL` | | If this variable is defined, `SPSP_PORT` will be proxied by localtunnel under `SPSP_LOCALTUNNEL_SUBDOMAIN`. |
| `SPSP_LOCALTUNNEL_SUBDOMAIN` | | Subdomain to forward `SPSP_PORT` to. Must be defined if you set `SPSP_LOCALTUNNEL` |
| `SPSP_DB_PATH` | | Path for leveldb database. Uses in-memory database if unspecified. |
| `SPSP_JWT_SECRET` | `test` | Secret used for token generation and verification. |
| `SPSP_AUTH_TOKEN` | `test` | Bearer token for creating invoices and receiving webhooks. |
| `SPSP_HOST` | localhost or localtunnel | Host to include in payment pointers |

## API

### Create a pull payment token

```http
POST /
```

Requires authentication. Creates a pull payment token.

#### Request

- `amount` -  Amount available each interval.
- `start` - _(Optional)_ [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) UTC timestamp
- `interval` - [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) duration
- `cycles` - Number of repititions of the interval; defines the expiry of the endpoint.
- `cap` - If `true`, maximum pullable amount per interval is `amount` (_use it or loose it_); if `false`, maximum pullable amount per interval is the accumulation of funds that have not been pulled.
- `assetCode` - Asset the pull payment is made in.
- `assetScale` - Scale the asset is measured in. If `amount` equal to `1000`, `assetCode` equal to `USD` and `assetScale` equal to `2`, amount denotes 10.00 USD.
- `webhook` - (Optional) Webhook to `POST` to after the endpoint has been pulled from. See [Webhooks](#webhooks)

#### Response

- `pointer` - Payment pointer to be pulled from, including the token.

### Query a pull payment token

```http
GET /:token
```
Needs the header `Accept:"application/spsp4+json"`.

SPSP endpoint storing the information to set up a STREAM connection for pulling for this particular `:token`. The payment pointer
returned by [Create a pull payment token](#create-a-pull-payment-token) resolves to this endpoint.

### Webhooks

When you [Create a pull payment token](#create-a-pull-payment-token) and specify a webhook, it will
call the specified webhook when the payment has been pulled. The request is a `POST` with

```http
Authorization: Bearer <SPSP_AUTH_TOKEN>

{
  "balanceTotal": "400",
  "balanceInterval": "100",
  "pointer": "$mysubdomain.localtunnel.me/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhbW91bnQiOiIxMDAiLCJzdGFydCI6IjIwMTktMDItMTJUMTk6MzM6NDUuMTE1WiIsImludGVydmFsIjoiUDBZME0wRFQwSDFNIiwiY3ljbGVzIjoiMTAiLCJjYXAiOiJmYWxzZSIsImFzc2V0Q29kZSI6IlhSUCIsImFzc2V0U2NhbGUiOiI2IiwiaWF0IjoxNTUwMDAwMDI1fQ.qIf8kxq2DU3L6GcaPZSZJOBOksxEoEmUxWiRkyvmO44"
}
```
