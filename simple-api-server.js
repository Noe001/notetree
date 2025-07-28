const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'memos-data.json');

// ミドルウェア
app.use(cors());
app.use(express.json());

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
app.get('/memos/search', async (req, res) => {
  try {
    const { q: query, userId } = req.query;
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const memos = await readData();
    let filteredMemos = memos;
    
    if (userId) {
      filteredMemos = filteredMemos.filter(memo => memo.userId === userId);
    }
    
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
app.get('/memos', async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    const memos = await readData();
    
    let filteredMemos = memos;
    if (userId) {
      filteredMemos = filteredMemos.filter(memo => memo.userId === userId);
    }
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
app.post('/memos', async (req, res) => {
  try {
    const { title, content, tags, isPrivate } = req.body;
    const memos = await readData();
    
    const newMemo = {
      id: `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title || '無題',
      content: content || '',
      tags: tags || [],
      isPrivate: isPrivate || false,
      userId: 'current_user', // 実際の実装では認証から取得
      groupId: null,
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
app.get('/memos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memos = await readData();
    const memo = memos.find(m => m.id === id);
    
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
app.patch('/memos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const memos = await readData();
    const index = memos.findIndex(m => m.id === id);
    
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
app.delete('/memos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const memos = await readData();
    const index = memos.findIndex(m => m.id === id);
    
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
