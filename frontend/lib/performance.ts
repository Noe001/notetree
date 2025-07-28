import { useCallback, useEffect, useRef, useState } from 'react'

// デバウンス関数
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// スロットル関数
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

// React Hooks for Performance

// デバウンスHook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// スロットルHook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const throttledCallback = useCallback(
    throttle(callback, delay),
    [callback, delay]
  )

  return throttledCallback as T
}

// 遅延ローディングHook
export function useLazyLoad(threshold: number = 100) {
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    )

    if (elementRef.current) {
      observer.observe(elementRef.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { isVisible, elementRef }
}

// 画像遅延読み込みHook
export function useLazyImage(src: string, placeholder?: string) {
  const [imageSrc, setImageSrc] = useState(placeholder || '')
  const [isLoaded, setIsLoaded] = useState(false)
  const { isVisible, elementRef } = useLazyLoad()

  useEffect(() => {
    if (isVisible && src) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
        setIsLoaded(true)
      }
      img.src = src
    }
  }, [isVisible, src])

  return { imageSrc, isLoaded, elementRef }
}

// メモリ使用量監視Hook
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number
    totalJSHeapSize?: number
    jsHeapSizeLimit?: number
  }>({})

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        })
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000) // 5秒間隔

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}

// キャッシュ管理クラス
export class MemoryCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; accessCount: number }>()
  private maxSize: number
  private ttl: number // Time to live in milliseconds

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  set(key: K, value: V): void {
    // 期限切れのアイテムを削除
    this.cleanup()

    // キャッシュサイズが上限に達した場合、最も古いアイテムを削除
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.findOldestKey()
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey)
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
    })
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key)
    if (!item) return undefined

    // 期限切れチェック
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key)
      return undefined
    }

    // アクセス回数を増やす
    item.accessCount++
    return item.value
  }

  has(key: K): boolean {
    return this.get(key) !== undefined
  }

  delete(key: K): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    this.cleanup()
    return this.cache.size
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key)
      }
    }
  }

  private findOldestKey(): K | undefined {
    let oldestKey: K | undefined
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }
}

// グローバルキャッシュインスタンス
export const globalCache = new MemoryCache<string, any>(200, 10 * 60 * 1000) // 10分TTL

// リクエスト重複排除
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>()

  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // 既に同じリクエストが実行中の場合は、そのPromiseを返す
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!
    }

    // 新しいリクエストを実行
    const promise = requestFn()
      .finally(() => {
        // 完了後に削除
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, promise)
    return promise
  }

  clear(): void {
    this.pendingRequests.clear()
  }
}

export const globalRequestDeduplicator = new RequestDeduplicator()

// 画像最適化ユーティリティ
export function optimizeImage(
  src: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  } = {}
): string {
  // 実際の実装では、画像処理サービス（Cloudinary、ImageKitなど）を使用
  // ここではサンプル実装
  const { width, height, quality = 80, format = 'webp' } = options
  
  const params = new URLSearchParams()
  if (width) params.append('w', width.toString())
  if (height) params.append('h', height.toString())
  params.append('q', quality.toString())
  params.append('f', format)

  return `${src}?${params.toString()}`
}

// パフォーマンス計測ユーティリティ
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private marks = new Map<string, number>()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  startMeasure(name: string): void {
    this.marks.set(name, performance.now())
  }

  endMeasure(name: string): number {
    const startTime = this.marks.get(name)
    if (startTime === undefined) {
      console.warn(`No start mark found for: ${name}`)
      return 0
    }

    const duration = performance.now() - startTime
    this.marks.delete(name)
    
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`)
    return duration
  }

  measureFunction<T extends (...args: any[]) => any>(
    name: string,
    fn: T
  ): T {
    return ((...args: any[]) => {
      this.startMeasure(name)
      const result = fn(...args)
      
      if (result instanceof Promise) {
        return result.finally(() => {
          this.endMeasure(name)
        })
      } else {
        this.endMeasure(name)
        return result
      }
    }) as T
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance() 
