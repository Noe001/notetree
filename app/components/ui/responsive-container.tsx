import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { useBreakpoint, type Breakpoint } from '@/lib/responsive'

interface ResponsiveContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  // 各ブレークポイントでの最大幅
  maxWidth?: Partial<Record<Breakpoint, string>>
  // パディングの設定
  padding?: Partial<Record<Breakpoint, string>>
  // マージンの設定
  margin?: Partial<Record<Breakpoint, string>>
  // センタリング
  center?: boolean
  // フルハイト
  fullHeight?: boolean
  children: React.ReactNode
}

export const ResponsiveContainer = forwardRef<HTMLDivElement, ResponsiveContainerProps>(
  ({ 
    maxWidth = { sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px' },
    padding = { xs: '1rem', sm: '1.5rem', lg: '2rem' },
    margin,
    center = true,
    fullHeight = false,
    className,
    children,
    ...props 
  }, ref) => {
    const { currentBreakpoint } = useBreakpoint()

    // 現在のブレークポイントに応じた値を取得
    const getCurrentValue = <T,>(values: Partial<Record<Breakpoint, T>>, fallback?: T): T | undefined => {
      const orderedBreakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl']
      const currentIndex = orderedBreakpoints.indexOf(currentBreakpoint)
      
      for (let i = currentIndex; i >= 0; i--) {
        const bp = orderedBreakpoints[i]
        if (values[bp] !== undefined) {
          return values[bp]
        }
      }
      
      return fallback
    }

    const currentMaxWidth = getCurrentValue(maxWidth)
    const currentPadding = getCurrentValue(padding)
    const currentMargin = getCurrentValue(margin || {});

    const containerStyles = {
      maxWidth: currentMaxWidth,
      padding: currentPadding,
      margin: currentMargin || (center ? '0 auto' : undefined),
      height: fullHeight ? '100vh' : undefined,
    }

    return (
      <div
        ref={ref}
        className={cn(
          'w-full',
          {
            'mx-auto': center && !currentMargin,
            'h-screen': fullHeight,
          },
          className
        )}
        style={containerStyles}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveContainer.displayName = 'ResponsiveContainer'

// グリッドレイアウト用のレスポンシブコンテナ
interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  // 各ブレークポイントでのカラム数
  columns?: Partial<Record<Breakpoint, number>>
  // ギャップ
  gap?: Partial<Record<Breakpoint, string>>
  children: React.ReactNode
}

export const ResponsiveGrid = forwardRef<HTMLDivElement, ResponsiveGridProps>(
  ({ 
    columns = { xs: 1, sm: 2, md: 3, lg: 4 },
    gap = { xs: '1rem', md: '1.5rem' },
    className,
    children,
    ...props 
  }, ref) => {
    const { currentBreakpoint } = useBreakpoint()

    const getCurrentValue = <T,>(values: Partial<Record<Breakpoint, T>>, fallback: T): T => {
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

    const currentColumns = getCurrentValue(columns, 1)
    const currentGap = getCurrentValue(gap, '1rem')

    const gridStyles = {
      display: 'grid',
      gridTemplateColumns: `repeat(${currentColumns}, 1fr)`,
      gap: currentGap,
    }

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        style={gridStyles}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveGrid.displayName = 'ResponsiveGrid'

// フレックスレイアウト用のレスポンシブコンテナ
interface ResponsiveFlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: Partial<Record<Breakpoint, 'row' | 'column' | 'row-reverse' | 'column-reverse'>>
  justify?: Partial<Record<Breakpoint, 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'>>
  align?: Partial<Record<Breakpoint, 'start' | 'end' | 'center' | 'stretch' | 'baseline'>>
  wrap?: Partial<Record<Breakpoint, 'nowrap' | 'wrap' | 'wrap-reverse'>>
  gap?: Partial<Record<Breakpoint, string>>
  children: React.ReactNode
}

export const ResponsiveFlex = forwardRef<HTMLDivElement, ResponsiveFlexProps>(
  ({ 
    direction = { xs: 'column', md: 'row' },
    justify = { xs: 'start' },
    align = { xs: 'stretch' },
    wrap = { xs: 'nowrap' },
    gap = { xs: '1rem' },
    className,
    children,
    ...props 
  }, ref) => {
    const { currentBreakpoint } = useBreakpoint()

    const getCurrentValue = <T,>(values: Partial<Record<Breakpoint, T>>, fallback: T): T => {
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

    const currentDirection = getCurrentValue(direction, 'row')
    const currentJustify = getCurrentValue(justify, 'start')
    const currentAlign = getCurrentValue(align, 'stretch')
    const currentWrap = getCurrentValue(wrap, 'nowrap')
    const currentGap = getCurrentValue(gap, '1rem')

    const flexStyles = {
      display: 'flex',
      flexDirection: currentDirection,
      justifyContent: currentJustify,
      alignItems: currentAlign,
      flexWrap: currentWrap,
      gap: currentGap,
    }

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        style={flexStyles}
        {...props}
      >
        {children}
      </div>
    )
  }
)

ResponsiveFlex.displayName = 'ResponsiveFlex' 
