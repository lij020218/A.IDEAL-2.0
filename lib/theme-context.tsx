"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const THEME_STORAGE_KEY = "aid-appearance";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" &&
        (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null)) ||
      null;
    if (stored === "light" || stored === "dark") {
      setThemeState(stored);
      applyThemeClass(stored);
    } else {
      // 기본값: 라이트 모드
      const defaultTheme: Theme = "light";
      setThemeState(defaultTheme);
      applyThemeClass(defaultTheme);
    }
    setHydrated(true);
  }, []);

  const applyThemeClass = (value: Theme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (value === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const setTheme = (value: Theme) => {
      setThemeState(value);
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_STORAGE_KEY, value);
      }
      applyThemeClass(value);
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      setTheme,
    }),
    [theme]
  );

  if (!hydrated) {
    return <>{children}</>;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}


