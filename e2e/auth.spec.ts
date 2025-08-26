import { test, expect } from '@playwright/test';

test('shows login form when unauthenticated', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, body: JSON.stringify({ success: false }) }));
  await page.goto('/');
  await expect(page.getByLabel('メールアドレス')).toBeVisible();
});

test('login form accepts input', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, body: JSON.stringify({ success: false }) }));
  await page.goto('/');
  await page.getByLabel('メールアドレス').fill('user@example.com');
  await page.getByLabel('パスワード').fill('password');
  await expect(page.getByLabel('メールアドレス')).toHaveValue('user@example.com');
});

test('can switch to sign up form', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, body: JSON.stringify({ success: false }) }));
  await page.goto('/');
  await page.getByRole('button', { name: 'サインアップ' }).click();
  await expect(page.getByLabel('ユーザー名')).toBeVisible();
});

test('sign up form accepts input', async ({ page }) => {
  await page.route('**/api/auth/me', route => route.fulfill({ status: 401, body: JSON.stringify({ success: false }) }));
  await page.goto('/');
  await page.getByRole('button', { name: 'サインアップ' }).click();
  await page.getByLabel('ユーザー名').fill('tester');
  await expect(page.getByLabel('ユーザー名')).toHaveValue('tester');
});

test('successful login shows memo app', async ({ page }) => {
  let loggedIn = false;
  await page.route('**/api/auth/me', route => {
    if (loggedIn) {
      route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: { id: '1', email: 'user@example.com' } }) });
    } else {
      route.fulfill({ status: 401, body: JSON.stringify({ success: false }) });
    }
  });
  await page.route('**/api/auth/login', route => {
    loggedIn = true;
    route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
  });
  await page.route('**/api/**', route => {
    if (route.request().url().includes('/api/auth/')) return route.fallback();
    route.fulfill({ status: 200, body: JSON.stringify({ success: true, data: [] }) });
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.getByLabel('メールアドレス').fill('user@example.com');
  await page.getByLabel('パスワード').fill('password');
  await page.locator('form').getByRole('button', { name: /ログイン/ }).click();
  await expect(page.getByRole('button', { name: '新しいメモを作成' })).toBeVisible();
});
