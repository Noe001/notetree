import { test, expect } from '@playwright/test';

test('opens home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('メールアドレス')).toBeVisible({ timeout: 15000 });
});

