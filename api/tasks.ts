import client from "./client";
import type { Task } from "../types";

export type CreateTaskInput = {
  title: string;
  note?: string;
  tag?: string;
  priority?: Task["priority"];
  due?: string | null;
  subtasks?: Task["subtasks"];
};

export type UpdateTaskInput = Partial<
  Omit<Task, "_id" | "createdAt" | "updatedAt">
>;

type ListResponse = { success: boolean; count: number; data: Task[] };
type ItemResponse = { success: boolean; data: Task };

export const fetchTasks = (): Promise<Task[]> =>
  client.get<ListResponse>("/task").then((r) => r.data.data);

export const fetchTask = (id: string): Promise<Task> =>
  client.get<ItemResponse>(`/task/${id}`).then((r) => r.data.data);

export const createTask = (data: CreateTaskInput): Promise<Task> =>
  client.post<ItemResponse>("/task", data).then((r) => r.data.data);

export const updateTask = (id: string, data: UpdateTaskInput): Promise<Task> =>
  client.put<ItemResponse>(`/task/${id}`, data).then((r) => r.data.data);

export const deleteTask = (
  id: string
): Promise<{ success: boolean; id: string }> =>
  client.delete(`/task/${id}`).then((r) => r.data);
