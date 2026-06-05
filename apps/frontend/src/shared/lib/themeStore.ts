import { create } from "zustand";
import { THEME_STORAGE_KEY } from "@/shared/lib/constants";

export type Theme = "light" | "dark";

// Reads the theme already applied to <html> by the inline script in index.html,
// so the store and the DOM start in sync.
function getInitialTheme(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem(THEME_STORAGE_KEY, next);
    set({ theme: next });
  },
}));
