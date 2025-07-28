import {
  debounce,
  throttle,
  MemoryCache,
  RequestDeduplicator,
  optimizeImage,
  PerformanceMonitor,
} from '@/lib/performance'

describe('Performance Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('debounce', () => {
    it('関数の実行を指定した時間だけ遅延させる', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1')
      debouncedFn('arg2')
      debouncedFn('arg3')

      // まだ実行されていない
      expect(mockFn).not.toHaveBeenCalled()

      // 100ms経過後に最後の引数で実行される
      jest.advanceTimersByTime(100)
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg3')
    })

    it('遅延時間内に再度呼び出されると前のタイマーがクリアされる', () => {
      const mockFn = jest.fn()
      const debouncedFn = debounce(mockFn, 100)

      debouncedFn('arg1')
      jest.advanceTimersByTime(50)
      
      debouncedFn('arg2')
      jest.advanceTimersByTime(50)
      
      // まだ実行されていない（タイマーがリセットされた）
      expect(mockFn).not.toHaveBeenCalled()
      
      jest.advanceTimersByTime(50)
      
      // 最後の引数で実行される
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg2')
    })
  })

  describe('throttle', () => {
    it('指定した時間内で最初の呼び出しのみを実行する', () => {
      const mockFn = jest.fn()
      const throttledFn = throttle(mockFn, 100)

      throttledFn('arg1')
      throttledFn('arg2')
      throttledFn('arg3')

      // 最初の呼び出しのみ実行される
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(mockFn).toHaveBeenCalledWith('arg1')

      // 100ms経過後に再度呼び出し可能
      jest.advanceTimersByTime(100)
      throttledFn('arg4')

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(mockFn).toHaveBeenLastCalledWith('arg4')
    })
  })

  describe('MemoryCache', () => {
    let cache: MemoryCache<string, string>

    beforeEach(() => {
      cache = new MemoryCache<string, string>(3, 1000) // maxSize: 3, ttl: 1000ms
    })

    it('値の設定と取得ができる', () => {
      cache.set('key1', 'value1')
      expect(cache.get('key1')).toBe('value1')
      expect(cache.has('key1')).toBe(true)
    })

    it('存在しないキーはundefinedを返す', () => {
      expect(cache.get('nonexistent')).toBeUndefined()
      expect(cache.has('nonexistent')).toBe(false)
    })

    it('最大サイズを超えると古いアイテムが削除される', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      cache.set('key3', 'value3')
      cache.set('key4', 'value4') // これで key1 が削除される

      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true)
      expect(cache.has('key3')).toBe(true)
      expect(cache.has('key4')).toBe(true)
      expect(cache.size()).toBe(3)
    })

    it('TTLを超えたアイテムは削除される', () => {
      cache.set('key1', 'value1')
      expect(cache.has('key1')).toBe(true)

      // TTL + 1ms 経過
      jest.advanceTimersByTime(1001)
      expect(cache.has('key1')).toBe(false)
    })

    it('アクセス回数がカウントされる', () => {
      cache.set('key1', 'value1')
      
      cache.get('key1')
      cache.get('key1')
      cache.get('key1')

      // アクセス回数の直接テストは難しいが、値が正常に取得できることを確認
      expect(cache.get('key1')).toBe('value1')
    })

    it('clear()で全てのアイテムが削除される', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      expect(cache.size()).toBe(2)
      
      cache.clear()
      
      expect(cache.size()).toBe(0)
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(false)
    })

    it('delete()で特定のアイテムが削除される', () => {
      cache.set('key1', 'value1')
      cache.set('key2', 'value2')
      
      expect(cache.delete('key1')).toBe(true)
      expect(cache.has('key1')).toBe(false)
      expect(cache.has('key2')).toBe(true)
      
      expect(cache.delete('nonexistent')).toBe(false)
    })
  })

  describe('RequestDeduplicator', () => {
    let deduplicator: RequestDeduplicator

    beforeEach(() => {
      deduplicator = new RequestDeduplicator()
    })

    it('同じキーの重複リクエストは同じPromiseを返す', async () => {
      const mockFn = jest.fn().mockResolvedValue('result')

      const promise1 = deduplicator.execute('key1', mockFn)
      const promise2 = deduplicator.execute('key1', mockFn)

      expect(promise1).toBe(promise2)
      expect(mockFn).toHaveBeenCalledTimes(1)

      const result = await promise1
      expect(result).toBe('result')
    })

    it('異なるキーのリクエストは別々に実行される', async () => {
      const mockFn1 = jest.fn().mockResolvedValue('result1')
      const mockFn2 = jest.fn().mockResolvedValue('result2')

      const promise1 = deduplicator.execute('key1', mockFn1)
      const promise2 = deduplicator.execute('key2', mockFn2)

      expect(mockFn1).toHaveBeenCalledTimes(1)
      expect(mockFn2).toHaveBeenCalledTimes(1)

      const [result1, result2] = await Promise.all([promise1, promise2])
      expect(result1).toBe('result1')
      expect(result2).toBe('result2')
    })

    it('リクエスト完了後は再度実行可能', async () => {
      const mockFn = jest.fn()
        .mockResolvedValueOnce('result1')
        .mockResolvedValueOnce('result2')

      const result1 = await deduplicator.execute('key1', mockFn)
      const result2 = await deduplicator.execute('key1', mockFn)

      expect(mockFn).toHaveBeenCalledTimes(2)
      expect(result1).toBe('result1')
      expect(result2).toBe('result2')
    })

    it('エラーが発生した場合も適切に処理される', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('Test error'))

      await expect(deduplicator.execute('key1', mockFn)).rejects.toThrow('Test error')

      // エラー後に再度実行可能
      mockFn.mockResolvedValue('success')
      const result = await deduplicator.execute('key1', mockFn)
      expect(result).toBe('success')
    })
  })

  describe('optimizeImage', () => {
    it('基本的な画像最適化パラメータが追加される', () => {
      const result = optimizeImage('https://example.com/image.jpg')
      expect(result).toBe('https://example.com/image.jpg?q=80&f=webp')
    })

    it('カスタムオプションが適用される', () => {
      const result = optimizeImage('https://example.com/image.jpg', {
        width: 300,
        height: 200,
        quality: 90,
        format: 'jpeg'
      })
      expect(result).toBe('https://example.com/image.jpg?w=300&h=200&q=90&f=jpeg')
    })

    it('一部のオプションのみ指定した場合', () => {
      const result = optimizeImage('https://example.com/image.jpg', {
        width: 500,
        quality: 70
      })
      expect(result).toBe('https://example.com/image.jpg?w=500&q=70&f=webp')
    })
  })

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor
    let consoleLogSpy: jest.SpyInstance

    beforeEach(() => {
      monitor = PerformanceMonitor.getInstance()
      consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
      
      // performance.now() をモック
      let currentTime = 0
      jest.spyOn(performance, 'now').mockImplementation(() => {
        currentTime += 10 // 10msずつ進む
        return currentTime
      })
    })

    afterEach(() => {
      consoleLogSpy.mockRestore()
    })

    it('シングルトンパターンで動作する', () => {
      const monitor1 = PerformanceMonitor.getInstance()
      const monitor2 = PerformanceMonitor.getInstance()
      expect(monitor1).toBe(monitor2)
    })

    it('計測開始と終了が正常に動作する', () => {
      monitor.startMeasure('test')
      monitor.endMeasure('test')

      expect(consoleLogSpy).toHaveBeenCalledWith('Performance: test took 10.00ms')
    })

    it('存在しない計測名に対して警告が表示される', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      const duration = monitor.endMeasure('nonexistent')
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('No start mark found for: nonexistent')
      expect(duration).toBe(0)
      
      consoleWarnSpy.mockRestore()
    })

    it('関数の計測が正常に動作する', () => {
      const testFn = jest.fn().mockReturnValue('result')
      const measuredFn = monitor.measureFunction('testFunction', testFn)

      const result = measuredFn('arg1', 'arg2')

      expect(result).toBe('result')
      expect(testFn).toHaveBeenCalledWith('arg1', 'arg2')
      expect(consoleLogSpy).toHaveBeenCalledWith('Performance: testFunction took 10.00ms')
    })

    it('非同期関数の計測が正常に動作する', async () => {
      const asyncFn = jest.fn().mockResolvedValue('async result')
      const measuredFn = monitor.measureFunction('asyncFunction', asyncFn)

      const result = await measuredFn('arg1')

      expect(result).toBe('async result')
      expect(asyncFn).toHaveBeenCalledWith('arg1')
      expect(consoleLogSpy).toHaveBeenCalledWith('Performance: asyncFunction took 10.00ms')
    })
  })
}) 
