import { test, expect } from '@playwright/test';

/**
 * MCPサーバーを使用したテストの実装例
 * 既存のPlaywrightテストコードを参考に、MCPサーバーの機能を使用したテスト方法を示す
 */

test.describe('MCPサーバーを使用したメモ作成機能テスト', () => {
  // MCPサーバーを使用したテストでは、ブラウザインスタンスの競合を避けるために
  // 各テストの前にブラウザを適切に管理する必要がある
  
  test.beforeEach(async ({ page }) => {
    // テスト前にアプリケーションにアクセス
    // MCPサーバーを使用する場合は、適切なURLにナビゲート
    await page.goto('http://localhost:5173'); // Playwright設定のbaseURLに合わせる
    
    // ログイン処理（必要に応じて）
    // await page.getByRole('button', { name: 'ログイン' }).click();
    // await page.getByLabel('メールアドレス').fill('test@example.com');
    // await page.getByLabel('パスワード').fill('password');
    // await page.getByRole('button', { name: 'ログイン' }).click();
  });

  test('MCPサーバーを使用したメモの新規作成テスト', async ({ page }) => {
    // 前提条件: ログイン済み
    
    // MCPサーバーを使用したテストでは、要素の特定方法に注意が必要
    // Playwrightのセレクタを使用する代わりに、MCPサーバーの適切な方法を使用
    
    // 実行手順:
    // 1. メモ作成ボタンをクリック
    await page.getByRole('button', { name: '新しいメモを作成' }).click();
    
    // 2. タイトル、内容、タグを入力
    // MCPサーバーを使用する場合は、入力操作のタイミングに注意
    await page.getByLabel('タイトル *').fill('MCPテストメモ');
    await page.getByLabel('内容 *').fill('これはMCPサーバーを使用したテスト用のメモです。');
    await page.getByPlaceholder('タグを入力...').fill('MCP, テスト');
    await page.getByRole('button', { name: '追加' }).click(); // タグ追加
    
    // 3. メモを作成
    await page.getByRole('button', { name: 'メモを作成' }).click();
    
    // 4. データが保存されているか確認
    // MCPサーバーを使用する場合は、適切な待機時間を設定
    await page.waitForTimeout(1000); // 非同期処理の待機
    
    // メモが一覧に表示されていることを確認
    await expect(page.getByText('MCPテストメモ')).toBeVisible();
  });

  test('MCPサーバーを使用したエラーハンドリングテスト', async ({ page }) => {
    // 前提条件: ログイン済み
    
    // 実行手順:
    // 1. メモ作成ボタンをクリック
    await page.getByRole('button', { name: '新しいメモを作成' }).click();
    
    // 2. 内容のみを入力（タイトル未入力）
    await page.getByLabel('内容 *').fill('これはテスト用のメモです。');
    
    // 3. メモを作成（タイトル未入力）
    await page.getByRole('button', { name: 'メモを作成' }).click();
    
    // 4. エラーメッセージが表示されることを確認
    // MCPサーバーを使用する場合は、適切な待機時間を設定
    await page.waitForTimeout(1000);
    
    // エラーメッセージが表示されることを確認
    await expect(page.getByText('タイトルは必須です')).toBeVisible();
  });
});

/**
 * MCPサーバーのブラウザ操作に関する注意点:
 * 
 * 1. ブラウザインスタンスの競合問題:
 *    - 複数のテストが同時にブラウザインスタンスを使用しようとした場合に発生
 *    - 解決方法: 各テストの前にブラウザを適切に管理するか、--isolatedオプションを使用
 * 
 * 2. 要素の特定方法:
 *    - PlaywrightのセレクタとMCPサーバーの要素特定方法の違いに注意
 *    - browser_snapshotを使用して要素を特定する方法を検討
 * 
 * 3. 非同期処理のタイミング:
 *    - ページ読み込みや要素表示のタイミングによってテストが失敗する可能性
 *    - browser_wait_forやwaitForTimeoutを使用して適切な待機時間を設定
 * 
 * 4. ページ操作:
 *    - browser_navigateやbrowser_reloadを使用してページ操作を行う
 *    - ページ遷移後の状態確認には適切な待機時間を設定
 */
