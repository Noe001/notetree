import { test, expect } from '@playwright/test';
import { reloadAndAssertSaved, reloadAndAssertNotSaved, MemoData } from '../lib/test-utils';

test.describe('メモ作成機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にアプリケーションにアクセス
    await page.goto('http://localhost:3000');
    
    // ログイン処理（必要に応じて）
    // await page.getByRole('button', { name: 'ログイン' }).click();
    // await page.getByLabel('メールアドレス').fill('test@example.com');
    // await page.getByLabel('パスワード').fill('password');
    // await page.getByRole('button', { name: 'ログイン' }).click();
  });

  test('メモの新規作成が正常に行えること', async ({ page }) => {
    // 前提条件: ログイン済み
    
    // 実行手順:
    // 1. メモ作成ボタンをクリック
    await page.getByRole('button', { name: '新しいメモを作成' }).click();
    
    // 2. タイトル、内容、タグを入力
    await page.getByLabel('タイトル *').fill('テストメモ');
    await page.getByLabel('内容 *').fill('これはテスト用のメモです。');
    await page.getByPlaceholder('タグを入力...').fill('テスト, メモ');
    await page.getByRole('button', { name: '追加' }).click(); // タグ追加
    
    // 3. メモを作成
    await page.getByRole('button', { name: 'メモを作成' }).click();
    
    // 4. リロードしてデータが保存されているか確認
    const memoData: MemoData = {
      title: 'テストメモ',
      content: 'これはテスト用のメモです。',
      tags: ['テスト', 'メモ']
    };
    await reloadAndAssertSaved(page, 'memo', memoData);
  });

  test('タイトルが未入力の場合、エラーメッセージが表示されること', async ({ page }) => {
    // 前提条件: ログイン済み
    
    // 実行手順:
    // 1. メモ作成ボタンをクリック
    await page.getByRole('button', { name: '新しいメモを作成' }).click();
    
    // 2. 内容のみを入力
    await page.getByLabel('内容 *').fill('これはテスト用のメモです。');
    
    // 3. メモを作成（タイトル未入力）
    await page.getByRole('button', { name: 'メモを作成' }).click();
    
    // 4. リロードしてデータが保存されていないことを確認
    await reloadAndAssertNotSaved(page, 'これはテスト用のメモです。');
  });

  test('タイトルが空文字の場合、エラーメッセージが表示されること', async ({ page }) => {
    // 前提条件: ログイン済み
    
    // 実行手順:
    // 1. メモ作成ボタンをクリック
    await page.getByRole('button', { name: '新しいメモを作成' }).click();
    
    // 2. タイトルに空文字、内容を入力
    await page.getByLabel('タイトル *').fill('');
    await page.getByLabel('内容 *').fill('これはテスト用のメモです。');
    
    // 3. メモを作成
    await page.getByRole('button', { name: 'メモを作成' }).click();
    
    // 4. リロードしてデータが保存されていないことを確認
    await reloadAndAssertNotSaved(page, 'これはテスト用のメモです。');
  });
});