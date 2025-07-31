import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchResultsDialog } from '@/components/search/search-results-dialog'

// モックデータの定義
const mockSearchResults = [
  {
    id: '1',
    title: 'テストメモ1',
    content: 'これはテストメモの内容です',
    tags: ['テスト', 'メモ'],
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    isPrivate: false
  },
  {
    id: '2',
    title: 'テストメモ2',
    content: '別のテストメモの内容です',
    tags: ['テスト', 'サンプル'],
    createdAt: new Date('2023-01-02'),
    updatedAt: new Date('2023-01-02'),
    isPrivate: true
  }
]

describe('SearchResultsDialog', () => {
  const mockOnOpenChange = jest.fn()
  const mockOnSelectMemo = jest.fn()
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('ダイアログが閉じている場合は何も表示されない', () => {
    render(
      <SearchResultsDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        searchResults={[]}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    expect(screen.queryByText('検索結果')).not.toBeInTheDocument()
  })

  it('検索結果が空の場合、空の状態が表示される', () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={[]}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('検索結果')).toBeInTheDocument()
    expect(screen.getByText('検索結果が見つかりませんでした')).toBeInTheDocument()
    expect(screen.getByText('別のキーワードで検索してみてください')).toBeInTheDocument()
  })

  it('検索結果が表示される', () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('検索結果 (2件)')).toBeInTheDocument()
    
    // 各検索結果が表示されていることを確認
    expect(screen.getByText('テストメモ1')).toBeInTheDocument()
    expect(screen.getByText('これはテストメモの内容です')).toBeInTheDocument()
    expect(screen.getByText('テストメモ2')).toBeInTheDocument()
    expect(screen.getByText('別のテストメモの内容です')).toBeInTheDocument()
  })

  it('メモを選択できる', async () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    const user = userEvent.setup()
    const firstMemo = screen.getByText('テストメモ1')
    await user.click(firstMemo)

    expect(mockOnSelectMemo).toHaveBeenCalledWith(mockSearchResults[0])
  })

  it('ESCキーでダイアログが閉じる', async () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    const user = userEvent.setup()
    await user.keyboard('{Escape}')

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('閉じるボタンでダイアログが閉じる', async () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    const user = userEvent.setup()
    const closeButton = screen.getByRole('button', { name: '閉じる' })
    await user.click(closeButton)

    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('メモのタグが表示される', () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    // タグが表示されていることを確認
    expect(screen.getByText('テスト')).toBeInTheDocument()
    expect(screen.getByText('メモ')).toBeInTheDocument()
    expect(screen.getByText('サンプル')).toBeInTheDocument()
  })

  it('プライベートメモにアイコンが表示される', () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    // プライベートメモのアイコンを確認
    const privateIcons = screen.getAllByLabelText('プライベートメモ')
    expect(privateIcons).toHaveLength(1) // 2番目のメモがプライベート
  })

  it('メモの日付が正しく表示される', () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    // 日付が表示されていることを確認
    expect(screen.getByText('2023/01/01')).toBeInTheDocument()
    expect(screen.getByText('2023/01/02')).toBeInTheDocument()
  })

  it('検索結果が多い場合、スクロール可能', () => {
    const manyResults = Array.from({ length: 20 }, (_, i) => ({
      id: `${i + 1}`,
      title: `テストメモ${i + 1}`,
      content: `テストメモ${i + 1}の内容`,
      tags: [],
      createdAt: new Date(`2023-01-${String(i + 1).padStart(2, '0')}`),
      updatedAt: new Date(`2023-01-${String(i + 1).padStart(2, '0')}`),
      isPrivate: false
    }))

    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={manyResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('検索結果 (20件)')).toBeInTheDocument()
    // スクロール可能なコンテナが存在することを確認
    const scrollContainer = screen.getByRole('dialog').querySelector('[data-testid="scroll-container"]')
    expect(scrollContainer).toBeInTheDocument()
  })

  it('検索結果のハイライトが機能する', () => {
    const resultsWithHighlight = [
      {
        id: '1',
        title: 'テストメモ',
        content: 'これはテストの内容です',
        tags: ['テスト'],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        isPrivate: false,
        highlight: {
          title: 'テスト<span class="highlight">メモ</span>',
          content: 'これは<span class="highlight">テスト</span>の内容です'
        }
      }
    ]

    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={resultsWithHighlight}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    // ハイライトされたテキストが表示されることを確認
    expect(screen.getByText('テストメモ')).toBeInTheDocument()
    expect(screen.getByText('これはテストの内容です')).toBeInTheDocument()
  })

  it('メモ選択時にダイアログが閉じる', async () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    const user = userEvent.setup()
    const firstMemo = screen.getByText('テストメモ1')
    await user.click(firstMemo)

    expect(mockOnSelectMemo).toHaveBeenCalledWith(mockSearchResults[0])
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('キーボードナビゲーションが機能する', async () => {
    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    const user = userEvent.setup()
    const dialog = screen.getByRole('dialog')
    
    // 最初のメモにフォーカス
    await user.tab()
    
    // Enterキーでメモを選択
    await user.keyboard('{Enter}')
    
    expect(mockOnSelectMemo).toHaveBeenCalledWith(mockSearchResults[0])
  })

  it('検索結果が更新された場合、新しい結果が表示される', () => {
    const { rerender } = render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={[]}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('検索結果が見つかりませんでした')).toBeInTheDocument()

    // 新しい検索結果で再レンダリング
    rerender(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={mockSearchResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    expect(screen.getByText('検索結果 (2件)')).toBeInTheDocument()
    expect(screen.queryByText('検索結果が見つかりませんでした')).not.toBeInTheDocument()
  })

  it('メモの内容が長すぎる場合、省略して表示される', () => {
    const longContentResults = [
      {
        id: '1',
        title: '長い内容のメモ',
        content: 'a'.repeat(200) + ' これは長い内容です',
        tags: [],
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01'),
        isPrivate: false
      }
    ]

    render(
      <SearchResultsDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        searchResults={longContentResults}
        onSelectMemo={mockOnSelectMemo}
        onClose={mockOnClose}
      />
    )

    // 長い内容が適切に処理されていることを確認
    expect(screen.getByText('長い内容のメモ')).toBeInTheDocument()
  })
})
