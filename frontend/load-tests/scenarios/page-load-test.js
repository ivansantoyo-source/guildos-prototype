import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  stages: [
    { duration: '20s', target: 10 },
    { duration: '40s', target: 30 },
    { duration: '60s', target: 30 },
    { duration: '20s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const D = '?demo=true';

const PAGES = ['/dashboard', '/inventory', '/bounty-board', '/nexus', '/potions', '/profile'];

export default function () {
  group('Browse', () => {
    // Landing
    http.get(`${BASE_URL}/`);
    sleep(Math.random() * 3 + 1);

    // Login page
    http.get(`${BASE_URL}/login${D}`);
    sleep(Math.random() * 1 + 0.5);

    // Browse 3 random pages
    const shuffled = PAGES.sort(() => Math.random() - 0.5).slice(0, 3);
    for (const page of shuffled) {
      const res = http.get(`${BASE_URL}${page}${D}`);
      check(res, { [`${page} OK`]: (r) => r.status === 200 });
      sleep(Math.random() * 4 + 2);
    }
  });
}
