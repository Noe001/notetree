import { test, expect } from '@playwright/test';
import { reloadAndAssertSaved, MemoData } from '../lib/test-utils';

test.describe('メモ編集機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にアプリケーションにアクセス
    await page.goto('http://localhost:3000');
    
    // ログイン処理（必要に応じて）
    // await page.getByRole('button', { name: 'ログイン' }).click();
    // await page.getByLabel('メールアドレス').fill('test@example.com');
    // await page.getByLabel('パスワード').fill('password');
    // await page.getByRole('button', { name: 'ログイン' }).click();
  });

  test('既存のメモを編集できること', async ({ page }) => {
    // 前提条件: ログイン済み、既存のメモがある
    
    // 実行手順:
    // 1. メモ一覧から編集するメモを選択
    await page.getByText('テストメモ').click();
    
    // 2. 編集モードに入る（必要に応じて）
    // 既に編集モードになっている場合はこのステップをスキップ
    
    // 3. タイトル、内容、タグを変更
    await page.getByLabel('タイトル').fill('更新されたテストメモ');
    await page.getByLabel('内容').fill('これは更新されたテスト用のメモです。');
    await page.getByLabel('タグ').fill('更新, テスト');
    
    // 4. メモを更新
    await page.getByRole('button', { name: 'メモを更新' }).click();
    
    // 5. リロードしてデータが保存されているか確認
    const updatedMemoData: MemoData = {
      title: '更新されたテストメモ',
      content: 'これは更新されたテスト用のメモです。',
      tags: ['更新', 'テスト']
    };
    await reloadAndAssertSaved(page, 'memo', updatedMemoData);
  });

  test('編集後のデータが正しく保存されること', async ({ page }) => {
    // 前提条件: ログイン済み、既存のメモがある
    
    // 実行手順:
    // 1. メモ一覧から編集するメモを選択
    await page.getByText('更新されたテストメモ').click();
    
    // 2. タイトルを変更
    await page.getByLabel('タイトル').fill('最終更新メモ');
    
    // 3. メモを更新
    await page.getByRole('button', { name: 'メモを更新' }).click();
    
    // 4. リロードしてデータが保存されているか確認
    const finalMemoData: MemoData = {
      title: '最終更新メモ',
      content: 'これは更新されたテスト用のメモです。'
    };
    await reloadAndAssertSaved(page, 'memo', finalMemoData);
  });
});