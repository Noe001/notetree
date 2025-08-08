/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // CI/本番ビルドではESLintエラーで失敗させない（段階的に型・lint整備するため）
    ignoreDuringBuilds: true,
  },
  
  // 本番環境での最適化
  // output: 'standalone',
  
  // セキュリティヘッダーの設定
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "img-src 'self' data: https:",
              "connect-src 'self' http://localhost:3000 http://localhost:3001",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
  },
          // セキュリティヘッダー
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), fullscreen=self'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          }
        ]
      }
    ]
  },
  
  // 環境変数の設定
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
  },
  
  // 画像の最適化設定
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Webpackの設定
  webpack: (config, { dev, isServer }) => {
    // 本番環境でのソースマップを無効化（セキュリティ向上）
    if (!dev && !isServer) {
      config.devtool = false
    }
    
    // 本番環境での最適化
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
          },
        },
      }
    }
    
    return config
  },
  
  // PoweredByヘッダーを削除（セキュリティ向上）
  poweredByHeader: false,
  
  // 圧縮の有効化
  compress: true,
  
  // ETagの有効化
  generateEtags: true,
  
  // 実験的機能
  experimental: {
    // セキュリティ関連の実験的機能
    strictNextHead: true,
    // 本番環境での最適化
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
  }
}

export default nextConfig
