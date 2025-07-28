import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用のSupabaseプロジェクトかローカル環境を想定
    await page.goto('/')
  })

  test('ログインダイアログが表示される', async ({ page }) => {
    // 未認証の場合、ログインダイアログが表示される
    await expect(page.getByText('Notetreeにログイン')).toBeVisible()
    await expect(page.getByText('Googleアカウントでログインして、メモの作成と共有を始めましょう。')).toBeVisible()
    await expect(page.getByRole('button', { name: /googleでログイン/i })).toBeVisible()
  })

  test('利用規約とプライバシーポリシーのテキストが表示される', async ({ page }) => {
    await expect(page.getByText(/ログインすることで、利用規約とプライバシーポリシーに同意したことになります/)).toBeVisible()
  })

  test('Googleログインボタンがクリック可能', async ({ page }) => {
    const googleButton = page.getByRole('button', { name: /googleでログイン/i })
    await expect(googleButton).toBeEnabled()
    
    // ボタンをクリックしてもエラーにならないことを確認
    // 実際のOAuth認証はテスト環境では行わない
    await googleButton.click()
  })

  test('ログインフォームのUI要素が正しく表示される', async ({ page }) => {
    // ダイアログのタイトル
    await expect(page.getByRole('heading', { name: 'Notetreeにログイン' })).toBeVisible()
    
    // Googleログインボタンのアイコンとテキスト
    const googleButton = page.getByRole('button', { name: /googleでログイン/i })
    await expect(googleButton).toBeVisible()
    
    // ローディング状態でないことを確認
    await expect(page.getByText('ログイン中...')).not.toBeVisible()
  })
})

// 認証後の状態をテストする場合（モックを使用）
test.describe('Authenticated State', () => {
  test('認証済みユーザーはメイン画面が表示される', async ({ page }) => {
    // テスト用の認証セッションを設定
    await page.goto('/')
    
    // LocalStorageに仮の認証情報を設定
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
      localStorage.setItem('sb-localhost-auth-token', JSON.stringify(mockSession))
    })
    
    await page.reload()
    
    // メイン画面の要素が表示されることを確認
    // ここでは一般的なメモアプリの要素をチェック
    await expect(page.getByText('メモ')).toBeVisible({ timeout: 10000 })
  })
}) 
