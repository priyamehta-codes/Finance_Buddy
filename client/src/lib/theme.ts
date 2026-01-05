export type ThemeMode = "light" | "dark";

const THEME_KEY = "fintrack-theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function applyTheme(mode: ThemeMode): ThemeMode {
  if (typeof document === "undefined") return mode;
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  localStorage.setItem(THEME_KEY, mode);
  return mode;
}

export function toggleTheme(mode: ThemeMode): ThemeMode {
  const next = mode === "light" ? "dark" : "light";
  return applyTheme(next);
}

export function initThemeFromStorage(): ThemeMode {
  const stored = getStoredTheme();
  return applyTheme(stored);
}
