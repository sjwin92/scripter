import { describe, expect, it } from "vitest";
import { uid } from "./id";
import { estimatePageCount, wrapLineCount } from "./pagination";

describe("pagination", () => {
  it("wraps by width", () => {
    expect(wrapLineCount("one two three", 5)).toBeGreaterThan(1);
    expect(wrapLineCount("short", 40)).toBe(1);
  });

  it("never reports zero pages", () => {
    expect(estimatePageCount([])).toBe(1);
    expect(
      estimatePageCount([
        { id: uid(), type: "scene_heading", text: "INT. ROOM - DAY" },
        { id: uid(), type: "action", text: "A long ".repeat(2000) },
      ]),
    ).toBeGreaterThan(1);
  });
});
