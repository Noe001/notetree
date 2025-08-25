# アプリケーション仕様書

## 1. 概要

このアプリケーションは、リアルタイムコラボレーションと永続的なノート保存を可能にするノート作成ツールです。ユーザーはウェブインターフェースを通じてノートを作成、編集、整理でき、変更はリアルタイムで同期されます。

## 2. 技術スタック

- **フロントエンド**: Next.js (React)
- **バックエンド**: Next.js API Routes (Node.js)
- **データベース**: PostgreSQL (Prisma ORM)
- **リアルタイム通信**: WebSocket
- **スタイリング**: Tailwind CSS

## 3. 機能一覧

- ユーザー認証 (JWTおよびクッキーベースで実装)
- ノートの作成、編集、削除
- ノートのリアルタイム同期
- グループによるノート共有 (グループIDに基づいたノートの共有とリアルタイム同期)
- ノートの整理 (例: フォルダー、タグ)
- 検索機能

## 4. データモデル (Prisma Schema)

### User
- `id`: String (UUID)
- `email`: String (Unique)
- `name`: String
- `notes`: Note[]

### Note
- `id`: String (UUID)
- `title`: String
- `content`: String
- `createdAt`: DateTime
- `updatedAt`: DateTime
- `authorId`: String
- `author`: User
- `groupId`: String (Optional, グループノートの場合に設定)

## 5. アーキテクチャ概要

このアプリケーションは、Next.jsのフルスタックフレームワークを活用したクライアントサーバーアーキテクチャを採用しています。フロントエンドはNext.jsで構築され、ユーザーインターフェースを提供します。バックエンドはNext.js API Routesと独立したWebSocketサーバーで構成され、データ永続化とリアルタイム通信を処理します。

- **クライアント**: ユーザーの操作に応じてAPIリクエストを送信し、WebSocketを通じてリアルタイム更新を受信します。
- **Next.js API Routes**: データベース操作 (CRUD) を担当し、Prisma ORMを介してPostgreSQLと通信します。また、ユーザー認証のエンドポイントも提供します。
- **WebSocketサーバー**: ノートの変更をクライアント間でリアルタイムにブロードキャストします。接続時にJWTを検証し、認証されたユーザーのみを許可します。また、クライアントは特定のグループに参加/離脱でき、サーバーはそのグループに属するクライアントにのみメッセージをブロードキャストします。

## 6. セットアップ方法

1. **リポジトリのクローン**: `git clone [リポジトリURL]`
2. **依存関係のインストール**: `npm install` または `yarn install`
3. **環境変数の設定**: `.env` ファイルに以下の環境変数を設定します。
    - `DATABASE_URL`: PostgreSQLデータベースの接続文字列 (例: `postgresql://user:password@host:port/database?schema=public`)
    - `JWT_SECRET`: JWTの署名に使用する秘密鍵 (任意の強力な文字列)
    - `NEXT_PUBLIC_WS_URL`: WebSocketサーバーのURL (例: `ws://localhost:3001`)
    - `WS_PORT`: WebSocketサーバーがリッスンするポート (デフォルトは3001)
    - `API_URL`: Next.jsアプリケーションのベースURL (例: `http://localhost:3000`)
4. **データベースのマイグレーション**: `npx prisma migrate dev`
5. **アプリケーションの実行**: `npm run dev` または `yarn dev`
6. **WebSocketサーバーの起動**: `node websocket-server/index.js` (または適切なコマンド)

## 7. UI/UX 仕様

### 7.1 画面一覧とナビゲーション
- ログイン/サインアップ画面
  - 要素: メール、パスワード、送信ボタン、モード切替リンク
  - エラーメッセージ: 入力バリデーション/認証失敗時にフォーム下に表示
  - 成功時: ダッシュボードに遷移。セッションCookie設定
- ダッシュボード（メイン）
  - ヘッダー: プロフィール、ログアウト、検索入力、ヘルプ
  - サイドバー: グループ一覧、グループ作成/参加、フィルター（自分のメモ/共有）
  - メイン領域: メモ一覧（仮想リスト、無限スクロール対応）
- メモ詳細/編集モーダル
  - モーダルでタイトル/本文編集、保存/キャンセル、削除、更新日時表示
  - キーボードショートカット対応（後述）
- グループ管理モーダル
  - 参加メンバー一覧、ロール（owner/admin/member）表示
  - 招待リンク生成/失効、メンバー追加・削除、退出
- 検索結果モーダル
  - ハイライト表示、フィルター（グループ/作成者/更新日）、ページング

ナビゲーション原則
- 主要導線はヘッダーとサイドバーに集約
- モーダルは Esc で閉じる、Enter で主要アクション実行
- URL ルーティング例
  - `/` ダッシュボード
  - `/login` 認証画面
  - `/groups/:id` グループ別ビュー（サイドバー選択時に更新）

### 7.2 情報設計（IA）とコンポーネント
- 一覧は [app/components/ui/virtual-list.tsx](app/components/ui/virtual-list.tsx:1) によるパフォーマントな表示
- 入力系は [app/components/ui/input.tsx](app/components/ui/input.tsx:1), [app/components/ui/textarea.tsx](app/components/ui/textarea.tsx:1), [app/components/ui/button.tsx](app/components/ui/button.tsx:1) を利用
- メモCRUD:
  - 作成: ヘッダーの「新規メモ」ボタン、または `N`
  - 編集: 一覧アイテムクリック、または `E`
  - 削除: 詳細モーダル内 [app/components/memo/memo-delete-dialog.tsx](app/components/memo/memo-delete-dialog.tsx:1)
- グループ操作: [app/components/group-manager.tsx](app/components/group-manager.tsx:1) / [app/components/group/*](app/components/group/create-group-dialog.tsx:1)
- 共有/リアルタイム: [app/components/realtime/](app/components/realtime/:1) と [app/lib/websocket-client.ts](app/lib/websocket-client.ts:1)

### 7.3 ユーザーフロー
- 初回訪問
  - 未ログイン: ログイン/サインアップ提示、成功後にダッシュボード
  - ログイン済: トークン検証後、自動でダッシュボード
- メモ作成
  - 新規メモボタン → モーダルでタイトル必須、本文任意 → 保存後一覧先頭に反映、リアルタイム配信
- メモ編集
  - 一覧から選択 → モーダルで編集 → オートセーブ（1sデバウンス）＋明示保存
- グループ参加/作成
  - 参加: 招待リンク入力/クリック → 成功通知 → サイドバーに追加
  - 作成: ダイアログで名称必須 → 作成後に自動選択
- 検索
  - ヘッダーの検索バー → モーダルで結果一覧。キーワードとタグのAND/OR検索、グループフィルタ

### 7.4 アクセシビリティ
- キーボード操作
  - グローバル: `?` ヘルプ、`/` 検索、`N` 新規、`E` 編集、`Del` 削除、`Esc` モーダル閉
  - フォーカスリングの可視化、Tab順序の論理性
- スクリーンリーダー
  - 主要コンポーネントに `aria-label/aria-labelledby` 付与
  - モーダルは `role="dialog"` とフォーカストラップ
- コントラスト
  - WCAG AA 準拠（テキストコントラスト比 4.5:1 以上）
  - ダーク/ライトテーマの配色ガイドを Tailwind トークンで統一

### 7.5 フィードバックとエラーハンドリング
- トースト通知: 成功/警告/失敗を [app/components/notification/notification-provider.tsx](app/components/notification/notification-provider.tsx:1) で表示
- フォームバリデーション
  - クライアント: 必須/形式チェック、ライブバリデーション
  - サーバ: 冪等・権限・レート制限の失敗時に意味のあるメッセージ
- 競合解決
  - リアルタイム編集競合時は「最新版を適用/自分の変更を上書き」選択ダイアログ
  - 自動マージ不可時は差分強調表示

### 7.6 パフォーマンス/オフライン
- 仮想リスト、スケルトンローディング、インクリメンタルフェッチ
- オフラインキャッシュ: [app/lib/local-memo-storage.ts](app/lib/local-memo-storage.ts:1) を利用し作成/編集をキューイング、オンライン復帰で同期
- 画像や大きな本文の遅延ロード、テキスト入力はデバウンス1s

### 7.7 国際化/I18N
- 言語切替はヘッダーから（初期はブラウザ言語）
- 文言はキー管理。未翻訳キーは英語フォールバック

### 7.8 デザインガイド
- タイポグラフィ: ベース16px、スケール 16/18/20/24/32
- スペーシング: 4の倍数
- コンポーネントの状態: default/hover/active/disabled/focus を全て定義
- アイコンは意味を明確に。破壊的操作は危険色＋確認ダイアログ必須

### 7.9 追跡指標（プロダクトメトリクス）
- DAU/WAU、メモ作成率、共有グループ利用率、検索利用率、平均編集セッション長
- エラー率、保存失敗率、競合発生率、オフライン保存復帰成功率

### 7.10 プライバシーとセキュリティ考慮のUI
- センシティブ情報をUIに表示しない（トークン、内部ID）
- 共有時に明示的なスコープ確認（閲覧/編集）
- 公開リンク発行時は有効期限と失効UIを必須表示

## 8. データモデル詳細（Prisma 実装）

実装上の正規仕様は `prisma/schema.prisma` に準拠します。主要モデルは以下の通りです。

- User
  - `id: String (uuid)`
  - `email: String @unique`
  - `password: String`
  - `name: String?`
  - `memos: Memo[]`
  - `groups: GroupMember[]`（メンバーとしての所属）
  - `ownedGroups: Group[]`（オーナーとしての所有）

- Memo
  - `id: String (uuid)`
  - `title: String`
  - `content: String`
  - `tags: String`（JSON 文字列として保存、APIでは `string[]` にパース）
  - `isPrivate: Boolean @default(false)`
  - `authorId: String` -> `author: User`
  - `groupId: String?` -> `group: Group?`
  - `createdAt: DateTime` / `updatedAt: DateTime`

- Group
  - `id: String (uuid)`
  - `name: String`
  - `description: String?`
  - `ownerId: String` -> `owner: User`
  - `members: GroupMember[]`
  - `memos: Memo[]`
  - `invitations: Invitation[]`
  - `createdAt: DateTime` / `updatedAt: DateTime`

- GroupMember
  - `id: String (uuid)`
  - `userId: String` -> `user: User`
  - `groupId: String` -> `group: Group`
  - `role: UserRole = MEMBER`（`OWNER | ADMIN | MEMBER`）
  - 一意制約: `@@unique([userId, groupId])`

- Invitation
  - `id: String (uuid)`
  - `email: String`
  - `groupId: String` -> `group: Group`
  - `token: String @unique`
  - `expiresAt: DateTime`
  - 期限切れまたは参加完了で削除

備考:
- `tags` は DB 保存時は JSON 文字列、API 応答では `string[]`。
- 文字列 ID（UUID）を採用。型定義もこれに合わせること（正準は `app/types/index.ts`）。

## 9. API 仕様（App Router /api）

すべてのエンドポイントは Cookie の `auth_token` による認証を前提とします（JWT）。

- 認証
  - `POST /api/auth/signup`
    - 入力: `{ email, password, name? }`
    - 出力: `{ user }`（実装により自動ログインは行わない場合あり）
  - `POST /api/auth/login`
    - 入力: `{ email, password }`
    - 成功時: `Set-Cookie: auth_token=...; HttpOnly`、`{ message, user }`
  - `GET /api/auth/me`
    - 出力: `{ user }`（未認証は 401）
  - `POST /api/auth/logout`
    - 出力: `{ message }`（`auth_token` 失効）

- メモ
  - `GET /api/memos`
    - 自分のメモ一覧を返す
    - 出力: `{ success: true, data: Memo[] }`
  - `POST /api/memos`
    - 入力: `{ title, content, tags?: string[], isPrivate: boolean, groupId: string|null }`
    - 出力: `{ success: true, data: Memo }`
  - `GET /api/memos/:id`
    - 権限: 作成者または所属グループのメンバー
    - 出力: `{ memo: Memo }`
  - `PATCH /api/memos/:id`
    - 入力: 任意フィールド（`title|content|tags|isPrivate|groupId`）
    - 権限: 作成者のみ
    - 出力: `{ memo: Memo }`
  - `DELETE /api/memos/:id`
    - 権限: 作成者のみ
    - 出力: 204 + `{ message }`

- グループ
  - `GET /api/groups`
    - 出力: `{ groups: Group[] }`（所有またはメンバー）
  - `POST /api/groups`
    - 入力: `{ name, description? }`
    - 実装: 作成者を `OWNER` として `GroupMember` に追加
    - 出力: `{ group: Group }`
  - `GET /api/groups/:id`
    - 権限: オーナー or メンバー
    - 出力: `{ group: Group }`（`owner`, `members`, `memos`, `invitations` を含む）
  - `PUT /api/groups/:id`
    - 入力: `{ name?, description? }`
    - 権限: オーナーのみ
    - 出力: `{ group }`
  - `DELETE /api/groups/:id`
    - 権限: オーナーのみ
    - 出力: 204 + `{ message }`

- グループメンバー/招待
  - `GET /api/groups/:id/members`
    - 権限: オーナー or メンバー
    - 出力: `{ members: GroupMember[] }`
  - `PUT /api/groups/:id/members/:memberId`
    - 入力: `{ role }`（`OWNER` 以外）
    - 権限: オーナーのみ
    - 出力: `{ member: GroupMember }`
  - `DELETE /api/groups/:id/members/:memberId`
    - 権限: オーナーのみ（自身削除不可、`OWNER` 削除不可）
    - 出力: 204 + `{ message }`
  - `POST /api/groups/:id/invitations`
    - 入力: `{ email }`（既存メンバー/既存招待は 409）
    - 権限: オーナーのみ
    - 出力: `{ invitation: { email, token } }`
  - `POST /api/groups/join/:token`
    - 招待トークンで参加（期限切れは 400）
    - 出力: `{ message, group }`

- ユーザー
  - `GET /api/users`
    - 権限: 認証必須
    - 出力: `User[]`

注記:
- レスポンス形式はエンドポイントにより `{ success, data }` 形式と `{ group }` などが混在しています。将来的に統一予定。
- 検索 API（例: `/api/memos/search`）は現時点で未実装です。

## 10. リアルタイム（WebSocket）仕様

- サーバー: 独立プロセス（`websocket-server/src/index.ts`）で `ws` を使用。
- 認証: 接続時に Cookie の `auth_token` を読み取り JWT 検証。失敗で `1008` Close。
- グループ購読: クライアントは `GROUP_JOIN` / `GROUP_LEAVE` を送信し、`ws.groupIds` により購読管理。
- メッセージ型（抜粋、`websocket-server/src/types`）
  - `AUTH_SUCCESS { userId }`
  - `MEMO_CREATE|MEMO_UPDATE|MEMO_DELETE { payload, groupId, senderId }`
  - `GROUP_JOIN|GROUP_LEAVE { groupId }`
- メモ系イベントはサーバー側で Next.js API を HTTP 経由で呼び出し（`API_URL`/`/api/memos`）。成功時に同一 `groupId` へブロードキャスト。

## 11. 環境変数

- 共通
  - `DATABASE_URL`（PostgreSQL）
  - `JWT_SECRET`
  - `NODE_ENV`
- フロントエンド（Next.js）
  - `NEXT_PUBLIC_API_URL`（例: `http://localhost:3000`）
  - `NEXT_PUBLIC_WS_URL`（例: `ws://localhost:3001`）
  - `NEXT_PUBLIC_ENABLE_MOCK`（開発時のモック切替）
  - `NEXT_PUBLIC_APP_VERSION`（`next.config.mjs` で注入）
- WebSocket サーバー
  - `WS_PORT`（デフォルト: 3001）
  - `JWT_SECRET`（同一値を共有）
  - `API_URL`（Next.js 側 API のベース URL、デフォルト `http://localhost:3000`）

## 12. セキュリティ/ミドルウェア

- Next.js ミドルウェア（`app/middleware.ts`）で以下を全レスポンスに付与:
  - CSP（`generateCSPHeader`）
  - 標準セキュリティヘッダー（`getSecurityHeaders`）
  - `csrf_token` Cookie（GET 時に発行, `SameSite=Strict`）
- `next.config.mjs` でも各種セキュリティヘッダーと `connect-src` に WS/HTTP の許可先を定義。
- 入力検証/サニタイゼーションは `app/lib/security.ts` を利用（メール/パスワード/タグ検証、XSS/SQLi 検出など）。
- 現状、CSRF トークンの検証は API で強制していません（将来導入予定）。

## 13. Docker 構成

- `docker-compose.yml`
  - `frontend`（Next.js）: 3000
  - `websocket-server`: 3001
  - `db`（PostgreSQL 16-alpine）: 5432（永続化 `db_data`）
  - 起動コマンド例: Prisma マイグレーション後に `npm run start`

## 14. 既知の制約/今後の改善

- API レスポンスの形式が統一されていない（`{ success, data }` vs `{ group }` 等）。
- CSRF トークンの検証は未実装（Cookie の発行のみ）。
- 検索 API など一部エンドポイントは未実装だが UI/クライアントコードの参照が存在。
- `tags` の DB 保存形式（JSON 文字列）とアプリ層の配列表現の差異に留意。

