/**
 * MCPサーバーのブラウザ操作に関するテスト実装例
 * 実際にMCPサーバーのツールを使用した場合の実装方法を示す
 */

// MCPサーバーのツールを使用した場合のテスト実装例
// 注意: 実際のMCPサーバーのツール呼び出しはuse_mcp_toolを使用する

/**
 * MCPサーバーを使用したブラウザ操作のテスト実装例
 */
export class MCPBrowserTestExample {
  /**
   * ページナビゲーションのテスト
   * MCPサーバーのbrowser_navigateツールを使用
   */
  async testNavigation() {
    // 実際のMCPサーバーのツール呼び出し例:
    // await use_mcp_tool({
    //   server_name: "github.com/executeautomation/mcp-playwright",
    //   tool_name: "browser_navigate",
    //   arguments: {
    //     url: "http://localhost:5173"
    //   }
    // });
    
    console.log('MCPサーバーを使用してページにナビゲートしました');
    
    // ナビゲーション後の状態確認
    // await use_mcp_tool({
    //   server_name: "github.com/executeautomation/mcp-playwright",
    //   tool_name: "browser_snapshot",
    //   arguments: {}
    // });
  }

  /**
   * 要素クリックのテスト
   * MCPサーバーのbrowser_clickツールを使用
   */
  async testElementClick() {
    // 実際のMCPサーバーのツール呼び出し例:
    // await use_mcp_tool({
    //   server_name: "github.com/executeautomation/mcp-playwright",
    //   tool_name: "browser_snapshot",
    //   arguments: {}
    // });
    
    // snapshotから要素を特定してクリック
    // await use_mcp_tool({
    //   server_name: "github.com/executeautomation/mcp-playwright",
    //   tool_name: "browser_click",
    //   arguments: {
    //     element: "新しいメモを作成ボタン",
    //     ref: "button-create-memo"
    //   }
    // });
    
    console.log('MCPサーバーを使用して要素をクリックしました');
  }

  /**
   * テキスト入力のテスト
   * MCPサーバーのbrowser_typeツールを使用
   */
  async testTextInput() {
    // 実際のMCPサーバーのツール呼び出し例:
    // await use_mcp_tool({
    //   server_name: "github.com/executeautomation/mcp-playwright",
    //   tool_name: "browser_type",
    //   arguments: {
    //     element: "タイトル入力フィールド",
    //     ref: "input-title",
    //     text: "MCPテストメモ"
    //   }
    // });
    
    console.log('MCPサーバーを使用してテキストを入力しました');
  }

  /**
   * ページリロードのテスト
   * MCPサーバーのbrowser_navigateまたは関連ツールを使用
   */
  async testPageReload() {
    // 実際のMCPサーバーのツール呼び出し例:
    // await use_mcp_tool({
    //   server_name: "github.com/executeautomation/mcp-playwright",
    //   tool_name: "browser_navigate",
    //   arguments: {
    //     url: "http://localhost:5173"
    //   }
    // });
    
    console.log('MCPサーバーを使用してページをリロードしました');
  }
}

/**
 * MCPサーバーを使用したテストでの主要な問題点と解決方法
 */

/**
 * 1. ブラウザインスタンスの競合問題
 * 
 * 問題:
 * - 複数のテストが同時にブラウザインスタンスを使用しようとした場合に発生
 * - エラーメッセージ: "Browser is already in use for /home/noe/.cache/ms-playwright/mcp-chromium-profile, use --isolated to run multiple instances of the same browser"
 * 
 * 解決方法:
 * - 各テストの前にブラウザを適切に管理する
 * - --isolatedオプションを使用して複数のインスタンスを実行
 * - テスト終了後にブラウザを明示的に閉じる
 * 
 * 設定例:
 * ```json
 * {
 *   "command": "npx",
 *   "args": [
 *     "-y",
 *     "@playwright/mcp@latest",
 *     "--browser=chromium",
 *     "--viewport-size=1920,1080",
 *     "--isolated"
 *   ]
 * }
 * ```
 */

/**
 * 2. 要素の特定方法の違い
 * 
 * 問題:
 * - PlaywrightのセレクタとMCPサーバーの要素特定方法の違い
 * - snapshotからの要素特定が複雑
 * 
 * 解決方法:
 * - browser_snapshotを使用してページのアクセシビリティスナップショットを取得
 * - スナップショットから適切な要素のrefを特定
 * - browser_clickやbrowser_typeなどのツールでrefを使用
 * 
 * 実装例:
 * ```typescript
 * // スナップショットを取得
 * const snapshot = await use_mcp_tool({
 *   server_name: "github.com/executeautomation/mcp-playwright",
 *   tool_name: "browser_snapshot",
 *   arguments: {}
 * });
 * 
 * // スナップショットから要素を特定して操作
 * await use_mcp_tool({
 *   server_name: "github.com/executeautomation/mcp-playwright",
 *   tool_name: "browser_click",
 *   arguments: {
 *     element: "メモ作成ボタン",
 *     ref: snapshot.findButton("新しいメモを作成").ref
 *   }
 * });
 * ```
 */

/**
 * 3. 非同期処理のタイミング問題
 * 
 * 問題:
 * - ページ読み込みや要素表示のタイミングによってテストが失敗
 * - MCPサーバーの操作とページ状態の同期が難しい
 * 
 * 解決方法:
 * - browser_wait_forを使用して要素の表示を待機
 * - 適切なタイムアウト時間を設定
 * - ページ遷移後の状態確認に待機時間を設ける
 * 
 * 実装例:
 * ```typescript
 * // テキストが表示されるまで待機
 * await use_mcp_tool({
 *   server_name: "github.com/executeautomation/mcp-playwright",
 *   tool_name: "browser_wait_for",
 *   arguments: {
 *     text: "メモが作成されました",
 *     time: 5
 *   }
 * });
 * ```
 */

/**
 * 4. ページ操作の適切な方法
 * 
 * 問題:
 * - ページリロードやナビゲーションの適切な方法が不明確
 * - MCPサーバーのツールを使用した場合のページ操作の違い
 * 
 * 解決方法:
 * - browser_navigateを使用してページ遷移
 * - browser_reloadを使用してページリロード（利用可能な場合）
 * - ページ操作後の状態確認に適切な待機時間を設ける
 * 
 * 実装例:
 * ```typescript
 * // ページリロード
 * await use_mcp_tool({
 *   server_name: "github.com/executeautomation/mcp-playwright",
 *   tool_name: "browser_navigate",
 *   arguments: {
 *     url: "http://localhost:5173/current-page"
 *   }
 * });
 * 
 * // ページ遷移後の状態確認
 * await use_mcp_tool({
 *   server_name: "github.com/executeautomation/mcp-playwright",
 *   tool_name: "browser_wait_for",
 *   arguments: {
 *     text: "ページタイトル",
 *     time: 3
 *   }
 * });
 * ```
 */

/**
 * 5. エラーハンドリング
 * 
 * 問題:
 * - MCPサーバーのツール呼び出し時のエラー処理が不十分
 * - テスト失敗時のデバッグ情報が不足
 * 
 * 解決方法:
 * - try-catchを使用してエラーを適切に処理
 * - エラー発生時にスクリーンショットを取得してデバッグ情報を保存
 * - 詳細なエラーメッセージをログに出力
 * 
 * 実装例:
 * ```typescript
 * try {
 *   await use_mcp_tool({
 *     server_name: "github.com/executeautomation/mcp-playwright",
 *     tool_name: "browser_click",
 *     arguments: {
 *       element: "メモ作成ボタン",
 *       ref: "button-create-memo"
 *     }
 *   });
 * } catch (error) {
 *   // エラー発生時にスクリーンショットを取得
 *   await use_mcp_tool({
 *     server_name: "github.com/executeautomation/mcp-playwright",
 *     tool_name: "browser_take_screenshot",
 *     arguments: {
 *       filename: "error-screenshot.png"
 *     }
 *   });
 *   throw new Error(`要素クリックに失敗しました: ${error.message}`);
 * }
 * ```
 */

/**
 * MCPサーバーを使用したテストのベストプラクティス
 * 
 * 1. テスト構造:
 *    - 各テストの前にブラウザ状態をクリーンアップ
 *    - テスト終了後にブラウザを適切に閉じる
 *    - テストデータの適切なセットアップとティアダウン
 * 
 * 2. 要素操作:
 *    - browser_snapshotを使用して要素の状態を確認
 *    - 明確な要素識別子を使用
 *    - 要素が表示されるまで待機
 * 
 * 3. エラーハンドリング:
 *    - すべてのMCPツール呼び出しをtry-catchで囲む
 *    - 詳細なログ出力
 *    - 失敗時のスクリーンショット取得
 * 
 * 4. パフォーマンス:
 *    - 不要な待機時間を避ける
 *    - テストの並列実行を考慮
 *    - リソースの適切な管理
 */
