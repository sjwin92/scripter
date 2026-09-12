import { classifyStandalone, isCharacterCue, isSceneHeading, isTransition, normalizeCharacterName } from "./fountain";
import { uid } from "./id";
import { defaultTextForType } from "./keyboard";
import type { ElementType, ScriptElement } from "./types";

export function applyType(el: ScriptElement, type: ElementType): ScriptElement {
  let text = el.text;
  if (type === "character") text = normalizeCharacterName(text || defaultTextForType(type));
  else if (type === "scene_heading") text = (text || defaultTextForType(type)).toUpperCase();
  else if (type === "transition") text = (text || defaultTextForType(type)).toUpperCase();
  else if (type === "act_break") text = (text || defaultTextForType(type)).toUpperCase();
  else if (type === "parenthetical") {
    const inner = text.replace(/^\(|\)$/g, "").trim();
    text = `(${inner})`;
  }
  return { ...el, type, text };
}

export function smartNormalize(el: ScriptElement): ScriptElement {
  const trimmed = el.text.trim();
  if (!trimmed) return el;
  if (el.type === "action") {
    const guessed = classifyStandalone(trimmed);
    if (guessed !== "action") return applyType({ ...el, text: trimmed }, guessed);
  }
  if (el.type === "character" && isCharacterCue(trimmed)) {
    return { ...el, text: normalizeCharacterName(trimmed) };
  }
  if (el.type === "scene_heading" && isSceneHeading(trimmed)) {
    return { ...el, text: trimmed.toUpperCase() };
  }
  if (el.type === "transition" && isTransition(trimmed)) {
    return { ...el, text: trimmed.toUpperCase() };
  }
  if (el.type === "act_break") {
    return { ...el, text: trimmed.toUpperCase() };
  }
  if (el.type === "parenthetical") {
    const inner = trimmed.replace(/^\(|\)$/g, "").trim();
    return { ...el, text: `(${inner})` };
  }
  return el;
}

export function makeElement(type: ElementType, text = ""): ScriptElement {
  return applyType({ id: uid(), type, text: text || defaultTextForType(type) }, type);
}

export function replaceScene(
  elements: ScriptElement[],
  focusIndex: number,
  incoming: ScriptElement[],
): { elements: ScriptElement[]; focusId: string } {
  let start = 0;
  const clamped = Math.max(0, Math.min(focusIndex, elements.length - 1));
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
  const next = [...elements.slice(0, start), ...incoming, ...elements.slice(end)];
  return { elements: next, focusId: incoming[incoming.length - 1]?.id ?? next[start]?.id ?? next[0].id };
}

export function insertAfter(
  elements: ScriptElement[],
  index: number,
  incoming: ScriptElement[],
): { elements: ScriptElement[]; focusId: string } {
  const at = Math.max(0, Math.min(index, elements.length - 1));
  const next = [...elements.slice(0, at + 1), ...incoming, ...elements.slice(at + 1)];
  return { elements: next, focusId: incoming[incoming.length - 1]?.id ?? next[at].id };
}
