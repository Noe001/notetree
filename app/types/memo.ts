export type Group = {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type Memo = {
  id: number;
  title: string;
  content: string;
  tags: string[];
  groupId?: number;
  updatedAt: string;
  createdAt: string;
  isPrivate: boolean;
};
