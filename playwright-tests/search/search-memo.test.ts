import { test, expect } from '@playwright/test';
import { reloadPage } from '../lib/test-utils';

test.describe('メモ検索機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にアプリケーションにアクセス
    await page.goto('http://localhost:3000');
    
    // ログイン処理（必要に応じて）
    // await page.getByRole('button', { name: 'ログイン' }).click();
    // await page.getByLabel('メールアドレス').fill('test@example.com');
    // await page.getByLabel('パスワード').fill('password');
    // await page.getByRole('button', { name: 'ログイン' }).click();
  });

  test('キーワードを入力してメモを検索できること', async ({ page }) => {
    // 前提条件: ログイン済み、検索対象のメモがある
    
    // 実行手順:
    // 1. 検索ボックスにキーワードを入力
    await page.getByPlaceholder('メモを検索...').fill('テスト');
    
    // 2. 検索を実行（Enterキーまたは検索ボタン）
    await page.press('input[placeholder="メモを検索..."]', 'Enter');
    
    // 3. リロードして検索結果が保持されているか確認
    await reloadPage(page);
    
    // 期待結果:
    // - 検索キーワードを含むメモが表示されていること
    await expect(page.getByText('テストメモ')).toBeVisible();
    
    // - 検索キーワードを含まないメモは表示されていないこと
    await expect(page.getByText('非表示メモ')).not.toBeVisible();
  });

  test('検索結果が0件の場合、適切なメッセージが表示されること', async ({ page }) => {
    // 前提条件: ログイン済み
    
    // 実行手順:
    // 1. 検索ボックスに存在しないキーワードを入力
    await page.getByPlaceholder('メモを検索...').fill('存在しないキーワード');
    
    // 2. 検索を実行
    await page.press('input[placeholder="メモを検索..."]', 'Enter');
    
    // 3. リロードして検索結果が保持されているか確認
    await reloadPage(page);
    
    // 期待結果:
    // - 「メモが見つかりません」というメッセージが表示されること
    await expect(page.getByText('メモが見つかりません')).toBeVisible();
  });
});