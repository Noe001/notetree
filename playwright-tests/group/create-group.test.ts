import { test, expect } from '@playwright/test';
import { reloadAndAssertSaved, reloadAndAssertNotSaved, GroupData } from '../lib/test-utils';

test.describe('グループ作成機能', () => {
  test.beforeEach(async ({ page }) => {
    // テスト前にアプリケーションにアクセス
    await page.goto('http://localhost:3000');
    
    // ログイン処理（必要に応じて）
    // await page.getByRole('button', { name: 'ログイン' }).click();
    // await page.getByLabel('メールアドレス').fill('test@example.com');
    // await page.getByLabel('パスワード').fill('password');
    // await page.getByRole('button', { name: 'ログイン' }).click();
  });

  test('新しいグループを作成できること', async ({ page }) => {
    // 前提条件: ログイン済み
    
    // 実行手順:
    // 1. グループ管理セクションに移動
    await page.getByRole('button', { name: 'グループ管理' }).click();
    
    // 2. 新規グループ作成ボタンをクリック
    await page.getByRole('button', { name: '新規グループ' }).click();
    
    // 3. グループ名、説明を入力
    await page.getByLabel('グループ名 *').fill('テストグループ');
    await page.getByLabel('グループの説明').fill('これはテスト用のグループです。');
    
    // 4. グループを作成
    await page.getByRole('button', { name: '作成' }).click();
    
    // 5. リロードしてデータが保存されているか確認
    const groupData: GroupData = {
      name: 'テストグループ',
      description: 'これはテスト用のグループです。'
    };
    await reloadAndAssertSaved(page, 'group', groupData);
  });

  test('グループ名が未入力の場合、エラーメッセージが表示されること', async ({ page }) => {
    // 前提条件: ログイン済み
    
    // 実行手順:
    // 1. グループ管理セクションに移動
    await page.getByRole('button', { name: 'グループ管理' }).click();
    
    // 2. 新規グループ作成ボタンをクリック
    await page.getByRole('button', { name: '新規グループ' }).click();
    
    // 3. 説明のみを入力
    await page.getByLabel('グループの説明').fill('これはテスト用のグループです。');
    
    // 4. グループを作成（グループ名未入力）
    await page.getByRole('button', { name: '作成' }).click();
    
    // 5. リロードしてデータが保存されていないことを確認
    await reloadAndAssertNotSaved(page, 'これはテスト用のグループです。');
  });

  test('既存のグループを編集できること', async ({ page }) => {
    // 前提条件: ログイン済み、既存のグループがある
    
    // 実行手順:
    // 1. グループ管理セクションに移動
    await page.getByRole('button', { name: 'グループ管理' }).click();
    
    // 2. 既存のグループを選択（最初のグループ）
    await page.getByRole('button', { name: 'テストグループ' }).click();
    
    // 3. 編集ボタンをクリック
    await page.getByRole('button', { name: '編集' }).click();
    
    // 4. グループ名、説明を更新
    await page.getByLabel('グループ名 *').fill('更新されたテストグループ');
    await page.getByLabel('グループの説明').fill('これは更新されたテスト用のグループです。');
    
    // 5. グループを更新
    await page.getByRole('button', { name: '更新' }).click();
    
    // 6. リロードしてデータが保存されているか確認
    const updatedGroupData: GroupData = {
      name: '更新されたテストグループ',
      description: 'これは更新されたテスト用のグループです。'
    };
    await reloadAndAssertSaved(page, 'group', updatedGroupData);
  });
});