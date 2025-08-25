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
  },

  // パスワード強度チェック（緩和版）
  password: (password: string): { valid: boolean; error?: string } => {
    if (!password.trim()) {
      return { valid: false, error: 'パスワードは必須です' }
    }
    if (password.length < 6) {
      return { valid: false, error: 'パスワードは6文字以上で入力してください' }
    }
    if (password.length > 128) {
      return { valid: false, error: 'パスワードが長すぎます' }
    }
    return { valid: true }
  },

  // ユーザー名検証
  username: (username: string): { valid: boolean; error?: string } => {
    if (!username.trim()) {
      return { valid: false, error: 'ユーザー名は必須です' }
    }
    if (username.length < 2) {
      return { valid: false, error: 'ユーザー名は2文字以上で入力してください' }
    }
    if (username.length > 50) {
      return { valid: false, error: 'ユーザー名は50文字以内で入力してください' }
    }
    if (!/^[a-zA-Z0-9ぁ-んァ-ヶー一-龯\-_]+$/.test(username)) {
      return { valid: false, error: 'ユーザー名に使用できない文字が含まれています' }
    }
    // 連続アンダースコアのチェック
    if (/_{3,}/.test(username)) {
      return { valid: false, error: 'アンダースコアが3回以上連続するユーザー名は使用できません' }
    }
    return { valid: true }
  }
}

/**
 * 本番環境でのセキュリティ強化ユーティリティ
 */

/**
 * 入力値のサニタイゼーション
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // HTMLエンティティのエスケープ
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * XSS攻撃の検出
 */
export function detectXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * SQLインジェクション攻撃の検出
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(union|select|insert|update|delete|drop|create|alter)\b)/gi,
    /(\b(or|and)\b\s+\d+\s*[=<>])/gi,
    /(--|\/\*|\*\/)/g,
    /(\b(exec|execute|xp_|sp_)\b)/gi
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * セッショントークンの検証
 */
export function validateSessionToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // JWTトークンの形式チェック
  const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  return jwtPattern.test(token);
}

/**
 * パスワード強度の検証
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;
  
  if (!password || password.length < 8) {
    feedback.push('パスワードは8文字以上である必要があります');
    return { isValid: false, score: 0, feedback };
  }
  
  // 長さチェック
  if (password.length >= 12) score += 2;
  else if (password.length >= 8) score += 1;
  
  // 文字種チェック
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // フィードバック生成
  if (!/[a-z]/.test(password)) feedback.push('小文字を含めてください');
  if (!/[A-Z]/.test(password)) feedback.push('大文字を含めてください');
  if (!/[0-9]/.test(password)) feedback.push('数字を含めてください');
  if (!/[^A-Za-z0-9]/.test(password)) feedback.push('特殊文字を含めてください');
  
  const isValid = score >= 4;
  
  return { isValid, score, feedback };
}

/**
 * CSRFトークンの生成
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * CSRFトークンの検証
 */
export function validateCSRFToken(token: string, storedToken: string): boolean {
  return token === storedToken;
}

/**
 * レート制限の実装
 */
class RateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  
  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000 // 1分
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requestData = this.requests.get(identifier);
    
    if (!requestData || now > requestData.resetTime) {
      // 新しいウィンドウを開始
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }
    
    if (requestData.count >= this.maxRequests) {
      return false;
    }
    
    requestData.count++;
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const requestData = this.requests.get(identifier);
    if (!requestData) return this.maxRequests;
    
    const now = Date.now();
    if (now > requestData.resetTime) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - requestData.count);
  }
}

export const rateLimiter = new RateLimiter();

/**
 * セキュアなランダム文字列の生成
 */
export function generateSecureRandomString(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, length);
}

/**
 * ファイルアップロードの検証
 */
export function validateFileUpload(file: File): {
  isValid: boolean;
  error?: string;
} {
  // ファイルサイズの制限（10MB）
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { isValid: false, error: 'ファイルサイズが大きすぎます（最大10MB）' };
  }
  
  // 許可されたファイル形式
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'application/pdf'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: '許可されていないファイル形式です' };
  }
  
  return { isValid: true };
}

/**
 * 本番環境でのセキュリティヘッダーの設定
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=(), fullscreen=self',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };
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
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': ["'self'"],
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
