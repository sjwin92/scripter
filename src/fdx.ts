import { uid } from "./id";
import { displayTitle } from "./structure";
import type { ElementType, Project, ScriptElement } from "./types";

const FDX_TYPE: Record<ElementType, string> = {
  scene_heading: "Scene Heading",
  action: "Action",
  character: "Character",
  parenthetical: "Parenthetical",
  dialogue: "Dialogue",
  transition: "Transition",
  act_break: "New Act",
};

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function toFdx(project: Project): string {
  const paragraphs = project.elements
    .map((el) => {
      const type = FDX_TYPE[el.type];
      const text = xmlEscape(el.text);
      const align = el.type === "act_break" ? ' Alignment="Center"' : "";
      return `    <Paragraph Type="${type}"${align}>\n      <Text>${text}</Text>\n    </Paragraph>`;
    })
    .join("\n");

  const title = xmlEscape(displayTitle(project));
  return `<?xml version="1.0" encoding="UTF-8" standalone="no" ?>
<FinalDraft DocumentType="Script" Template="No" Version="5">
  <Content>
${paragraphs}
  </Content>
  <TitlePage>
    <Content>
      <Paragraph Alignment="Center">
        <Text>${title}</Text>
      </Paragraph>
      <Paragraph Alignment="Center">
        <Text>Written by</Text>
      </Paragraph>
      <Paragraph Alignment="Center">
        <Text>${xmlEscape(project.titlePage.writtenBy)}</Text>
      </Paragraph>
    </Content>
  </TitlePage>
</FinalDraft>
`;
}

export function downloadFdx(project: Project) {
  const blob = new Blob([toFdx(project)], { type: "text/xml;charset=utf-8" });
  triggerDownload(blob, `${fileStem(project)}.fdx`);
}

export function downloadFountainFile(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function fileStem(project: Project): string {
  return displayTitle(project).replace(/[^\w\s-]+/g, "").trim() || "script";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const FDX_FROM: Record<string, ElementType> = {
  "Scene Heading": "scene_heading",
  Action: "action",
  Character: "character",
  Parenthetical: "parenthetical",
  Dialogue: "dialogue",
  Transition: "transition",
  "New Act": "act_break",
  "End of Act": "act_break",
};

export function parseFdx(xml: string): ScriptElement[] {
  const paragraphs = [...xml.matchAll(/<Paragraph\b([^>]*)>([\s\S]*?)<\/Paragraph>/gi)];
  const elements: ScriptElement[] = [];
  for (const match of paragraphs) {
    const attrs = match[1] ?? "";
    const inner = match[2] ?? "";
    const typeMatch = attrs.match(/Type="([^"]+)"/i);
    if (!typeMatch) continue;
    const type = FDX_FROM[typeMatch[1]] ?? "action";
    const text = (inner.match(/<Text[^>]*>([\s\S]*?)<\/Text>/i)?.[1] ?? "")
      .replace(/<[^>]+>/g, "")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"');
    if (type === "action" && !text.trim() && elements.length === 0) continue;
    elements.push({ id: uid(), type, text });
  }
  return elements.length ? elements : [{ id: uid(), type: "scene_heading", text: "INT. " }];
}
