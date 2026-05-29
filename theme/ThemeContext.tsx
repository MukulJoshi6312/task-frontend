import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme } from "./theme";

type ThemeMode = "light" | "dark";
type Theme = typeof lightTheme | typeof darkTheme;

type ThemeContextValue = {
  theme: Theme;
  mode: ThemeMode;
  toggleTheme: () => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "taskly:theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    Appearance.getColorScheme() === "dark" ? "dark" : "light"
  );

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved === "dark" || saved === "light") setMode(saved);
    })();
  }, []);

  const toggleTheme = async () => {
    const next: ThemeMode = mode === "light" ? "dark" : "light";
    setMode(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  };

  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
};
