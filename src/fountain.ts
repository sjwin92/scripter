import { uid } from "./id";
import type { ElementType, ScriptElement } from "./types";

const SCENE_START =
  /^(INT\.|EXT\.|EST\.|I\/E\.|INT\/EXT\.|INT\s|EXT\s|EST\s|I\/E\s|INT\.\/EXT\.)/i;

const TRANSITION =
  /^(FADE IN:|FADE OUT\.?|FADE TO:|CUT TO:|SMASH CUT:|MATCH CUT:|DISSOLVE TO:|JUMP CUT:|TIME CUT:|WIPE TO:|CUT TO BLACK\.?|FADE TO BLACK\.?)$/i;

const ACT_BREAK =
  /^(TEASER|TAG|COLD OPEN|END OF (TEASER|TAG|SHOW)|END OF ACT\s+\w+|ACT\s+(ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|\d+|[IVX]+))$/i;

const CHARACTER_EXT = /\s+(\((V\.O\.|O\.S\.|O\.C\.|CONT'D|CON'T|PRE-LAP|FILTERED|PHONE|ON TV|ON RADIO)\))\s*$/i;

export function isSceneHeading(text: string): boolean {
  const line = text.trim();
  if (!line) return false;
  if (line.startsWith(".") && line.length > 1 && !line.startsWith("..")) return true;
  return SCENE_START.test(line);
}

export function isTransition(text: string): boolean {
  const line = text.trim();
  if (TRANSITION.test(line)) return true;
  if (line.startsWith(">") && /TO:\s*$/i.test(line)) return true;
  return /^[A-Z0-9 .'-]+TO:$/.test(line);
}

export function isActBreak(text: string): boolean {
  return ACT_BREAK.test(text.trim());
}

export function isCharacterCue(text: string): boolean {
  const line = text.trim();
  if (!line || line.length > 40) return false;
  if (isSceneHeading(line) || isTransition(line) || isActBreak(line)) return false;
  const stripped = line.replace(CHARACTER_EXT, "").trim();
  if (!stripped) return false;
  if (/[.!?:,]/.test(stripped)) return false;
  if (!/^[A-Z0-9][A-Z0-9 '\-]*$/.test(stripped)) return false;
  if (stripped.split(/\s+/).length > 4) return false;
  return /[A-Z]/.test(stripped);
}

export function normalizeCharacterName(text: string): string {
  const line = text.trim();
  const ext = line.match(CHARACTER_EXT);
  const name = line.replace(CHARACTER_EXT, "").trim().toUpperCase();
  return ext ? `${name} ${ext[1].toUpperCase()}` : name;
}

export function classifyStandalone(text: string): ElementType {
  const line = text.trim();
  if (!line) return "action";
  if (isActBreak(line)) return "act_break";
  if (isSceneHeading(line)) return "scene_heading";
  if (isTransition(line)) return "transition";
  if (line.startsWith("(") && line.endsWith(")")) return "parenthetical";
  if (isCharacterCue(line)) return "character";
  return "action";
}

export function parseFountain(source: string): ScriptElement[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const elements: ScriptElement[] = [];
  let mode: "normal" | "dialogue" = "normal";
  let pendingBlank = false;

  const push = (type: ElementType, text: string) => {
    elements.push({ id: uid(), type, text });
  };

  for (const raw of lines) {
    const trimmed = raw.trim();

    if (!trimmed) {
      pendingBlank = true;
      mode = "normal";
      continue;
    }

    if (trimmed.startsWith("Title:") || trimmed.startsWith("Author:") || trimmed.startsWith("Credit:")) {
      pendingBlank = false;
      continue;
    }

    if (/^\[\[.*\]\]$/.test(trimmed)) {
      pendingBlank = false;
      continue;
    }

    if (trimmed.startsWith("!") ) {
      push("action", trimmed.slice(1).trimStart());
      mode = "normal";
      pendingBlank = false;
      continue;
    }

    if (trimmed.startsWith("@")) {
      push("character", normalizeCharacterName(trimmed.slice(1)));
      mode = "dialogue";
      pendingBlank = false;
      continue;
    }

    if (isActBreak(trimmed)) {
      push("act_break", trimmed.toUpperCase());
      mode = "normal";
      pendingBlank = false;
      continue;
    }

    if (isSceneHeading(trimmed) || (trimmed.startsWith(".") && trimmed.length > 2)) {
      const text = trimmed.startsWith(".") ? trimmed.slice(1).trim() : trimmed.toUpperCase();
      push("scene_heading", text);
      mode = "normal";
      pendingBlank = false;
      continue;
    }

    if (isTransition(trimmed) || trimmed.startsWith(">")) {
      const text = trimmed.startsWith(">")
        ? trimmed.replace(/^>/, "").replace(/<$/, "").trim().toUpperCase()
        : trimmed.toUpperCase();
      if (trimmed.startsWith(">") && trimmed.endsWith("<")) {
        push("act_break", text);
      } else {
        push("transition", text.replace(/^>/, "").trim());
      }
      mode = "normal";
      pendingBlank = false;
      continue;
    }

    if (mode === "dialogue") {
      if (trimmed.startsWith("(") ) {
        push("parenthetical", trimmed);
      } else {
        const last = elements[elements.length - 1];
        if (last?.type === "dialogue" && !pendingBlank) {
          last.text = `${last.text}\n${trimmed}`;
        } else {
          push("dialogue", trimmed);
        }
      }
      pendingBlank = false;
      continue;
    }

    if ((pendingBlank || elements.length === 0) && isCharacterCue(trimmed)) {
      push("character", normalizeCharacterName(trimmed));
      mode = "dialogue";
      pendingBlank = false;
      continue;
    }

    const last = elements[elements.length - 1];
    if (last?.type === "action" && !pendingBlank) {
      last.text = `${last.text}\n${trimmed}`;
    } else {
      push("action", trimmed);
    }
    mode = "normal";
    pendingBlank = false;
  }

  return elements.length ? elements : [{ id: uid(), type: "scene_heading", text: "INT. " }];
}

function fountainEscapeAction(text: string): string {
  if (isSceneHeading(text) || isCharacterCue(text) || isTransition(text) || isActBreak(text)) {
    return `!${text}`;
  }
  return text;
}

export function toFountain(elements: ScriptElement[]): string {
  const lines: string[] = [];
  for (const el of elements) {
    const text = el.text.trimEnd();
    switch (el.type) {
      case "scene_heading":
        lines.push(text.toUpperCase());
        lines.push("");
        break;
      case "action":
        lines.push(fountainEscapeAction(text));
        lines.push("");
        break;
      case "character":
        lines.push(normalizeCharacterName(text));
        break;
      case "parenthetical":
        lines.push(text.startsWith("(") ? text : `(${text})`);
        break;
      case "dialogue":
        lines.push(text);
        lines.push("");
        break;
      case "transition":
        lines.push(text.toUpperCase());
        lines.push("");
        break;
      case "act_break":
        lines.push(`>${text.toUpperCase()}<`);
        lines.push("");
        break;
    }
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function titlePageFountain(kind: "feature" | "tv", titlePage: {
  title: string;
  writtenBy: string;
  contact: string;
  showName: string;
  episodeTitle: string;
}): string {
  if (kind === "tv") {
    return [
      `Title: ${titlePage.showName || titlePage.title}`,
      titlePage.episodeTitle ? `Episode: ${titlePage.episodeTitle}` : "",
      `Author: ${titlePage.writtenBy}`,
      titlePage.contact ? `Contact: ${titlePage.contact}` : "",
      "",
    ]
      .filter((line, i, arr) => line !== "" || arr[i - 1] !== "")
      .join("\n");
  }
  return [
    `Title: ${titlePage.title}`,
    `Author: ${titlePage.writtenBy}`,
    titlePage.contact ? `Contact: ${titlePage.contact}` : "",
    "",
  ].join("\n");
}

export function parsePlainText(source: string): ScriptElement[] {
  return parseFountain(source);
}

export function currentSceneElements(elements: ScriptElement[], index: number): ScriptElement[] {
  if (elements.length === 0) return [];
  const clamped = Math.max(0, Math.min(index, elements.length - 1));
  let start = 0;
  for (let i = clamped; i >= 0; i--) {
    if (elements[i].type === "scene_heading" || elements[i].type === "act_break") {
      start = i;
      break;
    }
  }
  let end = elements.length;
  for (let i = start + 1; i < elements.length; i++) {
    if (elements[i].type === "scene_heading" || elements[i].type === "act_break") {
      end = i;
      break;
    }
  }
  return elements.slice(start, end);
}

export function sceneIndexForElement(elements: ScriptElement[], elementId: string): number {
  const idx = elements.findIndex((el) => el.id === elementId);
  if (idx < 0) return 0;
  for (let i = idx; i >= 0; i--) {
    if (elements[i].type === "scene_heading") return i;
  }
  return 0;
}
