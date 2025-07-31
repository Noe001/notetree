# NoteTree

NoteTreeは、リアルタイムコラボレーション機能を持つメモアプリケーションです。Next.js（フロントエンド）、NestJS（バックエンド）、Supabase（データベース・認証）を使用して構築されています。

## 🚀 クイックスタート

### 前提条件

以下のソフトウェアがインストールされている必要があります：

- [Docker](https://docs.docker.com/get-docker/) (v20.10以上)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0以上)
- [Git](https://git-scm.com/)

### セットアップ

```bash
# リポジトリをクローン
git clone git@github.com:Noe001/notetree.git
cd notetree

# 全サービスを起動
docker-compose up -d

# ログを確認
docker-compose logs -f
```

### アクセス

起動後、以下のURLでアクセスできます：

- **フロントエンド**: http://localhost:5173
- **バックエンドAPI**: http://localhost:3000
- **Supabase**: http://localhost:8000
- **データベース**: localhost:5432

## 🛠️ Docker Compose コマンド

```bash
# 全サービスを起動（バックグラウンド）
docker-compose up -d

# 全サービスを起動（ログ表示）
docker-compose up

# 全サービスを停止
docker-compose down

# ログを確認
docker-compose logs -f

# 特定のサービスのログを確認
docker-compose logs -f frontend
docker-compose logs -f backend

# サービス一覧を確認
docker-compose ps

# 特定のサービスのみ再起動
docker-compose restart frontend
docker-compose restart backend

# イメージを再ビルド
docker-compose build --no-cache

# ボリュームも含めて完全削除
docker-compose down -v
```

## 📁 プロジェクト構造

```
notetree/
├── frontend/          # Next.js フロントエンド
├── backend/           # NestJS バックエンド
├── supabase/          # Supabase設定
├── docker-compose.yml # Docker Compose設定
├── simple-api-server.js # シンプルAPIサーバー
├── websocket-server.js # WebSocketサーバー
└── README.md
```

## 🔧 開発・デバッグ

### 開発モードでの起動

```bash
# 開発モードで起動（ホットリロード対応）
docker-compose up
```

### ログの確認

```bash
# 全サービスのログ
docker-compose logs -f

# 特定のサービスのログ
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f db
```

### コンテナ内での操作

```bash
# フロントエンドコンテナに入る
docker-compose exec frontend sh

# バックエンドコンテナに入る
docker-compose exec backend sh

# データベースコンテナに入る
docker-compose exec db psql -U postgres
```

## 🔍 トラブルシューティング

### よくある問題

1. **ポートが既に使用されている場合**
   ```bash
   # 使用中のポートを確認
   lsof -i :5173
   lsof -i :3000
   lsof -i :8000
   
   # 既存のコンテナを停止
   docker-compose down
   ```

2. **Dockerコンテナが起動しない場合**
   ```bash
   # ログを確認
   docker-compose logs [service_name]
   
   # コンテナを再ビルド
   docker-compose build --no-cache
   docker-compose up -d
   ```

3. **データベース接続エラー**
   ```bash
   # データベースコンテナの状態確認
   docker-compose ps db
   
   # データベースログ確認
   docker-compose logs db
   
   # データベースをリセット
   docker-compose down -v
   docker-compose up -d
   ```

4. **依存関係の問題**
   ```bash
   # 全コンテナとイメージを削除
   docker-compose down
   docker system prune -a
   
   # 再ビルド
   docker-compose build --no-cache
   docker-compose up -d
   ```

## 📝 技術スタック

- **フロントエンド**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **バックエンド**: NestJS, TypeORM, PostgreSQL
- **認証**: Supabase Auth
- **リアルタイム**: WebSocket
- **コンテナ**: Docker, Docker Compose
- **テスト**: Jest, React Testing Library, Playwright

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


## 🤝 コントリビューション

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。
