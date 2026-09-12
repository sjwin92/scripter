import { displayTitle } from "./structure";
import type { Project, ScriptElement } from "./types";

const PAGE_W = 8.5;
const PAGE_H = 11;
const TOP = 1;
const BOTTOM = 1;
const LINE = 12 / 72;

function wrap(text: string, widthChars: number): string[] {
  const out: string[] = [];
  for (const block of (text || " ").split("\n")) {
    const words = block.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      out.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > widthChars && current) {
        out.push(current);
        current = word;
      } else {
        current = next;
      }
    }
    if (current) out.push(current);
  }
  return out.length ? out : [""];
}

class ScriptDoc {
  doc: import("jspdf").jsPDF;
  y = TOP;
  page = 1;

  constructor(doc: import("jspdf").jsPDF) {
    this.doc = doc;
    this.doc.setFont("courier", "normal");
    this.doc.setFontSize(12);
  }

  ensure(lines = 1) {
    if (this.y + lines * LINE <= PAGE_H - BOTTOM) return;
    this.doc.addPage();
    this.page += 1;
    this.y = TOP;
    this.doc.setFont("courier", "normal");
    this.doc.setFontSize(12);
    this.doc.text(String(this.page) + ".", PAGE_W - 0.75, 0.5, { align: "right" });
  }

  lines(x: number, rows: string[], gapAfter = 0) {
    for (const row of rows) {
      this.ensure();
      this.doc.text(row || " ", x, this.y);
      this.y += LINE;
    }
    this.y += gapAfter * LINE;
  }

  center(text: string, y?: number) {
    this.doc.text(text, PAGE_W / 2, y ?? this.y, { align: "center" });
  }
}

function writeElements(script: ScriptDoc, elements: ScriptElement[]) {
  for (const el of elements) {
    const text = el.text || " ";
    switch (el.type) {
      case "scene_heading":
        script.ensure(2);
        script.lines(1.5, wrap(text.toUpperCase(), 60), 1);
        break;
      case "action":
        script.lines(1.5, wrap(text, 60), 1);
        break;
      case "character":
        script.ensure(2);
        script.lines(3.7, wrap(text.toUpperCase(), 35), 0);
        break;
      case "parenthetical": {
        const lined = text.startsWith("(") ? text : `(${text})`;
        script.lines(3.1, wrap(lined, 25), 0);
        break;
      }
      case "dialogue":
        script.lines(2.5, wrap(text, 35), 1);
        break;
      case "transition":
        script.lines(5.5, wrap(text.toUpperCase(), 20), 1);
        break;
      case "act_break":
        script.ensure(2);
        for (const row of wrap(text.toUpperCase(), 40)) {
          script.ensure();
          script.center(row);
          script.y += LINE;
        }
        script.y += LINE;
        break;
    }
  }
}

function writeTitlePage(script: ScriptDoc, project: Project) {
  const tp = project.titlePage;
  script.y = 3.4;
  if (project.kind === "tv") {
    script.center((tp.showName || "UNTITLED SHOW").toUpperCase());
    script.y += LINE * 2;
    if (tp.episodeNumber) {
      script.center(tp.episodeNumber);
      script.y += LINE;
    }
    script.center(`"${tp.episodeTitle || tp.title || "Untitled"}"`);
  } else {
    script.center((tp.title || "UNTITLED").toUpperCase());
  }
  script.y += LINE * 3;
  script.center("Written by");
  script.y += LINE * 1.5;
  script.center(tp.writtenBy || " ");
  if (tp.contact) {
    script.y = 9.2;
    script.doc.text(tp.contact, 1.5, script.y);
  }
  script.doc.addPage();
  script.page = 1;
  script.y = TOP;
  script.doc.setFont("courier", "normal");
  script.doc.setFontSize(12);
}

export async function downloadPdf(project: Project) {
  const { jsPDF } = await import("jspdf");
  const script = new ScriptDoc(new jsPDF({ unit: "in", format: "letter" }));
  writeTitlePage(script, project);
  writeElements(script, project.elements);
  const name = displayTitle(project).replace(/[^\w\s-]+/g, "").trim() || "script";
  script.doc.save(`${name}.pdf`);
}
