export type Category = {
  _id: string;
  name: string;
  color: string;
};

export type Notification = {
  _id: string;
  type: string;        // "welcome" | "task_completed" | "info" | ...
  title: string;
  body: string;
  taskId?: string | null;
  read: boolean;
  createdAt: string;
};

export type TaskStats = {
  total: number;
  completed: number;
  active: number;
  completionRate: number;        // 0-100
  completedToday: number;
  completedThisWeek: number;
  dueToday: number;
  memberSince: string;
};

export type Plan = "free" | "premium";

export type User = {
  _id: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  avatarUrl?: string;
  plan?: Plan;
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
