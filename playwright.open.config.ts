import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});

