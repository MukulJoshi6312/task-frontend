export type User = {
  _id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  avatarUrl?: string;
  lastLoginAt?: string | null;     // ISO date string from the server
  lastLoginDevice?: string;
};

export type Priority = "low" | "med" | "high";

export type Subtask = { t: string; d: boolean };

export type Task = {
  _id: string;
  title: string;
  note?: string;
  tag: string;
  priority: Priority;
  completed: boolean;
  due?: string | null;
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
};
