import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Memo, Group } from "@/types/memo"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function filterMemosByGroup(memos: Memo[], groupId?: number): Memo[] {
  if (!groupId) return memos;
  return memos.filter(memo => memo.groupId === groupId);
}

export function getGroupName(groups: Group[], groupId?: number): string {
  if (!groupId) return "未分類";
  const group = groups.find(g => g.id === groupId);
  return group?.name || "不明";
}

export function formatGroupDate(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}
