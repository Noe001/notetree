const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const url = require('url');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true }); // upgrade処理を手動で行う

// 接続されたクライアントを管理（ユーザーIDをキーとして管理）
const clients = new Map();

// JWT認証関数
function authenticateToken(token) {
  if (!token) {
    throw new Error('Token is required');
  }

  // JWT検証（Supabaseの公開鍵を使用）
  try {
    // 環境変数からJWTシークレットを取得
    const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      throw new Error('JWT secret not configured');
    }
    
    // JWTを検証
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload) {
      throw new Error('Invalid token');
    }
    return payload;
  } catch (error) {
    // モックJWTトークンの処理
    if (token.startsWith('mock_jwt_')) {
      const parts = token.split('_');
      if (parts.length >= 3) {
        return { 
          sub: '0bfbe520-bae0-41b1-95da-cf9a6b00c351',
          id: '0bfbe520-bae0-41b1-95da-cf9a6b00c351'
        };
      }
    }
    
    throw new Error('Invalid or expired token');
  }
}

// WebSocket接続のupgrade処理
server.on('upgrade', (request, socket, head) => {
  const { pathname, query } = url.parse(request.url, true);
  
  // 認証トークンの検証
  try {
    const token = query.token;
    const user = authenticateToken(token);
    
    // 接続を承認
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, user);
    });
  } catch (error) {
    // 認証失敗時は接続を拒否
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});

// WebSocket接続の処理
wss.on('connection', (ws, req, user) => {
  console.log('🔌 WebSocket接続が確立されました', req.url, 'ユーザー:', user.sub);
  
  // ユーザー情報をクライアントに紐付けて保存
  clients.set(ws, {
    userId: user.sub,
    user: user,
    connectedAt: new Date().toISOString()
  });

  // 接続確認メッセージを送信
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket接続が確立されました',
    timestamp: new Date().toISOString(),
    userId: user.sub
  }));

  // メッセージ受信の処理
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 受信メッセージ:', data, 'from user:', user.sub);

      // 全クライアントにブロードキャスト（送信者以外、かつ同じユーザーのセッションのみ）
      clients.forEach((clientInfo, client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN && clientInfo.userId === user.sub) {
          client.send(JSON.stringify({
            type: 'broadcast',
            data: data,
            timestamp: new Date().toISOString(),
            fromUser: user.sub
          }));
        }
      });

    } catch (error) {
      console.error('❌ メッセージ解析エラー:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'メッセージの形式が正しくありません',
        timestamp: new Date().toISOString()
      }));
    }
  });

  // 接続終了の処理
  ws.on('close', () => {
    console.log('🔌 WebSocket接続が終了されました', 'ユーザー:', clients.get(ws)?.userId);
    clients.delete(ws);
  });

  // エラー処理
  ws.on('error', (error) => {
    console.error('❌ WebSocketエラー:', error);
    clients.delete(ws);
  });
});

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'WebSocket Server is running',
    clients: clients.size
  });
});

// サーバー起動
const PORT = 8080;
server.listen(PORT, () => {
  console.log(`🚀 WebSocket Server is running on ws://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  console.log('\n🛑 WebSocketサーバーを終了しています...');
  wss.close(() => {
    console.log('✅ WebSocketサーバーが正常に終了しました');
    process.exit(0);
  });
});

module.exports = { wss, clients };
