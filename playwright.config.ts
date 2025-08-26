import { defineConfig, devices } from '@playwright/test';
import { config as dotenv } from 'dotenv';

dotenv({ path: '.env.test', override: true });

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:5174',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5174',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      DATABASE_URL: process.env.DATABASE_URL,
      NEXT_PUBLIC_ENABLE_MOCK: process.env.NEXT_PUBLIC_ENABLE_MOCK,
      INTERNAL_API_TOKEN: process.env.INTERNAL_API_TOKEN,
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
