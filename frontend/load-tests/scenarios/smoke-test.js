import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  group('Landing page', () => {
    const res = http.get(`${BASE_URL}/`);
    check(res, { 'status 200': (r) => r.status === 200 });
    sleep(1);
  });

  group('Login page', () => {
    const res = http.get(`${BASE_URL}/login?demo=true`);
    check(res, { 'status 200': (r) => r.status === 200 });
    sleep(1);
  });

  group('Dashboard', () => {
    const res = http.get(`${BASE_URL}/dashboard?demo=true`);
    check(res, { 'status 200': (r) => r.status === 200 });
    sleep(1);
  });

  group('API health', () => {
    const res = http.get(`${BASE_URL}/api/system/mode`);
    check(res, { 'status 200': (r) => r.status === 200 });
  });
}
