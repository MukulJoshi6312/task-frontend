import client from "./client";
import type { Category } from "../types";

type ListResponse = { success: boolean; data: Category[] };
type ItemResponse = { success: boolean; data: Category };

export const fetchCategories = (): Promise<Category[]> =>
  client.get<ListResponse>("/category").then((r) => r.data.data);

export const createCategory = (name: string, color: string): Promise<Category> =>
  client.post<ItemResponse>("/category", { name, color }).then((r) => r.data.data);

export const updateCategory = (id: string, name: string, color: string): Promise<Category> =>
  client.put<ItemResponse>(`/category/${id}`, { name, color }).then((r) => r.data.data);

export const deleteCategory = (id: string): Promise<void> =>
  client.delete(`/category/${id}`).then(() => undefined);
