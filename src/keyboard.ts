import type { ElementType } from "./types";
import { ELEMENT_CYCLE } from "./types";

export function nextOnEnter(type: ElementType): ElementType {
  switch (type) {
    case "scene_heading":
      return "action";
    case "action":
      return "action";
    case "character":
      return "dialogue";
    case "parenthetical":
      return "dialogue";
    case "dialogue":
      return "action";
    case "transition":
      return "scene_heading";
    case "act_break":
      return "scene_heading";
  }
}

export function cycleType(type: ElementType, direction: 1 | -1): ElementType {
  const index = ELEMENT_CYCLE.indexOf(type);
  const next = (index + direction + ELEMENT_CYCLE.length) % ELEMENT_CYCLE.length;
  return ELEMENT_CYCLE[next];
}

export function defaultTextForType(type: ElementType, previous = ""): string {
  if (previous.trim()) return previous;
  if (type === "scene_heading") return "INT. ";
  if (type === "transition") return "CUT TO:";
  if (type === "act_break") return "ACT ONE";
  if (type === "parenthetical") return "()";
  return "";
}
