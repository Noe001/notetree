#!/usr/bin/env node

/**
 * ローカル環境でのAPI連携テストスクリプト
 * 
 * 使用方法:
 * node scripts/test-local-api.js
 */

const http = require('http');

// テスト設定
const TEST_CONFIG = {
  localApiUrl: 'http://localhost:3001',
  timeout: 5000,
  retryAttempts: 2
};

// テストケース
const TEST_CASES = [
  {
    name: 'ヘルスチェック',
    endpoint: '/health',
    method: 'GET',
    expectedStatus: 200
  },
  {
    name: 'メモ取得（認証なし）',
    endpoint: '/memos',
    method: 'GET',
    expectedStatus: 200 // ローカルAPIは認証なしでもアクセス可能
  },
  {
    name: 'メモ作成（認証なし）',
    endpoint: '/memos',
    method: 'POST',
    body: JSON.stringify({
      title: 'テストメモ',
      content: 'これはテスト用のメモです',
      tags: ['テスト']
    }),
    expectedStatus: 201
  }
];

class LocalApiTester {
  constructor(config) {
    this.config = config;
    this.results = [];
  }

  async makeRequest(testCase) {
    return new Promise((resolve, reject) => {
      const url = new URL(testCase.endpoint, this.config.localApiUrl);

      const options = {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname + url.search,
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NoteTree-Local-API-Tester/1.0'
        },
        timeout: this.config.timeout
      };

      if (testCase.body) {
        options.headers['Content-Length'] = Buffer.byteLength(testCase.body);
      }

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const responseData = data ? JSON.parse(data) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: responseData
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (testCase.body) {
        req.write(testCase.body);
      }

      req.end();
    });
  }

  async runTest(testCase) {
    console.log(`\n🧪 テスト実行中: ${testCase.name}`);
    console.log(`   URL: ${this.config.localApiUrl}${testCase.endpoint}`);
    console.log(`   メソッド: ${testCase.method}`);

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(testCase);
        
        const isSuccess = response.status === testCase.expectedStatus;
        const status = isSuccess ? '✅' : '❌';
        
        console.log(`   ${status} ステータス: ${response.status} (期待値: ${testCase.expectedStatus})`);
        
        if (isSuccess) {
          console.log(`   📝 レスポンス:`, JSON.stringify(response.data, null, 2));
        } else {
          console.log(`   📝 エラーレスポンス:`, JSON.stringify(response.data, null, 2));
        }

        this.results.push({
          testCase,
          success: isSuccess,
          response,
          attempt
        });

        return;
      } catch (error) {
        console.log(`   ⚠️  試行 ${attempt}/${this.config.retryAttempts} 失敗: ${error.message}`);
        
        if (attempt === this.config.retryAttempts) {
          this.results.push({
            testCase,
            success: false,
            error: error.message,
            attempt
          });
        } else {
          // 指数バックオフ
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }

  async runAllTests() {
    console.log('🚀 ローカル環境API連携テスト開始');
    console.log(`📡 API URL: ${this.config.localApiUrl}`);
    console.log(`⏱️  タイムアウト: ${this.config.timeout}ms`);
    console.log(`🔄 リトライ回数: ${this.config.retryAttempts}`);

    for (const testCase of TEST_CASES) {
      await this.runTest(testCase);
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 テスト結果サマリー');
    console.log('='.repeat(50));

    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;

    console.log(`総テスト数: ${total}`);
    console.log(`✅ 成功: ${passed}`);
    console.log(`❌ 失敗: ${failed}`);
    console.log(`📈 成功率: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed > 0) {
      console.log('\n❌ 失敗したテスト:');
      this.results
        .filter(r => !r.success)
        .forEach(result => {
          console.log(`   - ${result.testCase.name}: ${result.error || `ステータス ${result.response?.status}`}`);
        });
    }

    console.log('\n🎯 推奨アクション:');
    if (passed === total) {
      console.log('   ✅ すべてのテストが成功しました。ローカルAPIとの連携は正常です。');
      console.log('   🚀 本番環境へのデプロイ準備が完了しました。');
    } else if (passed > 0) {
      console.log('   ⚠️  一部のテストが失敗しました。API設定を確認してください。');
    } else {
      console.log('   ❌ すべてのテストが失敗しました。ローカルAPIサーバーが起動しているか確認してください。');
    }
  }
}

// メイン実行
async function main() {
  const tester = new LocalApiTester(TEST_CONFIG);
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { LocalApiTester, TEST_CASES }; 