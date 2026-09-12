import { currentSceneElements, toFountain } from "./fountain";
import { demoAssist } from "./assistDemo";
import { estimatePageCount } from "./pagination";
import { displayTitle, structureHint } from "./structure";
import type { AiAction, AiSuggestion, Project } from "./types";

export const AI_ACTIONS: { id: AiAction; label: string; hint: string }[] = [
  { id: "next-dialogue", label: "Suggest next dialogue", hint: "A line, not a scene" },
  { id: "rewrite-tone", label: "Rewrite tone", hint: "Same beat, sharper voice" },
  { id: "tighten", label: "Tighten", hint: "Cut air, keep bone" },
  { id: "more-visual", label: "More visual", hint: "What we can photograph" },
  { id: "logline", label: "Logline", hint: "One sentence" },
  { id: "synopsis", label: "Synopsis", hint: "A short pitch, not a draft" },
  { id: "structure", label: "Structure notes", hint: "Where you are on the map" },
  { id: "deepen-character", label: "Deepen character beat", hint: "Pressure, not a new person" },
];

export function hasLiveAi(): boolean {
  return Boolean(import.meta.env.VITE_OPENAI_API_KEY?.trim());
}

function contextBundle(project: Project, focusIndex: number): string {
  const scene = currentSceneElements(project.elements, focusIndex);
  const sceneText = toFountain(scene).trim();
  const scriptHead = toFountain(project.elements.slice(0, 40)).trim();
  const hint = structureHint(project);
  return [
    `Title: ${displayTitle(project)}`,
    `Kind: ${project.kind === "tv" ? `TV ${project.titlePage.duration}` : "Feature"}`,
    `Writer: ${project.titlePage.writtenBy || "unknown"}`,
    `Approx pages: ${estimatePageCount(project.elements)}`,
    `Structure: ${hint.label}. ${hint.detail}`,
    "",
    "Current scene:",
    sceneText || "(empty scene)",
    "",
    "Script opening (truncated):",
    scriptHead.slice(0, 2500),
  ].join("\n");
}

const ACTION_INSTRUCTIONS: Record<AiAction, string> = {
  "next-dialogue":
    "Suggest the next 1–4 lines of dialogue for the character who should speak next. Fountain format (CHARACTER then dialogue). Do not write the rest of the scene.",
  "rewrite-tone":
    "Rewrite only the current scene with a cleaner, more specific tone. Keep story facts. Fountain format. No new plot.",
  tighten:
    "Tighten the current scene. Cut filler, keep images and turns. Fountain format. Do not add story.",
  "more-visual":
    "Rewrite the current scene so it is more visual and photographable. Fountain format. Do not invent a new story beat.",
  logline:
    "Write a single-sentence logline from what exists. Do not invent a finished movie the writer has not written.",
  synopsis:
    "Write a short synopsis (120–180 words) of what is on the page. Mark speculation clearly. Do not generate unwritten acts.",
  structure:
    "Give brief structure notes for where this script is. Feature: three-act. TV: teaser and act breaks. No new scenes.",
  "deepen-character":
    "Deepen the current character beat: want, pressure, subtext. Offer a short rewritten exchange (Fountain) or a note. Do not add a new character.",
};

export async function requestAssist(
  project: Project,
  focusIndex: number,
  action: AiAction,
): Promise<AiSuggestion> {
  const meta = AI_ACTIONS.find((a) => a.id === action)!;
  const insertable = ["next-dialogue", "rewrite-tone", "tighten", "more-visual", "deepen-character"].includes(
    action,
  );

  if (!hasLiveAi()) {
    return demoAssist(project, focusIndex, action, insertable);
  }

  const key = import.meta.env.VITE_OPENAI_API_KEY!.trim();
  const model = import.meta.env.VITE_OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const base = (import.meta.env.VITE_OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, "");

  const system = [
    "You are a screenwriting assistant inside Scripter.",
    "Assist, don't replace. Never write a full script from a logline or one-liner.",
    "The writer owns every page. Offer a small, usable suggestion only.",
    "Industry format is non-negotiable: when returning script text, use Fountain.",
    "Do not lecture. Do not invent series bibles or unwritten episodes.",
  ].join(" ");

  try {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        messages: [
          { role: "system", content: system },
          {
            role: "user",
            content: `${ACTION_INSTRUCTIONS[action]}\n\n${contextBundle(project, focusIndex)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`AI request failed (${response.status})`);
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const body = data.choices?.[0]?.message?.content?.trim();
    if (!body) throw new Error("Empty AI response");

    return {
      action,
      title: meta.label,
      body,
      insertable,
      source: "live",
    };
  } catch {
    const fallback = demoAssist(project, focusIndex, action, insertable);
    return {
      ...fallback,
      title: `${meta.label} (demo fallback)`,
    };
  }
}
