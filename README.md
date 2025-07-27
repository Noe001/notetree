# NoteTree

NoteTreeは、リアルタイムコラボレーション機能を持つメモアプリケーションです。Next.js（フロントエンド）、NestJS（バックエンド）、Supabase（データベース・認証）を使用して構築されています。

## 🚀 技術スタック

- **フロントエンド**: Next.js 15.4.1, React 18.2.0, TypeScript, Tailwind CSS
- **バックエンド**: NestJS 11.0.1, TypeScript, Socket.IO
- **データベース**: PostgreSQL (Supabase)
- **認証**: Supabase Auth
- **コンテナ化**: Docker & Docker Compose

## 📋 前提条件

以下のソフトウェアがインストールされている必要があります：

- [Docker](https://docs.docker.com/get-docker/) (v20.10以上)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0以上)
- [Node.js](https://nodejs.org/) (v18以上) - ローカル開発用
- [Git](https://git-scm.com/)

## 🛠️ セットアップ

### 1. リポジトリのクローン

```bash
git clone git@github.com:Noe001/notetree.git
cd notetree
```

### 2. 環境変数の設定

プロジェクトはDocker Composeで環境変数が設定されているため、追加の`.env`ファイルは不要です。ただし、本番環境やカスタム設定が必要な場合は、以下の環境変数を設定してください：

#### フロントエンド環境変数
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### バックエンド環境変数
```bash
DATABASE_URL=postgresql://postgres:postgres@db:5432/postgres
SUPABASE_URL=http://supabase-kong:8000
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Docker Composeでの起動

```bash
# すべてのサービスを起動
docker-compose up -d

# ログを確認しながら起動
docker-compose up

# バックグラウンドで起動
docker-compose up -d
```

### 4. サービスの確認

起動後、以下のURLでアクセスできます：

- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:3000
- **Supabase**: http://localhost:8000
- **データベース**: localhost:5432

## 🔧 開発環境での実行

### フロントエンド（ローカル開発）

```bash
cd frontend
npm install
npm run dev
```

### バックエンド（ローカル開発）

```bash
cd backend
npm install
npm run start:dev
```

## 📁 プロジェクト構造

```
notetree/
├── frontend/                 # Next.js フロントエンド
│   ├── components/          # React コンポーネント
│   ├── pages/              # Next.js ページ
│   ├── styles/             # CSS スタイル
│   ├── types/              # TypeScript 型定義
│   └── package.json
├── backend/                 # NestJS バックエンド
│   ├── src/                # ソースコード
│   ├── test/               # テストファイル
│   └── package.json
├── supabase/               # Supabase 設定
│   ├── migrations/         # データベースマイグレーション
│   └── kong.yml           # Kong API Gateway 設定
├── docker-compose.yml      # Docker Compose 設定
└── README.md
```

## 🗄️ データベース

PostgreSQLデータベースは自動的に初期化され、以下のマイグレーションが実行されます：

- `00-initial-schema.sql` - 初期スキーマ
- `01-create-roles.sql` - ロール作成
- `02-additional-auth-tables.sql` - 認証テーブル
- `03-default-instance.sql` - デフォルトインスタンス

## 🔐 認証

Supabase Authを使用して認証機能を提供しています：

- JWT認証
- ユーザー登録・ログイン
- セッション管理

## 📝 利用可能なスクリプト

### フロントエンド
```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run start    # プロダクションサーバー起動
npm run lint     # ESLint実行
```

### バックエンド
```bash
npm run start:dev    # 開発サーバー起動（ウォッチモード）
npm run start:debug  # デバッグモードで起動
npm run build        # TypeScriptコンパイル
npm run test         # テスト実行
npm run lint         # ESLint実行
```

## 🐳 Docker コマンド

```bash
# サービス一覧
docker-compose ps

# ログ確認
docker-compose logs -f [service_name]

# サービス停止
docker-compose down

# ボリュームも含めて完全削除
docker-compose down -v

# 特定のサービスのみ再起動
docker-compose restart [service_name]

# イメージを再ビルド
docker-compose build --no-cache
```

## 🔍 トラブルシューティング

### よくある問題

1. **ポートが既に使用されている場合**
   ```bash
   # 使用中のポートを確認
   lsof -i :5173
   lsof -i :3000
   lsof -i :8000
   ```

2. **Dockerコンテナが起動しない場合**
   ```bash
   # ログを確認
   docker-compose logs [service_name]
   
   # コンテナを再ビルド
   docker-compose build --no-cache
   ```

3. **データベース接続エラー**
   ```bash
   # データベースコンテナの状態確認
   docker-compose ps db
   
   # データベースログ確認
   docker-compose logs db
   ```

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成
