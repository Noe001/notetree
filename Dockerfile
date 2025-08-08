# ベースイメージとしてNode.js 18を使用
FROM node:20-alpine

ARG DATABASE_URL

# コンテナ内の作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピーし、依存関係をインストール
COPY package*.json ./ 
RUN npm ci

# アプリケーションのソースコードをコピー
COPY . .

ENV DATABASE_URL=$DATABASE_URL

# Prismaクライアントを生成
RUN npx prisma generate

# Next.jsアプリケーションをビルド
RUN npm run build

# アプリケーションを起動するためのコマンド
CMD ["npm", "run", "start"]

# Next.jsのデフォルトポートを公開
EXPOSE 3000
