import { currentSceneElements, toFountain } from "./fountain";
import { extractCharacters } from "./characters";
import { estimatePageCount } from "./pagination";
import { displayTitle, structureHint, tvBeats } from "./structure";
import type { AiAction, AiSuggestion, Project, ScriptElement } from "./types";

function lastCharacter(elements: ScriptElement[], index: number): string {
  for (let i = Math.min(index, elements.length - 1); i >= 0; i--) {
    if (elements[i].type === "character") {
      return elements[i].text.replace(/\s+\(.*\)$/, "").trim().toUpperCase();
    }
  }
  const names = extractCharacters(elements);
  return names[0]?.name ?? "SOMEONE";
}

function lastDialogue(elements: ScriptElement[], index: number): string {
  for (let i = Math.min(index, elements.length - 1); i >= 0; i--) {
    if (elements[i].type === "dialogue" && elements[i].text.trim()) {
      return elements[i].text.trim();
    }
  }
  return "";
}

function sceneHeadingOf(elements: ScriptElement[], index: number): string {
  for (let i = Math.min(index, elements.length - 1); i >= 0; i--) {
    if (elements[i].type === "scene_heading") return elements[i].text.trim() || "INT. SOMEWHERE - DAY";
  }
  return "INT. SOMEWHERE - DAY";
}

function otherCharacter(project: Project, current: string): string {
  const names = extractCharacters(project.elements).map((c) => c.name).filter((n) => n !== current);
  return names[0] ?? "";
}

function tightenText(text: string): string {
  return text
    .replace(/\b(begin(?:s|ning)? to|start(?:s|ing)? to|really|very|just|suddenly|clearly)\s+/gi, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function visualBeat(heading: string): string {
  const loc = heading.replace(/^(INT\.|EXT\.|EST\.|I\/E\.)\s*/i, "").split(" - ")[0]?.trim() || "the room";
  const interior = /^INT/i.test(heading);
  if (interior) {
    return `A practical light ticks. Dust hangs in ${loc.toLowerCase()}, waiting for someone to disturb it.`;
  }
  return `Wind worries the edge of ${loc.toLowerCase()}. Far off, a sound that does not belong here.`;
}

export function demoAssist(
  project: Project,
  focusIndex: number,
  action: AiAction,
  insertable: boolean,
): AiSuggestion {
  const scene = currentSceneElements(project.elements, focusIndex);
  const heading = sceneHeadingOf(project.elements, focusIndex);
  const speaker = lastCharacter(project.elements, focusIndex);
  const previous = lastDialogue(project.elements, focusIndex);
  const other = otherCharacter(project, speaker);
  const title = displayTitle(project);
  const hint = structureHint(project);
  const pages = estimatePageCount(project.elements);
  const names = extractCharacters(project.elements);

  let body = "";
  switch (action) {
    case "next-dialogue": {
      const replyTo = previous ? previous.replace(/[.?!].*$/, "") : "what we don't say";
      body = other
        ? `${speaker}\nI heard you. I just don't accept ${replyTo.toLowerCase()} as the ending.\n\n${other}\nThen stop waiting for a cleaner version.`
        : `${speaker}\nSay the true thing, then. Not the version that keeps the furniture in place.`;
      break;
    }
    case "rewrite-tone": {
      const fountain = toFountain(scene).trim();
      body = fountain
        ? fountain
            .split("\n")
            .map((line) => {
              if (!line.trim()) return line;
              if (/^[A-Z0-9 .'/()-]+$/.test(line.trim()) && line.trim().length < 40) return line;
              return tightenText(line).replace(/\.$/, ". The air does not help.");
            })
            .join("\n")
        : `${heading}\n\n${visualBeat(heading)}\n`;
      break;
    }
    case "tighten": {
      const fountain = toFountain(scene).trim();
      body = fountain
        ? fountain
            .split("\n")
            .map((line) => (line.trim() ? tightenText(line) : line))
            .join("\n")
        : `${heading}\n\nSilence. Then the choice.\n`;
      break;
    }
    case "more-visual": {
      const actions = scene.filter((el) => el.type === "action" && el.text.trim());
      const existing = actions[0]?.text ?? "";
      body = `${heading}\n\n${visualBeat(heading)}${existing ? `\n\n${tightenText(existing)}` : ""}\n`;
      if (speaker !== "SOMEONE" && previous) {
        body += `\n${speaker}\n${previous.split(" ").slice(0, 8).join(" ")}.\n`;
      }
      break;
    }
    case "logline": {
      const who = names.slice(0, 2).map((c) => c.name).join(" and ") || "A writer";
      const place = heading.replace(/^(INT\.|EXT\.|EST\.|I\/E\.)\s*/i, "");
      body =
        project.kind === "tv"
          ? `When ${who.toLowerCase()} cannot leave ${place.toLowerCase()}, the episode becomes a test of who still tells the truth.`
          : `After a fracture in ${place.toLowerCase()}, ${who.toLowerCase()} must choose between the story that protects them and the one that ends the lie.`;
      break;
    }
    case "synopsis": {
      const who = names.map((c) => c.name).slice(0, 3);
      body = [
        `${title} is ${project.kind === "tv" ? "an episode" : "a feature"} in progress (${pages} page${pages === 1 ? "" : "s"}).`,
        who.length
          ? `On the page now: ${who.join(", ")}.`
          : "Character cues will sharpen this pitch as you write names in CAPS.",
        `The present location is ${heading}.`,
        `Structure reading: ${hint.label}. ${hint.detail}`,
        "This synopsis only reflects what you have written — it is not a finished plot.",
      ].join(" ");
      break;
    }
    case "structure": {
      if (project.kind === "feature") {
        body = [
          `${hint.label} — ${hint.detail}`,
          "Three-act reminder: Act I lands the inciting incident and the choice that makes turning back expensive.",
          "Act II is confrontation and midpoint reversal. Act III answers the question Act I asked.",
          pages < 8
            ? "You are still in the opening image. Let the first slugline teach the world before you explain it."
            : "Keep page count honest. If a scene does not turn, it is research — cut or move it.",
        ].join("\n\n");
      } else {
        const preset = tvBeats(project.titlePage.duration).join(" → ");
        body = [
          `${hint.label} — ${hint.detail}`,
          `Preset map: ${preset}.`,
          "Teaser asks a question the act outs cannot dodge. Each act out should cost something the next act must pay.",
          "Scripter will not invent later episodes. Stay inside this hour.",
        ].join("\n\n");
      }
      break;
    }
    case "deepen-character": {
      const want = previous ? `They keep circling “${previous.replace(/\s+/g, " ").slice(0, 72)}”` : "Their want is still unnamed";
      body = [
        `${speaker}: ${want}. If they are a flat-arc presence, do not make them learn the lesson — make someone else collide with it.`,
        "",
        `${speaker}`,
        `(not looking at them)`,
        `I can live with the version of me you need. I just won't pretend it's the only one.`,
      ].join("\n");
      break;
    }
  }

  return {
    action,
    title:
      action === "next-dialogue"
        ? "Suggest next dialogue"
        : action === "rewrite-tone"
          ? "Rewrite tone"
          : action === "tighten"
            ? "Tighten"
            : action === "more-visual"
              ? "More visual"
              : action === "logline"
                ? "Logline"
                : action === "synopsis"
                  ? "Synopsis"
                  : action === "structure"
                    ? "Structure notes"
                    : "Deepen character beat",
    body,
    insertable,
    source: "demo",
  };
}
