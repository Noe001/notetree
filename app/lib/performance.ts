import { useCallback, useEffect, useRef, useState } from 'react'

// デバウンス関数
export function debounce<T extends (...args: unknown[]) => unknown>(
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
export function throttle<T extends (...args: unknown[]) => unknown>(
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
export function useThrottle<T extends (...args: unknown[]) => unknown>(
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
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
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
export const globalCache = new MemoryCache<string, unknown>(200, 10 * 60 * 1000) // 10分TTL

// リクエスト重複排除
export class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<unknown>>()

  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // 既に同じリクエストが実行中の場合は、そのPromiseを返す
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)! as Promise<T>
    }

    // 新しいリクエストを実行
    const promise = requestFn()
      .finally(() => {
        // 完了後に削除
        this.pendingRequests.delete(key)
      })

    this.pendingRequests.set(key, promise as Promise<unknown>)
    return promise as Promise<T>
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

/**
 * 本番環境でのパフォーマンス監視とエラーハンドリング
 */

export interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  memoryUsage?: number;
  errorCount: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    pageLoadTime: 0,
    apiResponseTime: 0,
    errorCount: 0
  };

  private startTime: number = 0;

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // ページロード時間の測定
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.metrics.pageLoadTime = performance.now();
        this.logMetric('pageLoad', this.metrics.pageLoadTime);
      });

      // エラーの監視
      window.addEventListener('error', (event) => {
        this.metrics.errorCount++;
        this.logError('JavaScript Error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.stack
        });
      });

      // 未処理のPromise拒否の監視
      window.addEventListener('unhandledrejection', (event) => {
        this.metrics.errorCount++;
        this.logError('Unhandled Promise Rejection', {
          reason: event.reason
        });
      });
    }
  }

  startApiTimer() {
    this.startTime = performance.now();
  }

  endApiTimer() {
    if (this.startTime > 0) {
      const responseTime = performance.now() - this.startTime;
      this.metrics.apiResponseTime = responseTime;
      this.logMetric('apiResponse', responseTime);
      this.startTime = 0;
    }
  }

  private logMetric(type: string, value: number) {
    if (process.env.NODE_ENV === 'production') {
      // 本番環境では外部の監視サービスに送信
      console.log(`[Performance] ${type}: ${value.toFixed(2)}ms`);
      
      // 実際の本番環境では、AnalyticsやMonitoringサービスに送信
      // this.sendToAnalytics(type, value);
    } else {
      console.log(`[Performance] ${type}: ${value.toFixed(2)}ms`);
    }
  }

  logError(type: string, details: unknown) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`[Error] ${type}:`, details);
      
      // 実際の本番環境では、Error Trackingサービスに送信
      // this.sendToErrorTracking(type, details);
    } else {
      console.error(`[Error] ${type}:`, details);
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      pageLoadTime: 0,
      apiResponseTime: 0,
      errorCount: 0
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * API呼び出しのパフォーマンス監視用のラッパー
 */
export function withPerformanceMonitoring<T>(
  apiCall: () => Promise<T>,
  operationName: string = 'API Call'
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    performanceMonitor.startApiTimer();
    
    try {
      const result = await apiCall();
      performanceMonitor.endApiTimer();
      resolve(result);
    } catch (error) {
      performanceMonitor.endApiTimer();
      performanceMonitor.logError(operationName, error);
      reject(error);
    }
  });
}

/**
 * 本番環境でのエラーバウンダリー用のユーティリティ
 */
export function createErrorBoundary() {
  return {
    onError: (error: Error, errorInfo: unknown) => {
      if (process.env.NODE_ENV === 'production') {
        console.error('React Error Boundary caught an error:', error, errorInfo);
        // 実際の本番環境では、Error Trackingサービスに送信
        // this.sendToErrorTracking('React Error', { error, errorInfo });
      } else {
        console.error('React Error Boundary caught an error:', error, errorInfo);
      }
    }
  };
}

/**
 * 本番環境でのメモリ使用量監視
 */
export function monitorMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    };
  }
  return null;
}

/**
 * 本番環境でのネットワーク状態監視
 */
export function monitorNetworkStatus() {
  if (typeof navigator !== 'undefined' && 'connection' in navigator) {
    const connection = (navigator as unknown as { connection: { effectiveType: string; downlink: number; rtt: number; saveData: boolean } }).connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
} 
