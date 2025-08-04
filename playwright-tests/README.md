# Playwrightテストコード実装ガイド

このドキュメントは、各機能のテストシナリオに基づいたPlaywrightテストコードの実装方法について説明します。

## ディレクトリ構造

```
playwright-tests/
├── memo/
│   ├── create-memo.test.ts
│   ├── edit-memo.test.ts
│   ├── delete-memo.test.ts
│   ├── view-memo.test.ts
│   └── tag-memo.test.ts
├── group/
│   ├── create-group.test.ts
│   ├── edit-group.test.ts
│   ├── delete-group.test.ts
│   ├── join-group.test.ts
│   ├── invite-member.test.ts
│   └── manage-member.test.ts
├── auth/
│   ├── signup.test.ts
│   ├── login.test.ts
│   ├── logout.test.ts
│   └── session.test.ts
├── search/
│   ├── search-memo.test.ts
│   ├── search-tag.test.ts
│   └── filter-memo.test.ts
├── data/
│   ├── export-data.test.ts
│   └── import-data.test.ts
└── realtime/
    ├── realtime-edit.test.ts
    └── user-presence.test.ts
```

## 実装手順

1. 各テストシナリオに対応するテストファイルを作成
2. テストファイル内に、シナリオの前提条件、実行手順、期待結果を記述
3. 各操作後にリロードを行い、データが正しく保存されているかを確認
4. 既存のテストコード（backend/test/、frontend/__tests__/）を参考に実装

## テスト実行方法

```bash
# すべてのテストを実行
npx playwright test

# 特定のテストファイルを実行
npx playwright test memo/create-memo.test.ts

# ヘッドレスモードで実行
npx playwright test --headed