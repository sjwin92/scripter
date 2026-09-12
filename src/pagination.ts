import type { ElementType, ScriptElement } from "./types";

const LINE_WIDTH: Record<ElementType, number> = {
  scene_heading: 60,
  action: 60,
  character: 40,
  parenthetical: 25,
  dialogue: 35,
  transition: 40,
  act_break: 40,
};

export const LINES_PER_PAGE = 54;

export function wrapLineCount(text: string, width: number): number {
  const blocks = (text || " ").split("\n");
  let lines = 0;
  for (const block of blocks) {
    const words = block.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines += 1;
      continue;
    }
    let current = 0;
    for (const word of words) {
      const next = current === 0 ? word.length : current + 1 + word.length;
      if (next > width) {
        lines += 1;
        current = word.length;
      } else {
        current = next;
      }
    }
    if (current > 0) lines += 1;
  }
  return Math.max(1, lines);
}

export function elementLineCount(el: ScriptElement): number {
  return wrapLineCount(el.text, LINE_WIDTH[el.type]);
}

export function totalLines(elements: ScriptElement[]): number {
  return elements.reduce((sum, el) => {
    const extra =
      el.type === "scene_heading" || el.type === "act_break" || el.type === "transition" ? 1 : 0;
    return sum + elementLineCount(el) + extra;
  }, 0);
}

export function estimatePageCount(elements: ScriptElement[]): number {
  return Math.max(1, Math.ceil(totalLines(elements) / LINES_PER_PAGE));
}

export function pageAtElement(elements: ScriptElement[], elementId: string): number {
  let lines = 0;
  for (const el of elements) {
    const extra =
      el.type === "scene_heading" || el.type === "act_break" || el.type === "transition" ? 1 : 0;
    lines += elementLineCount(el) + extra;
    if (el.id === elementId) break;
  }
  return Math.max(1, Math.ceil(lines / LINES_PER_PAGE));
}
