# GuildOS Load Testing Suite

Performance and scalability testing for GuildOS using [k6](https://k6.io).

## Prerequisites

```bash
brew install k6
```

## Quick Start

```bash
# Run smoke test against local dev server (requires `npm run dev`)
npm run test:smoke

# Run full suite against local dev server
npm run test:load

# Run full suite against production
npm run test:load:prod
```

## Scenarios

| File | VUs | Duration | Description |
|------|-----|----------|-------------|
| `scenarios/smoke-test.js` | 1 VU | ~5s | Minimal sanity check (landing, login, dashboard, API health) |
| `scenarios/api-load-test.js` | 20-50 VU | 3 min | Weighted API endpoint load with ramp-up/ramp-down |
| `scenarios/page-load-test.js` | 10-30 VU | 2 min | Simulated user browsing: landing -> login -> 3 random pages |
| `scenarios/spike-test.js` | 200 VU | 50s | Instant 200-VU surge on a single API endpoint |
| `scenarios/endurance-test.js` | 20 VU | 10 min | Sustained steady load across API routes and pages |

## Running Manually

```bash
# Run a single scenario
k6 run --env BASE_URL=https://guildos-flax.vercel.app load-tests/scenarios/smoke-test.js

# Run with local dev server
k6 run --env BASE_URL=http://localhost:3000 load-tests/scenarios/api-load-test.js
```

## Safety

All tests use `?demo=true` to avoid touching real data. The production suite runs against live Vercel, so keep the spike test (200 VUs, 10s ramp) judicious.

## Thresholds

- **p(95) response time:** < 2000-5000ms depending on scenario
- **p(99) response time:** < 5000-10000ms (spike only)
- **Error rate:** < 1-10% depending on scenario severity
- **Request rate:** > 50 req/s (API load test)
