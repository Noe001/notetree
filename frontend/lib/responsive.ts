import { useEffect, useState } from 'react'

// ブレークポイントの定義
export const breakpoints = {
  xs: 320,   // スマートフォン（小）
  sm: 640,   // スマートフォン
  md: 768,   // タブレット
  lg: 1024,  // ラップトップ
  xl: 1280,  // デスクトップ
  '2xl': 1536 // 大画面デスクトップ
} as const

export type Breakpoint = keyof typeof breakpoints

// メディアクエリのヘルパー
export const media = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  
  // 最大幅
  maxXs: `(max-width: ${breakpoints.xs - 1}px)`,
  maxSm: `(max-width: ${breakpoints.sm - 1}px)`,
  maxMd: `(max-width: ${breakpoints.md - 1}px)`,
  maxLg: `(max-width: ${breakpoints.lg - 1}px)`,
  maxXl: `(max-width: ${breakpoints.xl - 1}px)`,
  
  // 範囲指定
  smToMd: `(min-width: ${breakpoints.sm}px) and (max-width: ${breakpoints.md - 1}px)`,
  mdToLg: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  lgToXl: `(min-width: ${breakpoints.lg}px) and (max-width: ${breakpoints.xl - 1}px)`,
  
  // デバイス方向
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // 高解像度
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  
  // プリント
  print: 'print',
  
  // アクセシビリティ
  reducedMotion: '(prefers-reduced-motion: reduce)',
  darkMode: '(prefers-color-scheme: dark)',
  lightMode: '(prefers-color-scheme: light)',
  highContrast: '(prefers-contrast: high)',
}

// 現在のブレークポイントを取得するHook
export function useBreakpoint() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<Breakpoint>('sm')
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    function handleResize() {
      const width = window.innerWidth
      const height = window.innerHeight
      
      setWindowSize({ width, height })

      // 現在のブレークポイントを判定
      if (width >= breakpoints['2xl']) {
        setCurrentBreakpoint('2xl')
      } else if (width >= breakpoints.xl) {
        setCurrentBreakpoint('xl')
      } else if (width >= breakpoints.lg) {
        setCurrentBreakpoint('lg')
      } else if (width >= breakpoints.md) {
        setCurrentBreakpoint('md')
      } else if (width >= breakpoints.sm) {
        setCurrentBreakpoint('sm')
      } else {
        setCurrentBreakpoint('xs')
      }
    }

    // 初回実行
    handleResize()

    // リサイズイベントリスナーを登録
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return {
    currentBreakpoint,
    windowSize,
    isMobile: currentBreakpoint === 'xs' || currentBreakpoint === 'sm',
    isTablet: currentBreakpoint === 'md',
    isDesktop: currentBreakpoint === 'lg' || currentBreakpoint === 'xl' || currentBreakpoint === '2xl',
    isSmallScreen: currentBreakpoint === 'xs' || currentBreakpoint === 'sm' || currentBreakpoint === 'md',
    isLargeScreen: currentBreakpoint === 'lg' || currentBreakpoint === 'xl' || currentBreakpoint === '2xl'
  }
}

// メディアクエリをJavaScriptで使用するためのHook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

// 複数のメディアクエリを監視するHook
export function useMediaQueries(queries: Record<string, string>) {
  const [matches, setMatches] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const mediaQueries: Record<string, MediaQueryList> = {}
    const handlers: Record<string, (event: MediaQueryListEvent) => void> = {}

    // 初期値を設定
    const initialMatches: Record<string, boolean> = {}
    
    Object.entries(queries).forEach(([key, query]) => {
      const mediaQuery = window.matchMedia(query)
      mediaQueries[key] = mediaQuery
      initialMatches[key] = mediaQuery.matches

      handlers[key] = (event: MediaQueryListEvent) => {
        setMatches(prev => ({
          ...prev,
          [key]: event.matches
        }))
      }

      mediaQuery.addEventListener('change', handlers[key])
    })

    setMatches(initialMatches)

    return () => {
      Object.entries(handlers).forEach(([key, handler]) => {
        mediaQueries[key].removeEventListener('change', handler)
      })
    }
  }, [queries])

  return matches
}

// デバイスタイプの判定
export function useDeviceType() {
  const { currentBreakpoint } = useBreakpoint()
  const isTouch = useMediaQuery('(hover: none) and (pointer: coarse)')
  const isPortrait = useMediaQuery(media.portrait)

  return {
    type: currentBreakpoint === 'xs' || currentBreakpoint === 'sm' 
      ? (isPortrait ? 'mobile' : 'mobile-landscape')
      : currentBreakpoint === 'md' 
      ? 'tablet' 
      : 'desktop',
    isTouch,
    isPortrait,
    isLandscape: !isPortrait
  }
}

// レスポンシブ値を取得するユーティリティ
export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  currentBreakpoint: Breakpoint,
  fallback: T
): T {
  // 現在のブレークポイント以下で最も大きいブレークポイントの値を取得
  const orderedBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
  const currentIndex = orderedBreakpoints.indexOf(currentBreakpoint)
  
  for (let i = currentIndex; i >= 0; i--) {
    const bp = orderedBreakpoints[i]
    if (values[bp] !== undefined) {
      return values[bp]!
    }
  }
  
  return fallback
}

// レスポンシブ値を使用するHook
export function useResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  fallback: T
): T {
  const { currentBreakpoint } = useBreakpoint()
  return getResponsiveValue(values, currentBreakpoint, fallback)
}

// アクセシビリティ設定の検出
export function useAccessibilityPreferences() {
  const prefersReducedMotion = useMediaQuery(media.reducedMotion)
  const prefersDarkMode = useMediaQuery(media.darkMode)
  const prefersHighContrast = useMediaQuery(media.highContrast)

  return {
    prefersReducedMotion,
    prefersDarkMode,
    prefersHighContrast
  }
}

// フォーカス管理のユーティリティ
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>

  const firstElement = focusableElements[0]
  const lastElement = focusableElements[focusableElements.length - 1]

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }
  }

  element.addEventListener('keydown', handleKeyDown)

  return () => {
    element.removeEventListener('keydown', handleKeyDown)
  }
}

// キーボードナビゲーション支援
export function useKeyboardNavigation(
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void,
  onEnter?: () => void,
  onEscape?: () => void
) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      switch (e.key) {
        case 'ArrowUp':
          onArrowUp?.()
          break
        case 'ArrowDown':
          onArrowDown?.()
          break
        case 'ArrowLeft':
          onArrowLeft?.()
          break
        case 'ArrowRight':
          onArrowRight?.()
          break
        case 'Enter':
          onEnter?.()
          break
        case 'Escape':
          onEscape?.()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onEnter, onEscape])
}

// 画面読み上げ対応のためのライブリージョン
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'
  announcement.textContent = message

  document.body.appendChild(announcement)

  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

// スクリーンリーダー専用クラス
export const srOnlyClass = 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0 clip-rect(0, 0, 0, 0)' 
