FROM node:20-alpine AS base

# システムパッケージの更新とキャッシュクリア
RUN apk update && apk upgrade && \
    apk add --no-cache git && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# 依存関係のインストール（キャッシュを活用）
COPY package*.json ./
RUN npm install && npm cache clean --force

# ソースコードのコピー
COPY . .

# ポートの公開
EXPOSE 3000

# 開発サーバーの起動
CMD ["npm", "run", "start:dev"]
