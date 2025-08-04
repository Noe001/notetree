FROM node:20-alpine AS base

# システムパッケージの更新とキャッシュクリア
RUN apk update && apk upgrade && \
    apk add --no-cache git && \
    rm -rf /var/cache/apk/*

WORKDIR /app

# アプリケーションファイルをコピー
COPY websocket-server.js ./

EXPOSE 8080

CMD ["node", "websocket-server.js"]
