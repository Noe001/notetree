const WebSocket = require('ws');
const http = require('http');
const express = require('express');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 接続されたクライアントを管理
const clients = new Set();

// WebSocket接続の処理
wss.on('connection', (ws, req) => {
  console.log('🔌 WebSocket接続が確立されました', req.url);
  clients.add(ws);

  // 接続確認メッセージを送信
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket接続が確立されました',
    timestamp: new Date().toISOString()
  }));

  // メッセージ受信の処理
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('📨 受信メッセージ:', data);

      // 全クライアントにブロードキャスト（送信者以外）
      clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'broadcast',
            data: data,
            timestamp: new Date().toISOString()
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
    console.log('🔌 WebSocket接続が終了されました');
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
