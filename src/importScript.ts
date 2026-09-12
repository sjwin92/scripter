import { parseFdx } from "./fdx";
import { parseFountain } from "./fountain";
import type { ScriptElement } from "./types";

export function parseImportedFile(filename: string, text: string): ScriptElement[] {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".fdx") || /<FinalDraft\b/i.test(text)) {
    return parseFdx(text);
  }
  return parseFountain(text);
}
