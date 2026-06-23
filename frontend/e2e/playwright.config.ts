import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  // Default 30s; auth flows may need up to 45s for API calls + redirects
  timeout: 45000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    // Allow longer navigation waits
    navigationTimeout: 30000,
    actionTimeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  // Auto-start dev server for CI and local runs
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000/login',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    cwd: process.cwd(),
  },
});
