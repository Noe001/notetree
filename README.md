# NoteTree Frontend

## 概要

NoteTreeは、モダンなメモ管理アプリケーションです。React、Next.js、TypeScriptを使用して構築されており、リアルタイムでのメモ作成、編集、共有機能を提供します。

## 技術スタック

- **フレームワーク**: Next.js 15
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **UI コンポーネント**: Radix UI
- **状態管理**: React Hooks
- **認証**: Supabase Auth
- **API**: RESTful API
- **テスト**: Jest + Testing Library

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- Docker & Docker Compose
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### 環境変数

`.env.local`ファイルを作成し、以下の環境変数を設定してください：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ENABLE_MOCK=true
NODE_ENV=development
```

## 開発

### 利用可能なスクリプト

```bash
# 開発サーバーの起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバーの起動
npm run start

# リント
npm run lint

# テスト
npm run test
npm run test:watch
npm run test:coverage

# API連携テスト
npm run test:local-api
npm run test:production-api
```

### ディレクトリ構造

```
frontend/
├── components/          # React コンポーネント
├── pages/              # Next.js ページ
├── lib/                # ユーティリティとライブラリ
├── hooks/              # カスタム React Hooks
├── types/              # TypeScript 型定義
├── styles/             # グローバルスタイル
├── public/             # 静的ファイル
└── __tests__/          # テストファイル
```

## 本番環境へのデプロイ

### 1. ビルド

```bash
# 本番用ビルド
npm run build
```

### 2. Docker でのデプロイ

#### 開発環境

```bash
# 開発環境の起動（Docker Compose）
npm run docker:dev

# 開発環境のビルドと起動
npm run docker:dev:build

# 開発環境の停止
npm run docker:down

# ログの確認
npm run docker:logs
```

#### 本番環境

```bash
# 本番環境の起動（Docker Compose）
npm run docker:prod

# 本番環境のビルドと起動
npm run docker:prod:build

# 本番環境の停止
npm run docker:down
```

#### 直接的なDockerコマンド

```bash
# 開発環境
docker-compose --profile dev up -d

# 本番環境
docker-compose --profile prod up -d

# 全環境の停止
docker-compose down
```
# Docker イメージのビルド
docker build -t notetree-frontend .

# コンテナの起動
docker run -p 3000:3000 notetree-frontend
```

### 3. 環境変数の設定

本番環境では以下の環境変数を設定してください：

```env
NEXT_PUBLIC_API_URL=https://api.notetree.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_ENABLE_MOCK=false
NODE_ENV=production
```

## API連携テスト

### ローカル環境でのテスト

```bash
# ローカルAPIサーバーを起動
docker-compose up -d simple-api-server

# ローカルAPI連携テストを実行
npm run test:local-api
```

### 本番環境でのテスト

```bash
# 本番API連携テストを実行
npm run test:production-api
```

## パフォーマンス監視

本番環境では以下の機能が有効になります：

- **API応答時間の監視**: すべてのAPI呼び出しの応答時間を測定
- **エラー監視**: JavaScriptエラーと未処理のPromise拒否を監視
- **メモリ使用量監視**: ブラウザのメモリ使用量を監視
- **ネットワーク状態監視**: 接続速度と品質を監視

## セキュリティ

以下のセキュリティ機能が実装されています：

- **入力値のサニタイゼーション**: XSS攻撃の防止
- **CSRFトークン**: CSRF攻撃の防止
- **レート制限**: API呼び出しの制限
- **セキュリティヘッダー**: 各種セキュリティヘッダーの設定
- **パスワード強度検証**: 強力なパスワードの要求

## テスト

### ユニットテスト

```bash
# すべてのテストを実行
npm run test

# テストカバレッジを確認
npm run test:coverage
```

### 統合テスト

```bash
# API連携テスト
npm run test:api

# ローカル環境でのテスト
npm run test:local-api

# 本番環境でのテスト
npm run test:production-api
```

## トラブルシューティング

### よくある問題

1. **API接続エラー**
   - ローカルAPIサーバーが起動しているか確認
   - 環境変数が正しく設定されているか確認

2. **認証エラー**
   - Supabaseの設定を確認
   - セッショントークンが有効か確認

3. **ビルドエラー**
   - Node.jsのバージョンを確認
   - 依存関係を再インストール

### デバッグ

開発環境では詳細なログが出力されます：

```bash
# デバッグモードで起動
NODE_ENV=development npm run dev
```

## 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。 