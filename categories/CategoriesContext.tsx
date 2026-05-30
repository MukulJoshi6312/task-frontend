import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  fetchCategories,
  createCategory as apiCreate,
  updateCategory as apiUpdate,
  deleteCategory as apiDelete,
} from "../api/categories";
import { useAuth } from "../auth/AuthContext";
import type { Category } from "../types";

// Swatches offered when creating/editing a category.
export const CATEGORY_PALETTE = [
  "#4F7CFF", "#9B6BFF", "#3FB984", "#FF6B4A",
  "#F2A33C", "#EC4899", "#06B6D4", "#8B5CF6",
];

// Used when a task's tag no longer matches any category (e.g. it was deleted).
const FALLBACK_COLOR = "#9AA0AA";

type CategoriesContextValue = {
  categories: Category[];
  loading: boolean;
  reload: () => Promise<void>;
  addCategory: (name: string, color: string) => Promise<void>;
  editCategory: (id: string, name: string, color: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  colorFor: (name?: string) => string;
};

const CategoriesContext = createContext<CategoriesContextValue | undefined>(undefined);

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setCategories(await fetchCategories());
    } catch (e) {
      console.error("[Categories] load failed:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load when the user logs in; clear when they log out.
  useEffect(() => {
    if (user) reload();
    else setCategories([]);
  }, [user, reload]);

  const addCategory = useCallback(async (name: string, color: string) => {
    const created = await apiCreate(name, color);
    setCategories((prev) => [...prev, created]);
  }, []);

  const editCategory = useCallback(async (id: string, name: string, color: string) => {
    const updated = await apiUpdate(id, name, color);
    setCategories((prev) => prev.map((c) => (c._id === id ? updated : c)));
  }, []);

  const removeCategory = useCallback(async (id: string) => {
    await apiDelete(id);
    setCategories((prev) => prev.filter((c) => c._id !== id));
  }, []);

  const colorFor = useCallback(
    (name?: string) => categories.find((c) => c.name === name)?.color ?? FALLBACK_COLOR,
    [categories]
  );

  return (
    <CategoriesContext.Provider
      value={{ categories, loading, reload, addCategory, editCategory, removeCategory, colorFor }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export const useCategories = () => {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used inside <CategoriesProvider>");
  return ctx;
};
