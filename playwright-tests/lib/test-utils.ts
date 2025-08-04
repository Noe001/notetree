import { Page, expect } from '@playwright/test';

/**
 * リロード操作とデータ保存確認のための汎用テストユーティリティ
 */

// メモデータの型定義
export interface MemoData {
  title: string;
  content: string;
  tags?: string[];
}

// グループデータの型定義
export interface GroupData {
  name: string;
  description: string;
}

// データタイプの列挙型
export type DataType = 'memo' | 'group';

/**
 * ページをリロードするユーティリティ関数
 * @param page PlaywrightのPageオブジェクト
 */
export async function reloadPage(page: Page): Promise<void> {
  await page.reload();
}

/**
 * メモデータが正しく保存されているか確認する関数
 * @param page PlaywrightのPageオブジェクト
 * @param memoData 確認するメモデータ
 */
export async function assertMemoSaved(page: Page, memoData: MemoData): Promise<void> {
  // メモが一覧に表示されていることを確認
  await expect(page.getByText(memoData.title)).toBeVisible();
  
  // メモの詳細が正しく保存されていることを確認
  await page.getByText(memoData.title).click();
  await expect(page.getByText(memoData.content)).toBeVisible();
  
  // タグが正しく保存されていることを確認（タグがある場合）
  if (memoData.tags && memoData.tags.length > 0) {
    for (const tag of memoData.tags) {
      await expect(page.getByText(tag)).toBeVisible();
    }
  }
}

/**
 * グループデータが正しく保存されているか確認する関数
 * @param page PlaywrightのPageオブジェクト
 * @param groupData 確認するグループデータ
 */
export async function assertGroupSaved(page: Page, groupData: GroupData): Promise<void> {
  // グループが一覧に表示されていることを確認
  await expect(page.getByText(groupData.name)).toBeVisible();
  
  // グループの詳細が正しく保存されていることを確認
  await expect(page.getByText(groupData.description)).toBeVisible();
}

/**
 * データが保存されていないことを確認する関数
 * @param page PlaywrightのPageオブジェクト
 * @param data 確認するデータ（タイトルまたは名前）
 */
export async function assertDataNotSaved(page: Page, data: string): Promise<void> {
  // データが表示されていないことを確認
  await expect(page.getByText(data)).not.toBeVisible();
}

/**
 * リロード後にデータが正しく保存されているか確認する汎用関数
 * @param page PlaywrightのPageオブジェクト
 * @param dataType データタイプ（'memo' または 'group'）
 * @param data 確認するデータ
 */
export async function reloadAndAssertSaved(
  page: Page, 
  dataType: DataType, 
  data: MemoData | GroupData
): Promise<void> {
  // リロード操作
  await reloadPage(page);
  
  // データタイプに応じて適切なアサーションを実行
  if (dataType === 'memo' && isMemoData(data)) {
    await assertMemoSaved(page, data);
  } else if (dataType === 'group' && isGroupData(data)) {
    await assertGroupSaved(page, data);
  } else {
    throw new Error(`Unsupported data type or data mismatch: ${dataType}`);
  }
}

/**
 * リロード後にデータが保存されていないことを確認する関数
 * @param page PlaywrightのPageオブジェクト
 * @param data 確認するデータ（タイトルまたは名前）
 */
export async function reloadAndAssertNotSaved(page: Page, data: string): Promise<void> {
  // リロード操作
  await reloadPage(page);
  
  // データが保存されていないことを確認
  await assertDataNotSaved(page, data);
}

// 型ガード関数
function isMemoData(data: any): data is MemoData {
  return typeof data === 'object' && 'title' in data && 'content' in data;
}

function isGroupData(data: any): data is GroupData {
  return typeof data === 'object' && 'name' in data && 'description' in data;
}