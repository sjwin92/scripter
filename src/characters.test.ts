import { describe, expect, it } from "vitest";
import { extractCharacters } from "./characters";
import { parseFountain } from "./fountain";

describe("characters", () => {
  it("counts cues and scenes", () => {
    const elements = parseFountain(`INT. BAR - NIGHT

                  MAYA
          Hello.

                  JON
          No.

INT. STREET - NIGHT

                  MAYA
          Still no.
`);
    const profiles = extractCharacters(elements);
    const maya = profiles.find((p) => p.name === "MAYA");
    expect(maya?.appearances).toBe(2);
    expect(maya?.scenes).toHaveLength(2);
    expect(maya?.insight.length).toBeGreaterThan(20);
  });
});
