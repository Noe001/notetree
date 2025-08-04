#!/bin/bash

echo "🔍 Dockerfileの更新確認を開始します..."

# 各Dockerfileのビルドテスト
echo "📦 Backend Dockerfileのテスト..."
cd backend
docker build -t backend-test . || { echo "❌ Backendビルドエラー"; exit 1; }
cd ..

echo "📦 Frontend Dockerfileのテスト..."
cd frontend
docker build -t frontend-test . || { echo "❌ Frontendビルドエラー"; exit 1; }
cd ..

echo "📦 Simple API Server Dockerfileのテスト..."
docker build -f simple-api-server.Dockerfile -t simple-api-test . || { echo "❌ Simple API Serverビルドエラー"; exit 1; }

echo "📦 WebSocket Server Dockerfileのテスト..."
docker build -f websocket-server.Dockerfile -t websocket-test . || { echo "❌ WebSocket Serverビルドエラー"; exit 1; }

echo "✅ すべてのDockerfileビルドが成功しました！"

# クリーンアップ
docker rmi backend-test frontend-test simple-api-test websocket-test 2>/dev/null || true

echo "🎉 更新完了！docker-compose upで起動できます。" 
