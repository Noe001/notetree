import { Memo, Group } from "@/types/memo";

export const mockGroups: Group[] = [
  {
    id: 1,
    name: "仕事",
    description: "仕事関連のメモ",
    createdAt: "2025-07-01T00:00:00+09:00",
    updatedAt: "2025-07-20T00:00:00+09:00"
  },
  {
    id: 2,
    name: "個人",
    description: "プライベートなメモ",
    createdAt: "2025-07-01T00:00:00+09:00",
    updatedAt: "2025-07-20T00:00:00+09:00"
  }
];

export const mockMemos: Memo[] = [
  {
    id: 38,
    title: "新しいアイデア",
    content: "新しいプロジェクトのアイデアについて...",
    tags: ["アイデア"],
    groupId: 1,
    updatedAt: "2025-07-16T23:25:26+09:00",
    createdAt: "2025-07-15T10:00:00+09:00",
    isPrivate: true
  },
  {
    id: 36,
    title: "会議の議事録",
    content: "今日の定例会議の議事録です。",
    tags: ["仕事"],
    groupId: 1,
    updatedAt: "2025-07-16T22:29:37+09:00",
    createdAt: "2025-07-16T14:00:00+09:00",
    isPrivate: true
  },
  {
    id: 37,
    title: "読書リスト",
    content: "次に読みたい本の一覧を作成しました。",
    tags: ["読書", "趣味"],
    groupId: 2,
    updatedAt: "2025-07-16T22:26:30+09:00",
    createdAt: "2025-07-14T18:30:00+09:00",
    isPrivate: false
  },
  {
    id: 35,
    title: "週末の計画",
    content: "週末の予定を立てる。",
    tags: ["趣味"],
    groupId: 2,
    updatedAt: "2025-07-16T22:23:18+09:00",
    createdAt: "2025-07-16T22:00:00+09:00",
    isPrivate: true
  },
];

export const allTags = ["アイデア", "仕事", "読書", "趣味"];
