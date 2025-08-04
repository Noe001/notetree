import { test, expect } from '@playwright/test';
import { reloadPage } from '../lib/test-utils';

test.describe('リアルタイム編集機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にアプリケーションにアクセス
    await page.goto('http://localhost:3000');
    
    // ログイン処理（必要に応じて）
    // await page.getByRole('button', { name: 'ログイン' }).click();
    // await page.getByLabel('メールアドレス').fill('test@example.com');
    // await page.getByLabel('パスワード').fill('password');
    // await page.getByRole('button', { name: 'ログイン' }).click();
  });

  test('複数ユーザーが同時に同じメモを編集できること', async ({ page }) => {
    // 前提条件: ログイン済み、編集対象のメモがある
    
    // 実行手順:
    // 1. メモ一覧から編集するメモを選択
    await page.getByText('共有メモ').click();
    
    // 2. メモの内容を編集
    await page.getByLabel('内容').fill('ユーザー1による編集');
    
    // 3. 別のセッションで同じメモを編集（別途テストで実装）
    // ここでは他のユーザーの編集が反映されるのを待つ
    await page.waitForTimeout(1000);
    
    // 4. リロードしてデータが保存されているか確認
    await reloadPage(page);
    
    // 期待結果:
    // - 他のユーザーの編集内容がリアルタイムに反映されていること
    await expect(page.getByText('ユーザー2による編集')).toBeVisible();
    
    // - 自分の編集内容も保持されていること
    await expect(page.getByText('ユーザー1による編集')).toBeVisible();
  });

  test('編集競合が正しく処理されること', async ({ page }) => {
    // 前提条件: ログイン済み、編集対象のメモがある
    
    // 実行手順:
    // 1. メモ一覧から編集するメモを選択
    await page.getByText('共有メモ').click();
    
    // 2. 同じフィールドを同時に編集（別途テストで実装）
    await page.getByLabel('タイトル').fill('競合テストタイトル');
    
    // 3. リロードしてデータが保存されているか確認
    await reloadPage(page);
    
    // 期待結果:
    // - 編集競合の警告メッセージが表示されること
    await expect(page.getByText('編集競合が検出されました')).toBeVisible();
    
    // - ユーザーに競合の解決方法が提示されること
    await expect(page.getByText('最新の内容を確認してください')).toBeVisible();
  });
});