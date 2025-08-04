FROM node:20-alpine AS base

# システムパッケージの更新とキャッシュクリア
RUN apk update && apk upgrade && \
    apk add --no-cache git && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# アプリケーションファイルをコピー
COPY simple-api-server.js ./

EXPOSE 3000

CMD ["node", "simple-api-server.js"]
