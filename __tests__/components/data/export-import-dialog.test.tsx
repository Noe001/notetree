import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ExportImportDialog } from '@/components/data/export-import-dialog'

// モック関数の定義
const mockOnOpenChange = jest.fn()
const mockOnExport = jest.fn()
const mockOnImport = jest.fn()

describe('ExportImportDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ダイアログが閉じている場合は何も表示されない', () => {
    render(
      <ExportImportDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    expect(screen.queryByText('データのインポート/エクスポート')).not.toBeTruthy()
  })

  it('ダイアログが開いている場合は内容が表示される', () => {
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    expect(screen.getByText('データのインポート/エクスポート')).toBeInTheDocument()
    expect(screen.getByText('メモデータをJSON形式でエクスポートまたはインポートできます。')).toBeInTheDocument()
    
    // エクスポートセクション
    expect(screen.getByText('データのエクスポート')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'エクスポート' })).toBeInTheDocument()
    
    // インポートセクション
    expect(screen.getByText('データのインポート')).toBeInTheDocument()
    expect(screen.getByLabelText('JSONファイルを選択')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'インポート' })).toBeInTheDocument()
  })

  it('エクスポートボタンをクリックするとエクスポート関数が呼び出される', async () => {
    mockOnExport.mockResolvedValue(undefined)
    
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    const user = userEvent.setup()
    const exportButton = screen.getByRole('button', { name: 'エクスポート' })
    
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(mockOnExport).toHaveBeenCalled()
    })
  })

  it('ファイル選択とインポートが正常に動作する', async () => {
    const mockFile = new File(['{"memos":[]}'], 'test.json', { type: 'application/json' })
    mockOnImport.mockResolvedValue(undefined)
    
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    const user = userEvent.setup()
    const fileInput = screen.getByLabelText('JSONファイルを選択')
    const importButton = screen.getByRole('button', { name: 'インポート' })
    
    // ファイルを選択
    await user.upload(fileInput, mockFile)
    
    // インポートボタンが有効になる
    expect(importButton).toBeEnabled()
    
    // インポートボタンをクリック
    await user.click(importButton)
    
    await waitFor(() => {
      expect(mockOnImport).toHaveBeenCalledWith(mockFile)
    })
  })

  it('無効なファイルタイプの場合、エラーメッセージが表示される', async () => {
    const mockFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' })
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    const user = userEvent.setup()
    const fileInput = screen.getByLabelText('JSONファイルを選択')
    
    await user.upload(fileInput, mockFile)
    
    expect(screen.getByText('JSONファイルを選択してください')).toBeInTheDocument()
    
    consoleErrorSpy.mockRestore()
  })

  it('ファイルが選択されていない場合、インポートボタンは無効', () => {
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    const importButton = screen.getByRole('button', { name: 'インポート' })
    expect(importButton).toBeDisabled()
  })

  it('エクスポート中にローディング状態が表示される', async () => {
    let resolveExport: Function
    const exportPromise = new Promise((resolve) => {
      resolveExport = resolve
    })
    mockOnExport.mockReturnValue(exportPromise)
    
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    const user = userEvent.setup()
    const exportButton = screen.getByRole('button', { name: 'エクスポート' })
    
    await user.click(exportButton)
    
    // ローディング状態を確認
    expect(screen.getByText('エクスポート中...')).toBeInTheDocument()
    expect(exportButton).toBeDisabled()
    
    // エクスポート完了
    resolveExport(undefined)
    
    await waitFor(() => {
      expect(screen.queryByText('エクスポート中...')).not.toBeInTheDocument()
    })
  })

  it('インポート中にローディング状態が表示される', async () => {
    const mockFile = new File(['{"memos":[]}'], 'test.json', { type: 'application/json' })
    let resolveImport: Function
    const importPromise = new Promise((resolve) => {
      resolveImport = resolve
    })
    mockOnImport.mockReturnValue(importPromise)
    
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    const user = userEvent.setup()
    const fileInput = screen.getByLabelText('JSONファイルを選択')
    const importButton = screen.getByRole('button', { name: 'インポート' })
    
    await user.upload(fileInput, mockFile)
    await user.click(importButton)
    
    // ローディング状態を確認
    expect(screen.getByText('インポート中...')).toBeInTheDocument()
    expect(importButton).toBeDisabled()
    
    // インポート完了
    resolveImport(undefined)
    
    await waitFor(() => {
      expect(screen.queryByText('インポート中...')).not.toBeInTheDocument()
    })
  })

  it('エクスポートエラー時にエラーメッセージが表示される', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    mockOnExport.mockRejectedValue(new Error('Export failed'))
    
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    const user = userEvent.setup()
    const exportButton = screen.getByRole('button', { name: 'エクスポート' })
    
    await user.click(exportButton)
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('エクスポートエラー:', expect.any(Error))
    })
    
    alertSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('インポートエラー時にエラーメッセージが表示される', async () => {
    const mockFile = new File(['{"memos":[]}'], 'test.json', { type: 'application/json' })
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation()
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
    
    mockOnImport.mockRejectedValue(new Error('Import failed'))
    
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    const user = userEvent.setup()
    const fileInput = screen.getByLabelText('JSONファイルを選択')
    const importButton = screen.getByRole('button', { name: 'インポート' })
    
    await user.upload(fileInput, mockFile)
    await user.click(importButton)
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('インポートエラー:', expect.any(Error))
    })
    
    alertSpy.mockRestore()
    consoleErrorSpy.mockRestore()
  })

  it('キャンセルボタンでダイアログが閉じる', async () => {
    render(
      <ExportImportDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onExport={mockOnExport}
        onImport={mockOnImport}
      />
    )

    const user = userEvent.setup()
    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    
    await user.click(cancelButton)
    
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })
})
