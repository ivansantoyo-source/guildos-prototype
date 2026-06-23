import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '90s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
    http_reqs: ['rate>50'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const DEMO = '?demo=true';

const ENDPOINTS = [
  { path: `/api/inventory${DEMO}`, weight: 40 },
  { path: `/api/bounties${DEMO}`, weight: 30 },
  { path: `/api/nexus/lfg${DEMO}`, weight: 20 },
  { path: `/api/nexus/scores${DEMO}`, weight: 10 },
];

function weightedRandom() {
  const total = ENDPOINTS.reduce((s, e) => s + e.weight, 0);
  let r = Math.random() * total;
  for (const ep of ENDPOINTS) {
    r -= ep.weight;
    if (r <= 0) return ep.path;
  }
  return ENDPOINTS[0].path;
}

export default function () {
  const path = weightedRandom();
  const res = http.get(`${BASE_URL}${path}`);
  check(res, { 'status 2xx': (r) => r.status >= 200 && r.status < 300 });
  sleep(Math.random() * 2 + 1); // 1-3s delay
}
