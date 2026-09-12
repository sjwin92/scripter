import { describe, expect, it } from "vitest";
import { classifyStandalone, parseFountain, toFountain } from "./fountain";

const SAMPLE = `INT. KITCHEN - NIGHT

Maya rinses a glass. She does not look up.

                  MAYA
              (quietly)
          We don't talk about that.

                    CUT TO:

>TEASER<
`;

describe("fountain", () => {
  it("classifies industry lines", () => {
    expect(classifyStandalone("INT. HOUSE - DAY")).toBe("scene_heading");
    expect(classifyStandalone("CUT TO:")).toBe("transition");
    expect(classifyStandalone("ACT TWO")).toBe("act_break");
    expect(classifyStandalone("MAYA")).toBe("character");
    expect(classifyStandalone("MAYA RINSES A GLASS.")).toBe("action");
    expect(classifyStandalone("(quietly)")).toBe("parenthetical");
    expect(classifyStandalone("She waits.")).toBe("action");
  });

  it("round-trips a short scene", () => {
    const elements = parseFountain(SAMPLE);
    const types = elements.map((el) => el.type);
    expect(types).toContain("scene_heading");
    expect(types).toContain("character");
    expect(types).toContain("parenthetical");
    expect(types).toContain("dialogue");
    expect(types).toContain("transition");
    const again = parseFountain(toFountain(elements));
    expect(again.map((el) => el.type)).toEqual(elements.map((el) => el.type));
    expect(again.find((el) => el.type === "dialogue")?.text).toMatch(/talk about that/i);
  });

  it("reads character extensions", () => {
    const elements = parseFountain("\nMAYA (V.O.)\nHold the door.\n");
    expect(elements[0]?.type).toBe("character");
    expect(elements[0]?.text).toContain("V.O.");
    expect(elements[1]?.type).toBe("dialogue");
  });
});
