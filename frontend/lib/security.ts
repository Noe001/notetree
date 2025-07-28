import DOMPurify from 'isomorphic-dompurify'

// XSS対策: HTMLサニタイズ
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    ALLOWED_ATTR: ['class'],
  })
}

// 入力値検証関数群
export const validators = {
  // メールアドレス検証
  email: (email: string): { valid: boolean; error?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      return { valid: false, error: 'メールアドレスは必須です' }
    }
    if (!emailRegex.test(email)) {
      return { valid: false, error: '有効なメールアドレスを入力してください' }
    }
    if (email.length > 254) {
      return { valid: false, error: 'メールアドレスが長すぎます' }
    }
    return { valid: true }
  },

  // テキスト長制限
  textLength: (text: string, min: number = 0, max: number = 1000): { valid: boolean; error?: string } => {
    const length = text.trim().length
    if (length < min) {
      return { valid: false, error: `${min}文字以上入力してください` }
    }
    if (length > max) {
      return { valid: false, error: `${max}文字以内で入力してください` }
    }
    return { valid: true }
  },

  // タグ検証
  tag: (tag: string): { valid: boolean; error?: string } => {
    const trimmed = tag.trim()
    if (!trimmed) {
      return { valid: false, error: 'タグが空です' }
    }
    if (trimmed.length > 50) {
      return { valid: false, error: 'タグは50文字以内で入力してください' }
    }
    if (!/^[a-zA-Z0-9ぁ-んァ-ヶー一-龯\-_\s]+$/.test(trimmed)) {
      return { valid: false, error: 'タグに使用できない文字が含まれています' }
    }
    return { valid: true }
  },

  // SQL/NoSQLインジェクション対策
  noInjection: (input: string): { valid: boolean; error?: string } => {
    const suspiciousPatterns = [
      /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
      /(\$where|\$regex|\$or|\$and|\$not)/i,
      /(javascript:|data:text\/html|vbscript:|on\w+\s*=)/i,
      /(<script|<\/script>|<iframe|<\/iframe>)/i,
    ]

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(input)) {
        return { valid: false, error: '不正な文字列が検出されました' }
      }
    }
    return { valid: true }
  },

  // ファイル名検証
  fileName: (fileName: string): { valid: boolean; error?: string } => {
    if (!fileName.trim()) {
      return { valid: false, error: 'ファイル名は必須です' }
    }
    if (fileName.length > 255) {
      return { valid: false, error: 'ファイル名が長すぎます' }
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(fileName)) {
      return { valid: false, error: 'ファイル名に使用できない文字が含まれています' }
    }
    return { valid: true }
  }
}

// レート制限のためのクラス
export class RateLimiter {
  private requests: Map<string, number[]> = new Map()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests: number = 10, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs

    // 既存のリクエスト記録を取得
    let requestTimes = this.requests.get(identifier) || []

    // 時間窓外のリクエストを削除
    requestTimes = requestTimes.filter(time => time > windowStart)

    // 制限を超えているかチェック
    if (requestTimes.length >= this.maxRequests) {
      return false
    }

    // 新しいリクエストを記録
    requestTimes.push(now)
    this.requests.set(identifier, requestTimes)

    return true
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now()
    const windowStart = now - this.windowMs
    const requestTimes = this.requests.get(identifier) || []
    const validRequests = requestTimes.filter(time => time > windowStart)
    
    return Math.max(0, this.maxRequests - validRequests.length)
  }

  getResetTime(identifier: string): number {
    const requestTimes = this.requests.get(identifier) || []
    if (requestTimes.length === 0) return 0
    
    const oldestRequest = Math.min(...requestTimes)
    return oldestRequest + this.windowMs
  }
}

// CSRF対策用のトークン生成
export function generateCSRFToken(): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // フォールバック（Node.js環境など）
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15)
}

// セキュアなランダム文字列生成
export function generateSecureId(length: number = 16): string {
  if (typeof window !== 'undefined' && window.crypto) {
    const array = new Uint8Array(length)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // フォールバック
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// URL検証
export function validateURL(url: string): { valid: boolean; error?: string } {
  try {
    const parsedURL = new URL(url)
    
    // HTTPSのみ許可
    if (parsedURL.protocol !== 'https:') {
      return { valid: false, error: 'HTTPSのURLのみ許可されています' }
    }
    
    // ローカルホストや内部IPアドレスを拒否
    const hostname = parsedURL.hostname
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    ) {
      return { valid: false, error: '内部ネットワークのURLは許可されていません' }
    }
    
    return { valid: true }
  } catch (error) {
    return { valid: false, error: '無効なURLです' }
  }
}

// コンテンツセキュリティポリシー設定
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://accounts.google.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com'],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'", 'https://api.supabase.com', 'wss://realtime.supabase.com'],
  'frame-src': ['https://accounts.google.com'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
}

export function generateCSPHeader(): string {
  return Object.entries(CSP_POLICY)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive
      }
      return `${directive} ${sources.join(' ')}`
    })
    .join('; ')
}

// セキュリティヘッダー設定
export const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
}

// XSSフィルター
export function filterXSS(input: string): string {
  return input
    .replace(/[<>]/g, '') // HTMLタグを削除
    .replace(/javascript:/gi, '') // JavaScript URIを削除
    .replace(/on\w+\s*=/gi, '') // イベントハンドラーを削除
    .trim()
}

// パスワード強度チェック
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
  isValid: boolean
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) {
    score += 1
  } else {
    feedback.push('8文字以上にしてください')
  }

  if (/[a-z]/.test(password)) {
    score += 1
  } else {
    feedback.push('小文字を含めてください')
  }

  if (/[A-Z]/.test(password)) {
    score += 1
  } else {
    feedback.push('大文字を含めてください')
  }

  if (/[0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('数字を含めてください')
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1
  } else {
    feedback.push('記号を含めてください')
  }

  return {
    score,
    feedback,
    isValid: score >= 4
  }
} 
