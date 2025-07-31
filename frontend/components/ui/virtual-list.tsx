import React, { useState, useEffect, useRef, useMemo } from 'react'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  onScroll?: (scrollTop: number) => void
  overscan?: number // 表示範囲外のアイテム数
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  onScroll,
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 表示するアイテムの範囲を計算
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return { startIndex, endIndex }
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan])

  // 表示するアイテムを抽出
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1)
  }, [items, visibleRange])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop
    setScrollTop(newScrollTop)
    onScroll?.(newScrollTop)
  }

  const totalHeight = items.length * itemHeight
  const offsetY = visibleRange.startIndex * itemHeight

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div
              key={visibleRange.startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, visibleRange.startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// メモリスト専用の仮想リストコンポーネント
interface VirtualMemoListProps<T> {
  memos: T[]
  containerHeight: number
  renderMemo: (memo: T, index: number) => React.ReactNode
  className?: string
  searchQuery?: string
  onScroll?: (scrollTop: number) => void
}

export function VirtualMemoList<T>({
  memos,
  containerHeight,
  renderMemo,
  className = '',
  searchQuery = '',
  onScroll
}: VirtualMemoListProps<T>) {
  // 動的な高さ計算（検索ハイライトなどで高さが変わる可能性）
  const getItemHeight = (index: number) => {
    // 基本高さ
    let height = 80
    
    // 検索クエリがある場合は追加の高さ
    if (searchQuery) {
      height += 20
    }
    
    return height
  }

  const averageItemHeight = useMemo(() => {
    if (memos.length === 0) return 80
    
    let totalHeight = 0
    for (let i = 0; i < Math.min(memos.length, 10); i++) {
      totalHeight += getItemHeight(i)
    }
    
    return totalHeight / Math.min(memos.length, 10)
  }, [memos.length, searchQuery])

  return (
    <VirtualList
      items={memos}
      itemHeight={averageItemHeight}
      containerHeight={containerHeight}
      renderItem={renderMemo}
      className={className}
      onScroll={onScroll}
      overscan={3}
    />
  )
}

// インフィニットスクロールコンポーネント
interface InfiniteScrollProps<T> {
  items: T[]
  loadMore: () => Promise<void>
  hasMore: boolean
  loading: boolean
  renderItem: (item: T, index: number) => React.ReactNode
  containerHeight: number
  itemHeight: number
  className?: string
  threshold?: number // ロード開始の閾値（px）
}

export function InfiniteScroll<T>({
  items,
  loadMore,
  hasMore,
  loading,
  renderItem,
  containerHeight,
  itemHeight,
  className = '',
  threshold = 200
}: InfiniteScrollProps<T>) {
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const handleScroll = async (scrollTop: number) => {
    const containerElement = document.querySelector('.virtual-list-container')
    if (!containerElement || isLoadingMore || !hasMore) return

    const { scrollHeight, clientHeight } = containerElement
    const scrollBottom = scrollHeight - scrollTop - clientHeight

    if (scrollBottom < threshold) {
      setIsLoadingMore(true)
      try {
        await loadMore()
      } catch (error) {
        console.error('Failed to load more items:', error)
      } finally {
        setIsLoadingMore(false)
      }
    }
  }

  const allItems = useMemo(() => {
    const result = [...items]
    
    // ローディング中の場合は、プレースホルダーを追加
    if (loading || isLoadingMore) {
      for (let i = 0; i < 3; i++) {
        result.push(null as any) // プレースホルダー
      }
    }
    
    return result
  }, [items, loading, isLoadingMore])

  const renderItemWithLoading = (item: T | null, index: number) => {
    if (item === null) {
      // ローディングプレースホルダー
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      )
    }
    
    return renderItem(item, index)
  }

  return (
    <VirtualList
      items={allItems}
      itemHeight={itemHeight}
      containerHeight={containerHeight}
      renderItem={renderItemWithLoading}
      className={`virtual-list-container ${className}`}
      onScroll={handleScroll}
    />
  )
} 
