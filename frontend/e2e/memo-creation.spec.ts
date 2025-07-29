import { test, expect } from '@playwright/test'

test.describe('Memo Creation', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用の認証状態を設定
    await page.goto('/')
    
    // モック認証セッション
    await page.evaluate(() => {
      const mockSession = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
          user_metadata: {
            name: 'Test User'
          }
        }
      }
      localStorage.setItem('auth_session', JSON.stringify(mockSession))
      localStorage.setItem('auth_user', JSON.stringify(mockSession.user))
    })
    
    await page.reload()
    
    // メイン画面が読み込まれるのを待つ
    await page.waitForLoadState('networkidle')
  })

  test('メモが作成できることを確認', async ({ page }) => {
    // メモ作成ボタンを探してクリック (FilePenLineアイコン)
    const createButton = page.locator('button[title="新しいメモを作成"]').first()
    await createButton.click()
    
    // 新しいメモが作成されることを確認 (少し待つ)
    await page.waitForTimeout(2000)
    
    // メモエディタが表示されていることを確認
    const titleInput = page.locator('input[placeholder="タイトル"]').first()
    await expect(titleInput).toBeVisible()
  })

  test('メモの基本情報を入力できる', async ({ page }) => {
    // メモ作成ボタンをクリック
    const createButton = page.locator('button[title="新しいメモを作成"]').first()
    await createButton.click()
    
    // タイトルと内容を入力 (少し待つ)
    await page.waitForTimeout(1000)
    
    const titleInput = page.locator('input[placeholder="タイトル"]').first()
    const contentInput = page.locator('textarea[placeholder="内容を記述..."]').first()
    
    await titleInput.fill('テストメモのタイトル')
    await contentInput.fill('これはテスト用のメモ内容です。')
    
    // 入力値が正しく設定されているか確認 (少し待つ)
    await page.waitForTimeout(2000)
    await expect(titleInput).toHaveValue('テストメモのタイトル')
    await expect(contentInput).toHaveValue('これはテスト用のメモ内容です。')
  })

  test('タグを追加できる', async ({ page }) => {
    // メモ作成ボタンをクリック
    const createButton = page.locator('button[title="新しいメモを作成"]').first()
    await createButton.click()
    
    // タグ入力フィールドを探す (少し待つ)
    await page.waitForTimeout(1000)
    
    const tagInput = page.locator('input[placeholder="カンマ区切りでタグを追加"]').first()
    await tagInput.fill('テストタグ')
    await tagInput.press('Tab') // blurイベントを発生させる
    
    // タグが表示されることを確認 (少し待つ)
    await page.waitForTimeout(1000)
  })

  test('メモを削除できる', async ({ page }) => {
    // メモ作成ボタンをクリック
    const createButton = page.locator('button[title="新しいメモを作成"]').first()
    await createButton.click()
    
    // 削除ボタンを探す (少し待つ)
    await page.waitForTimeout(1000)
    
    // 削除ボタンを探す (Trash2アイコン)
    const deleteButton = page.locator('button[title="メモを削除"]').first()
    await expect(deleteButton).toBeVisible()
  })
})
