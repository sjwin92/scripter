export type ProjectKind = "feature" | "tv";
export type TvDuration = "hour" | "half-hour";

export type ElementType =
  | "scene_heading"
  | "action"
  | "character"
  | "parenthetical"
  | "dialogue"
  | "transition"
  | "act_break";

export interface ScriptElement {
  id: string;
  type: ElementType;
  text: string;
}

export interface TitlePage {
  title: string;
  writtenBy: string;
  contact: string;
  showName: string;
  episodeTitle: string;
  episodeNumber: string;
  duration: TvDuration;
}

export interface Project {
  id: string;
  kind: ProjectKind;
  titlePage: TitlePage;
  elements: ScriptElement[];
  createdAt: number;
  updatedAt: number;
}

export interface CharacterHit {
  elementId: string;
  sceneId: string;
  sceneLabel: string;
}

export interface CharacterProfile {
  name: string;
  appearances: number;
  scenes: { id: string; label: string }[];
  hits: CharacterHit[];
  insight: string;
}

export type AiAction =
  | "next-dialogue"
  | "rewrite-tone"
  | "tighten"
  | "more-visual"
  | "logline"
  | "synopsis"
  | "structure"
  | "deepen-character";

export interface AiSuggestion {
  action: AiAction;
  title: string;
  body: string;
  insertable: boolean;
  source: "live" | "demo";
}

export type SaveStatus = "saved" | "saving" | "idle";

export const ELEMENT_LABELS: Record<ElementType, string> = {
  scene_heading: "Slugline",
  action: "Action",
  character: "Character",
  parenthetical: "Parenthetical",
  dialogue: "Dialogue",
  transition: "Transition",
  act_break: "Act break",
};

export const ELEMENT_CYCLE: ElementType[] = [
  "scene_heading",
  "action",
  "character",
  "parenthetical",
  "dialogue",
  "transition",
  "act_break",
];
