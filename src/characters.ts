import { isCharacterCue, normalizeCharacterName, sceneIndexForElement } from "./fountain";
import type { CharacterProfile, ScriptElement } from "./types";

function displayName(cue: string): string {
  return normalizeCharacterName(cue).replace(/\s+\(.*\)$/, "").trim();
}

function sceneLabel(elements: ScriptElement[], sceneId: string, fallback: string): string {
  const el = elements.find((e) => e.id === sceneId);
  if (!el) return fallback;
  if (el.type === "scene_heading") return el.text.trim() || "Untitled scene";
  return el.text.trim() || fallback;
}

function nearestScene(elements: ScriptElement[], fromIndex: number): ScriptElement | null {
  for (let i = fromIndex; i >= 0; i--) {
    if (elements[i].type === "scene_heading") return elements[i];
  }
  for (const el of elements) {
    if (el.type === "scene_heading") return el;
  }
  return null;
}

export function extractCharacters(elements: ScriptElement[]): CharacterProfile[] {
  const map = new Map<string, CharacterProfile>();

  elements.forEach((el, index) => {
    if (el.type !== "character") return;
    const raw = el.text.trim();
    if (!raw || !isCharacterCue(raw)) return;
    const name = displayName(raw);
    if (!name) return;

    const scene = nearestScene(elements, index);
    const sceneId = scene?.id ?? el.id;
    const label = sceneLabel(elements, sceneId, "Opening");

    let profile = map.get(name);
    if (!profile) {
      profile = {
        name,
        appearances: 0,
        scenes: [],
        hits: [],
        insight: "",
      };
      map.set(name, profile);
    }
    profile.appearances += 1;
    profile.hits.push({ elementId: el.id, sceneId, sceneLabel: label });
    if (!profile.scenes.some((s) => s.id === sceneId)) {
      profile.scenes.push({ id: sceneId, label });
    }
  });

  const sceneHeadings = elements.filter((el) => el.type === "scene_heading");
  const totalScenes = Math.max(sceneHeadings.length, 1);
  const profiles = [...map.values()].sort((a, b) => b.appearances - a.appearances);
  const totalCues = profiles.reduce((sum, p) => sum + p.appearances, 0) || 1;

  for (const profile of profiles) {
    profile.insight = flatArcInsight(profile, elements, totalScenes, totalCues);
  }

  return profiles;
}

function firstLastSceneSpan(profile: CharacterProfile, elements: ScriptElement[]): {
  firstRatio: number;
  lastRatio: number;
} {
  const headings = elements
    .map((el, i) => ({ el, i }))
    .filter(({ el }) => el.type === "scene_heading");
  if (headings.length === 0) return { firstRatio: 0, lastRatio: 1 };

  const indexes = profile.hits.map((hit) => {
    const at = sceneIndexForElement(elements, hit.elementId);
    const pos = headings.findIndex(({ i }) => i === at);
    return pos < 0 ? 0 : pos;
  });
  const first = Math.min(...indexes);
  const last = Math.max(...indexes);
  return {
    firstRatio: first / headings.length,
    lastRatio: (last + 1) / headings.length,
  };
}

export function flatArcInsight(
  profile: CharacterProfile,
  elements: ScriptElement[],
  totalScenes: number,
  totalCues: number,
): string {
  const share = profile.appearances / totalCues;
  const sceneShare = profile.scenes.length / totalScenes;
  const { firstRatio, lastRatio } = firstLastSceneSpan(profile, elements);
  const spansStory = firstRatio <= 0.3 && lastRatio >= 0.7 && profile.scenes.length >= 3;

  if (profile.appearances === 1) {
    return `${profile.name} has one cue so far — too soon to read an arc. If they hold a flat-arc truth, this first appearance should already show what they believe.`;
  }
  if (spansStory) {
    return `${profile.name} is present from early pages through the back half. A flat-arc character usually keeps the same conviction while someone else shifts — check that their last cue still sounds like their first.`;
  }
  if (firstRatio >= 0.45 && lastRatio <= 0.75) {
    return `${profile.name} is clustered in the middle. If they are a catalyst, their job may be to press the protagonist, then step back without needing a personal turn.`;
  }
  if (share >= 0.35 && profile.scenes.length >= 2) {
    return `${profile.name} holds a large share of the conversation. Watch they do not start winning their own argument — flat-arc figures change others more than they change themselves.`;
  }
  if (sceneShare <= 0.25 && profile.appearances >= 2) {
    return `${profile.name} appears in a tight pocket of scenes. That can be enough for a flat-arc presence: one clear belief, applied, then gone.`;
  }
  return `${profile.name} is taking shape across ${profile.scenes.length} scene${profile.scenes.length === 1 ? "" : "s"}. If you want a flat arc, keep their want stable and let the people around them move.`;
}
