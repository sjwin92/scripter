import { estimatePageCount } from "./pagination";
import type { Project, ScriptElement } from "./types";

export interface StructureHint {
  label: string;
  detail: string;
}

export const FEATURE_ACTS = [
  { id: "act1", label: "Act I · Setup", pages: "1–25", cue: "Ordinary world, inciting incident, break into two." },
  { id: "act2", label: "Act II · Confrontation", pages: "25–85", cue: "Midpoint turn; raise the cost; no easy out." },
  { id: "act3", label: "Act III · Resolution", pages: "85–110", cue: "Climax and the new normal." },
] as const;

export const TV_HOUR_BEATS = ["TEASER", "ACT ONE", "ACT TWO", "ACT THREE", "ACT FOUR", "ACT FIVE", "TAG"] as const;
export const TV_HALF_BEATS = ["TEASER", "ACT ONE", "ACT TWO", "TAG"] as const;

export function tvBeats(duration: "hour" | "half-hour"): readonly string[] {
  return duration === "hour" ? TV_HOUR_BEATS : TV_HALF_BEATS;
}

export function presentActBreaks(elements: ScriptElement[]): string[] {
  return elements
    .filter((el) => el.type === "act_break")
    .map((el) => el.text.trim().toUpperCase());
}

export function missingTvBeats(project: Project): string[] {
  if (project.kind !== "tv") return [];
  const have = new Set(presentActBreaks(project.elements));
  return tvBeats(project.titlePage.duration).filter((beat) => !have.has(beat));
}

export function structureHint(project: Project): StructureHint {
  const pages = estimatePageCount(project.elements);
  if (project.kind === "feature") {
    if (pages <= 25) {
      return {
        label: "Act I · Setup",
        detail: `About ${pages} page${pages === 1 ? "" : "s"}. Features often turn into Act II near page 25.`,
      };
    }
    if (pages <= 85) {
      return {
        label: "Act II · Confrontation",
        detail: `About ${pages} pages. Midpoint usually sits near page 55; the pinch comes before the break into three.`,
      };
    }
    return {
      label: "Act III · Resolution",
      detail: `About ${pages} pages. Drive toward a climax that answers Act I, then land the new normal.`,
    };
  }

  const beats = tvBeats(project.titlePage.duration);
  const present = presentActBreaks(project.elements);
  const current = [...present].reverse().find((b) => beats.includes(b as (typeof beats)[number]));
  const duration = project.titlePage.duration === "hour" ? "hour" : "half-hour";
  return {
    label: current ?? "Teaser + act breaks",
    detail:
      duration === "hour"
        ? `Hour drama: teaser, four or five acts, optional tag. ${pages} page${pages === 1 ? "" : "s"} so far.`
        : `Half-hour: teaser, two (sometimes three) acts, tag. ${pages} page${pages === 1 ? "" : "s"} so far.`,
  };
}

export function displayTitle(project: Project): string {
  if (project.kind === "tv") {
    const show = project.titlePage.showName.trim() || "Untitled show";
    const ep = project.titlePage.episodeTitle.trim();
    return ep ? `${show} — ${ep}` : show;
  }
  return project.titlePage.title.trim() || "Untitled";
}
