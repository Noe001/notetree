const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'memos-data.json');

// ミドルウェア
app.use(cors());
app.use(express.json());

// JWT認証ミドルウェア
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  console.log('Debug - Received token:', token); // デバッグログ
  console.log('Debug - Request URL:', req.url); // デバッグログ
  console.log('Debug - Request method:', req.method); // デバッグログ

  if (!token) {
    console.log('Debug - No token provided'); // デバッグログ
    return res.status(401).json({
      success: false,
      message: 'Access token is required'
    });
  }

  // モックJWTトークンの処理を最初にチェック
  if (token.startsWith('mock_jwt_')) {
    console.log('Debug - Processing mock token'); // デバッグログ
    const parts = token.split('_');
    console.log('Debug - Token parts:', parts); // デバッグログ
    if (parts.length >= 3) {
      console.log('Debug - Mock token valid, setting user'); // デバッグログ
      req.user = { 
        sub: '0bfbe520-bae0-41b1-95da-cf9a6b00c351',
        id: '0bfbe520-bae0-41b1-95da-cf9a6b00c351'
      };
      return next();
    } else {
      console.log('Debug - Mock token invalid, parts length:', parts.length); // デバッグログ
    }
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
    req.user = payload;
    next();
  } catch (error) {
    console.log('Debug - Token validation failed:', error.message); // デバッグログ
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
}

// データファイルの初期化
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    // ファイルが存在しない場合は空の配列で初期化
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  }
}

// データの読み込み
async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('データ読み込みエラー:', error);
    return [];
  }
}

// データの書き込み
async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('データ書き込みエラー:', error);
    return false;
  }
}

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Simple Memo API Server is running'
  });
});

// メモ検索（メモ一覧取得より前に配置）
app.get('/memos/search', authenticateToken, async (req, res) => {
  try {
    const { q: query } = req.query;
    const userId = req.user.sub; // JWTのsubクレームからユーザーIDを取得
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const memos = await readData();
    let filteredMemos = memos;
    
    // ユーザーのメモのみをフィルタリング
    filteredMemos = filteredMemos.filter(memo => memo.userId === userId);
    
    const searchResults = filteredMemos.filter(memo => {
      const lowercaseQuery = query.toLowerCase();
      return memo.title.toLowerCase().includes(lowercaseQuery) ||
             memo.content.toLowerCase().includes(lowercaseQuery) ||
             memo.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery));
    });
    
    res.json({
      success: true,
      data: searchResults,
      count: searchResults.length
    });
  } catch (error) {
    console.error('メモ検索エラー:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search memos',
      error: error.message
    });
  }
});

// メモ一覧取得
app.get('/memos', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub; // JWTのsubクレームからユーザーIDを取得
    const { groupId } = req.query;
    const memos = await readData();
    
    let filteredMemos = memos;
    // ユーザーのメモのみをフィルタリング
    filteredMemos = filteredMemos.filter(memo => memo.userId === userId);
    
    if (groupId) {
      filteredMemos = filteredMemos.filter(memo => memo.groupId === groupId);
    }
    
    res.json({
      success: true,
      data: filteredMemos,
      count: filteredMemos.length
    });
  } catch (error) {
    console.error('メモ取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch memos',
      error: error.message
    });
  }
});

// メモ作成
app.post('/memos', authenticateToken, async (req, res) => {
  try {
    const { title, content, tags, isPrivate, groupId } = req.body;
    const userId = req.user.sub; // JWTのsubクレームからユーザーIDを取得
    const memos = await readData();
    
    const newMemo = {
      id: `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || '無題',
      content: content || '',
      tags: tags || [],
      isPrivate: isPrivate || false,
      userId: userId, // 認証されたユーザーIDを使用
      groupId: groupId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    memos.push(newMemo);
    const success = await writeData(memos);
    
    if (success) {
      res.status(201).json({
        success: true,
        data: newMemo,
        message: 'Memo created successfully'
      });
    } else {
      throw new Error('Failed to save memo');
    }
  } catch (error) {
    console.error('メモ作成エラー:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create memo',
      error: error.message
    });
  }
});

// メモ取得（単体）
app.get('/memos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub; // JWTのsubクレームからユーザーIDを取得
    const memos = await readData();
    const memo = memos.find(m => m.id === id && m.userId === userId);
    
    if (!memo) {
      return res.status(404).json({
        success: false,
        message: 'Memo not found'
      });
    }
    
    res.json({
      success: true,
      data: memo
    });
  } catch (error) {
    console.error('メモ取得エラー:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch memo',
      error: error.message
    });
  }
});

// メモ更新
app.patch('/memos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.sub; // JWTのsubクレームからユーザーIDを取得
    const memos = await readData();
    const index = memos.findIndex(m => m.id === id && m.userId === userId);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Memo not found'
      });
    }
    
    memos[index] = {
      ...memos[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    const success = await writeData(memos);
    
    if (success) {
      res.json({
        success: true,
        data: memos[index],
        message: 'Memo updated successfully'
      });
    } else {
      throw new Error('Failed to update memo');
    }
  } catch (error) {
    console.error('メモ更新エラー:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update memo',
      error: error.message
    });
  }
});

// メモ削除
app.delete('/memos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.sub; // JWTのsubクレームからユーザーIDを取得
    const memos = await readData();
    const index = memos.findIndex(m => m.id === id && m.userId === userId);
    
    if (index === -1) {
      return res.status(404).json({
        success: false,
        message: 'Memo not found'
      });
    }
    
    memos.splice(index, 1);
    const success = await writeData(memos);
    
    if (success) {
      res.json({
        success: true,
        message: 'Memo deleted successfully'
      });
    } else {
      throw new Error('Failed to delete memo');
    }
  } catch (error) {
    console.error('メモ削除エラー:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete memo',
      error: error.message
    });
  }
});

// サーバー起動
async function startServer() {
  await initDataFile();
  app.listen(PORT, () => {
    console.log(`🚀 Simple Memo API Server is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📝 Memos endpoint: http://localhost:${PORT}/memos`);
  });
}

startServer().catch(console.error);
