import { test, expect } from '@playwright/test';

test.describe('ログイン機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にアプリケーションにアクセス
    await page.goto('http://localhost:3000');
  });

  test('登録済みユーザーがログインできること', async ({ page }) => {
    // 実行手順:
    // 1. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 2. メールアドレスとパスワードを入力
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード').fill('password123');
    
    // 3. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 4. リロードしてログイン状態が保持されているか確認
    await page.reload();
    
    // 期待結果:
    // - ログイン後の画面が表示されていること
    await expect(page.getByText('メモ')).toBeVisible();
    
    // - ユーザー名が表示されていること
    await expect(page.getByText('テストユーザー')).toBeVisible();
  });

  test('メールアドレスが未入力の場合、エラーメッセージが表示されること', async ({ page }) => {
    // 実行手順:
    // 1. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 2. パスワードのみを入力
    await page.getByLabel('パスワード').fill('password123');
    
    // 3. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 4. リロードして状態を確認
    await page.reload();
    
    // 期待結果:
    // - エラーメッセージが表示されること
    await expect(page.getByText('メールアドレスは必須です')).toBeVisible();
  });

  test('パスワードが未入力の場合、エラーメッセージが表示されること', async ({ page }) => {
    // 実行手順:
    // 1. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 2. メールアドレスのみを入力
    await page.getByLabel('メールアドレス').fill('test@example.com');
    
    // 3. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 4. リロードして状態を確認
    await page.reload();
    
    // 期待結果:
    // - エラーメッセージが表示されること
    await expect(page.getByText('パスワードは必須です')).toBeVisible();
  });

  test('存在しないメールアドレスでログインしようとすると、エラーメッセージが表示されること', async ({ page }) => {
    // 実行手順:
    // 1. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 2. 存在しないメールアドレスとパスワードを入力
    await page.getByLabel('メールアドレス').fill('nonexistent@example.com');
    await page.getByLabel('パスワード').fill('password123');
    
    // 3. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 4. リロードして状態を確認
    await page.reload();
    
    // 期待結果:
    // - エラーメッセージが表示されること
    await expect(page.getByText('ログインに失敗しました')).toBeVisible();
  });

  test('パスワードが間違っている場合、エラーメッセージが表示されること', async ({ page }) => {
    // 実行手順:
    // 1. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 2. 正しいメールアドレスと間違ったパスワードを入力
    await page.getByLabel('メールアドレス').fill('test@example.com');
    await page.getByLabel('パスワード').fill('wrongpassword');
    
    // 3. ログインボタンをクリック
    await page.getByRole('button', { name: 'ログイン' }).click();
    
    // 4. リロードして状態を確認
    await page.reload();
    
    // 期待結果:
    // - エラーメッセージが表示されること
    await expect(page.getByText('パスワードが間違っています')).toBeVisible();
  });
});