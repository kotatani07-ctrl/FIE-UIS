import { useCallback, useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

function readStoredPref(): ThemePref {
  if (typeof window === "undefined") {
    return "system";
  }
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

function systemPrefersDark(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia(DARK_QUERY).matches;
}

function resolveTheme(pref: ThemePref): ResolvedTheme {
  if (pref === "system") {
    return systemPrefersDark() ? "dark" : "light";
  }
  return pref;
}

/**
 * Tema tri-state (light | dark | system) dengan preferensi tersimpan.
 * Hanya mengikuti perubahan OS saat preferensi bernilai "system" (docs/03 §7).
 */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readStoredPref);

  useEffect(() => {
    document.documentElement.dataset.theme = resolveTheme(pref);
  }, [pref]);

  useEffect(() => {
    if (pref !== "system" || typeof window.matchMedia !== "function") {
      return;
    }
    const media = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      document.documentElement.dataset.theme = resolveTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [pref]);

  const setThemePref = useCallback((next: ThemePref) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setPref(next);
  }, []);

  return { pref, setThemePref };
}
