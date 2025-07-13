import { defineConfig, devices } from '@playwright/test';

/**
 * Simplified config for security tests without auth dependency
 */
export default defineConfig({
  testDir: './test',
  fullyParallel: true,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: process.env.GRAFANA_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'security-tests',
      use: {
        ...devices['Desktop Chrome'],
      },
      testMatch: ['**/complete-security.spec.ts'],
    },
  ],
});