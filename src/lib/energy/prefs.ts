import { useSyncExternalStore } from "react";

export interface Prefs {
  theme: "light" | "dark";
  reducedMotion: boolean;
  units: "W" | "kW";
  commandMode: boolean;
}
const DEFAULT: Prefs = { theme: "light", reducedMotion: false, units: "kW", commandMode: false };
let prefs = DEFAULT;
const ls = new Set<() => void>();

export function loadPrefs() {
  try {
    const raw = localStorage.getItem("nexora-prefs");
    if (raw) prefs = { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  apply();
  ls.forEach((l) => l());
}
function apply() {
  const el = document.documentElement;
  el.classList.toggle("dark", prefs.theme === "dark");
  el.classList.toggle("reduce-motion", prefs.reducedMotion);
}
export function setPrefs(p: Partial<Prefs>) {
  prefs = { ...prefs, ...p };
  try { localStorage.setItem("nexora-prefs", JSON.stringify(prefs)); } catch { /* ignore */ }
  apply();
  ls.forEach((l) => l());
}
export function usePrefs() {
  return useSyncExternalStore((l) => (ls.add(l), () => ls.delete(l)), () => prefs, () => DEFAULT);
}
