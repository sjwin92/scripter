import { describe, expect, it } from "vitest";
import { parseFdx, toFdx } from "./fdx";
import { createProject } from "./project";

describe("fdx", () => {
  it("exports and re-imports paragraphs", () => {
    const project = createProject({ kind: "feature", title: "Night Work" });
    project.elements = [
      { id: "1", type: "scene_heading", text: "INT. SHOP - DAY" },
      { id: "2", type: "action", text: "A bell rings." },
      { id: "3", type: "character", text: "MAYA" },
      { id: "4", type: "dialogue", text: "We're closed." },
    ];
    const xml = toFdx(project);
    expect(xml).toContain("Scene Heading");
    const parsed = parseFdx(xml);
    expect(parsed.map((el) => el.type)).toEqual(["scene_heading", "action", "character", "dialogue"]);
    expect(parsed[3]?.text).toBe("We're closed.");
  });
});
