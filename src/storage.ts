import type { Project } from "./types";

const KEY = "scripter.projects.v1";
const THEME_KEY = "scripter.theme";
const PREFS_KEY = "scripter.prefs.v1";

export interface Prefs {
  theme: "light" | "dark";
  lastProjectId: string | null;
}

export function loadProjects(): Project[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Project[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p) => p && typeof p.id === "string" && Array.isArray(p.elements));
  } catch {
    return [];
  }
}

export function saveProjects(projects: Project[]): void {
  localStorage.setItem(KEY, JSON.stringify(projects));
}

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw) as Prefs;
  } catch {
    /* ignore */
  }
  const legacy = localStorage.getItem(THEME_KEY);
  return {
    theme: legacy === "dark" ? "dark" : "light",
    lastProjectId: null,
  };
}

export function savePrefs(prefs: Prefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}
