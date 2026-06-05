import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Mobile-XS (320x568)',
      use: { viewport: { width: 320, height: 568 } },
    },
    {
      name: 'Mobile-S (375x667)',
      use: { viewport: { width: 375, height: 667 } },
    },
    {
      name: 'Tablet-P (768x1024)',
      use: { viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'Tablet-L (1024x768)',
      use: { viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'Desktop (1440x900)',
      use: { viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
