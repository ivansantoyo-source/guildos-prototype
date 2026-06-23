import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '540s', target: 20 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.03'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const D = '?demo=true';
const ROUTES = [
  `/api/inventory${D}`,
  `/api/bounties${D}`,
  `/api/nexus/lfg${D}`,
  `/api/nexus/scores${D}`,
  `/dashboard${D}`,
  `/inventory${D}`,
  `/bounty-board${D}`,
];

export default function () {
  const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
  const res = http.get(`${BASE_URL}${route}`);
  check(res, { 'ok': (r) => r.status >= 200 && r.status < 400 });
  sleep(Math.random() * 3 + 2);
}
