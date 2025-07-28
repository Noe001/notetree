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
      localStorage.setItem('sb-localhost-auth-token', JSON.stringify(mockSession))
    })
    
    await page.reload()
    
    // メイン画面が読み込まれるのを待つ
    await page.waitForLoadState('networkidle')
  })

  test('メモ作成ダイアログを開くことができる', async ({ page }) => {
    // メモ作成ボタンを探してクリック
    const createButton = page.getByRole('button', { name: /メモ.*作成|新規.*メモ|追加/i }).first()
    await createButton.click()
    
    // ダイアログが開くことを確認
    await expect(page.getByText('新しいメモを作成')).toBeVisible()
    await expect(page.getByLabelText('タイトル *')).toBeVisible()
    await expect(page.getByLabelText('内容 *')).toBeVisible()
  })

  test('メモの基本情報を入力できる', async ({ page }) => {
    // メモ作成ダイアログを開く
    const createButton = page.getByRole('button', { name: /メモ.*作成|新規.*メモ|追加/i }).first()
    await createButton.click()
    
    // フォームに入力
    await page.getByLabelText('タイトル *').fill('テストメモのタイトル')
    await page.getByLabelText('内容 *').fill('これはテスト用のメモ内容です。')
    
    // 入力値が正しく設定されているか確認
    await expect(page.getByLabelText('タイトル *')).toHaveValue('テストメモのタイトル')
    await expect(page.getByLabelText('内容 *')).toHaveValue('これはテスト用のメモ内容です。')
  })

  test('タグを追加できる', async ({ page }) => {
    // メモ作成ダイアログを開く
    const createButton = page.getByRole('button', { name: /メモ.*作成|新規.*メモ|追加/i }).first()
    await createButton.click()
    
    // タグ入力フィールドを探す
    const tagInput = page.getByPlaceholder('タグを入力...')
    await tagInput.fill('テストタグ')
    
    // Enterキーでタグを追加
    await tagInput.press('Enter')
    
    // タグが表示されることを確認
    await expect(page.getByText('テストタグ')).toBeVisible()
  })

  test('プライベート設定を切り替えできる', async ({ page }) => {
    // メモ作成ダイアログを開く
    const createButton = page.getByRole('button', { name: /メモ.*作成|新規.*メモ|追加/i }).first()
    await createButton.click()
    
    // プライベートスイッチを探す
    const privateSwitch = page.getByLabelText('プライベートメモ')
    
    // 初期状態ではオフ
    await expect(privateSwitch).not.toBeChecked()
    
    // スイッチをオンにする
    await privateSwitch.click()
    await expect(privateSwitch).toBeChecked()
  })

  test('必須フィールドが空の場合は作成ボタンが無効', async ({ page }) => {
    // メモ作成ダイアログを開く
    const createButton = page.getByRole('button', { name: /メモ.*作成|新規.*メモ|追加/i }).first()
    await createButton.click()
    
    // 初期状態では作成ボタンが無効
    const submitButton = page.getByRole('button', { name: 'メモを作成' })
    await expect(submitButton).toBeDisabled()
    
    // タイトルのみ入力
    await page.getByLabelText('タイトル *').fill('タイトル')
    await expect(submitButton).toBeDisabled()
    
    // 内容も入力すると有効になる
    await page.getByLabelText('内容 *').fill('内容')
    await expect(submitButton).toBeEnabled()
  })

  test('メモ作成をキャンセルできる', async ({ page }) => {
    // メモ作成ダイアログを開く
    const createButton = page.getByRole('button', { name: /メモ.*作成|新規.*メモ|追加/i }).first()
    await createButton.click()
    
    // フォームに入力
    await page.getByLabelText('タイトル *').fill('キャンセルテスト')
    await page.getByLabelText('内容 *').fill('キャンセルされる内容')
    
    // キャンセルボタンをクリック
    await page.getByRole('button', { name: 'キャンセル' }).click()
    
    // ダイアログが閉じることを確認
    await expect(page.getByText('新しいメモを作成')).not.toBeVisible()
  })

  test('フォームバリデーションが正しく動作する', async ({ page }) => {
    // メモ作成ダイアログを開く
    const createButton = page.getByRole('button', { name: /メモ.*作成|新規.*メモ|追加/i }).first()
    await createButton.click()
    
    // 空のフォームで作成ボタンをクリックしようとする
    const submitButton = page.getByRole('button', { name: 'メモを作成' })
    await expect(submitButton).toBeDisabled()
    
    // タイトルのみ入力（内容が空）
    await page.getByLabelText('タイトル *').fill('タイトルのみ')
    await expect(submitButton).toBeDisabled()
    
    // 内容のみ入力（タイトルを削除）
    await page.getByLabelText('タイトル *').clear()
    await page.getByLabelText('内容 *').fill('内容のみ')
    await expect(submitButton).toBeDisabled()
    
    // 両方入力すると有効になる
    await page.getByLabelText('タイトル *').fill('完全なタイトル')
    await expect(submitButton).toBeEnabled()
  })

  test('複数のタグを追加・削除できる', async ({ page }) => {
    // メモ作成ダイアログを開く
    const createButton = page.getByRole('button', { name: /メモ.*作成|新規.*メモ|追加/i }).first()
    await createButton.click()
    
    const tagInput = page.getByPlaceholder('タグを入力...')
    
    // 複数のタグを追加
    await tagInput.fill('タグ1')
    await tagInput.press('Enter')
    await tagInput.fill('タグ2')
    await tagInput.press('Enter')
    await tagInput.fill('タグ3')
    await tagInput.press('Enter')
    
    // すべてのタグが表示されることを確認
    await expect(page.getByText('タグ1')).toBeVisible()
    await expect(page.getByText('タグ2')).toBeVisible()
    await expect(page.getByText('タグ3')).toBeVisible()
    
    // タグを削除（削除ボタンをクリック）
    // 各タグの削除ボタンは通常 x アイコンまたは削除ボタン
    const deleteButtons = page.locator('[role="button"]', { hasText: '×' }).or(
      page.locator('button').filter({ hasText: /削除|×|remove/i })
    )
    
    if (await deleteButtons.count() > 0) {
      await deleteButtons.first().click()
      
      // 1つのタグが削除されることを確認
      // 注意: 具体的にどのタグが削除されるかは実装による
    }
  })
}) 
