# GateKeep

> Lightweight API monetization proxy. Drop it in front of any HTTP service to handle authentication, rate limiting, plan enforcement, and Stripe-based billing.

```
Client → GateKeep → Your API
```

No changes required in your backend.

---

## Features

- API key authentication
- Per-plan rate limits
- Monthly usage quotas
- Stripe subscription integration
- Redis-powered high-performance counters
- Postgres for canonical state
- Usage enforcement at the edge

---

## How It Works Internally

```
┌─────────────────────────────────────────────────────────────────────┐
│                          INCOMING REQUEST                           │
│                   POST /v1/data  +  Bearer sk_live_xxx              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        GATEKEEP PROXY                              │
│                                                                     │
│   ┌─────────────────┐                                               │
│   │  1. Auth Layer  │  ── Hashes API key ──► Lookup in Postgres     │
│   │                 │     (ApiKey table)      returns userId + planId│
│   └────────┬────────┘                                               │
│            │ userId + planId                                        │
│            ▼                                                        │
│   ┌─────────────────┐                                               │
│   │  2. Rate Limit  │  ── Sliding window counter in Redis           │
│   │     Check       │     key: ratelimit:{userId}:{window}          │
│   │                 │     Plan limit: e.g. 100 req/min              │
│   └────────┬────────┘                                               │
│            │ pass / 429 Too Many Requests                          │
│            ▼                                                        │
│   ┌─────────────────┐                                               │
│   │  3. Quota Check │  ── Monthly counter in Redis                  │
│   │                 │     key: quota:{userId}:{YYYY-MM}             │
│   │                 │     Plan quota: e.g. 10,000 req/month         │
│   └────────┬────────┘                                               │
│            │ pass / 402 Payment Required                           │
│            ▼                                                        │
│   ┌─────────────────┐                                               │
│   │  4. Usage Record│  ── Async write to Postgres (UsageRecord)     │
│   │                 │     Non-blocking — doesn't add latency        │
│   └────────┬────────┘                                               │
│            │                                                        │
│            ▼                                                        │
│   ┌─────────────────┐                                               │
│   │  5. Upstream    │  ── http-proxy-middleware → UPSTREAM_URL      │
│   │     Forward     │     Strips Authorization header               │
│   │                 │     Injects X-User-Id, X-Plan-Id headers      │
│   └────────┬────────┘                                               │
│            │                                                        │
└────────────┼────────────────────────────────────────────────────────┘
             │
             ▼
┌────────────────────────┐
│   YOUR UPSTREAM API    │
│   (unchanged)          │
└────────────────────────┘
             │
             ▼
       Response flows
       back to client
```

### Data Store Responsibilities

```
┌─────────────────────────────┐    ┌──────────────────────────────────┐
│           REDIS             │    │           POSTGRES               │
│   (hot path — μs latency)   │    │     (canonical state — truth)    │
├─────────────────────────────┤    ├──────────────────────────────────┤
│  ratelimit:{uid}:{window}   │    │  User          — identity        │
│  quota:{uid}:{YYYY-MM}      │    │  ApiKey        — hashed keys     │
│  session:{uid}:plan_cache   │    │  Plan          — limits/pricing  │
│                             │    │  Subscription  — Stripe state    │
│  TTL-managed automatically  │    │  UsageRecord   — billing audit   │
│  Survives restarts via AOF  │    │  WebhookEvent  — idempotency     │
└─────────────────────────────┘    └──────────────────────────────────┘
```

### Stripe Webhook Flow

```
Stripe ──► POST /webhooks/stripe
                │
                ├─► Verify signature (STRIPE_WEBHOOK_SECRET)
                ├─► Idempotency check (WebhookEvent table)
                │
                ├─► customer.subscription.updated
                │       └─► Update Subscription in Postgres
                │           Invalidate Redis plan cache
                │
                └─► invoice.payment_failed
                        └─► Suspend ApiKey (active = false)
                            Next request returns 402
```

---

## Architecture

- **Node.js + TypeScript** (Fastify)
- **PostgreSQL** — users, plans, subscriptions
- **Redis** — rate limiting + usage counters
- **Stripe** — billing + webhooks
- **Docker-ready**

---

## Environment Variables

```env
DATABASE_URL=
REDIS_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
UPSTREAM_URL=
```

---

## Run Locally

```bash
docker-compose up --build
```

or

```bash
npm install
npx prisma migrate dev
npm run dev
```

---

## Example Request

```bash
curl https://your-proxy.com/v1/data \
  -H "Authorization: Bearer sk_live_xxx"
```

---

## Core Tables

| Table | Purpose |
|---|---|
| `User` | Identity + account |
| `ApiKey` | Hashed key → user mapping |
| `Plan` | Rate limits, quotas, pricing |
| `Subscription` | Stripe subscription state |
| `UsageRecord` | Per-request audit log |
| `WebhookEvent` | Idempotent Stripe event processing |

Redis handles runtime counters. Postgres stores canonical state.

---

## Why GateKeep?

Startups shouldn't rebuild authentication + billing enforcement for every API.

GateKeep lets you:
- Monetize APIs instantly
- Enforce quotas reliably
- Ship faster

---