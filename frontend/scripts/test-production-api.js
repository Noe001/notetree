#!/usr/bin/env node

/**
 * 本番環境でのAPI連携テストスクリプト
 * 
 * 使用方法:
 * node scripts/test-production-api.js
 */

const https = require('https');
const http = require('http');

// テスト設定
const TEST_CONFIG = {
  productionApiUrl: process.env.PRODUCTION_API_URL || 'https://api.notetree.com',
  timeout: 10000,
  retryAttempts: 3
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
    name: '認証エンドポイント',
    endpoint: '/auth/login',
    method: 'POST',
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'testpassword'
    }),
    expectedStatus: 401 // 無効な認証情報なので401が期待される
  },
  {
    name: 'メモ取得（認証なし）',
    endpoint: '/memos',
    method: 'GET',
    expectedStatus: 401 // 認証が必要
  }
];

class ApiTester {
  constructor(config) {
    this.config = config;
    this.results = [];
  }

  async makeRequest(testCase) {
    return new Promise((resolve, reject) => {
      const url = new URL(testCase.endpoint, this.config.productionApiUrl);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: testCase.method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'NoteTree-API-Tester/1.0'
        },
        timeout: this.config.timeout
      };

      if (testCase.body) {
        options.headers['Content-Length'] = Buffer.byteLength(testCase.body);
      }

      const req = client.request(options, (res) => {
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
    console.log(`   URL: ${this.config.productionApiUrl}${testCase.endpoint}`);
    console.log(`   メソッド: ${testCase.method}`);

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(testCase);
        
        const isSuccess = response.status === testCase.expectedStatus;
        const status = isSuccess ? '✅' : '❌';
        
        console.log(`   ${status} ステータス: ${response.status} (期待値: ${testCase.expectedStatus})`);
        
        if (!isSuccess) {
          console.log(`   📝 レスポンス:`, JSON.stringify(response.data, null, 2));
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
    console.log('🚀 本番環境API連携テスト開始');
    console.log(`📡 API URL: ${this.config.productionApiUrl}`);
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
      console.log('   ✅ すべてのテストが成功しました。本番APIとの連携は正常です。');
    } else if (passed > 0) {
      console.log('   ⚠️  一部のテストが失敗しました。API設定を確認してください。');
    } else {
      console.log('   ❌ すべてのテストが失敗しました。API接続に問題があります。');
    }
  }
}

// メイン実行
async function main() {
  const tester = new ApiTester(TEST_CONFIG);
  
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

module.exports = { ApiTester, TEST_CASES }; 