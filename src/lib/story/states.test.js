import { describe, expect, it } from "vitest";

import { STATES, transitionAllowed } from "@/lib/story/states";

describe("state transitions", () => {
  it("from generating you go to review or you fail", () => {
    expect(transitionAllowed("in_generazione", "in_revisione")).toBe(true);
    expect(transitionAllowed("in_generazione", "fallita")).toBe(true);
  });

  it("a story that has not been reviewed cannot be approved", () => {
    expect(transitionAllowed("in_generazione", "approvata")).toBe(false);
  });

  it("from review you approve or you reject", () => {
    expect(transitionAllowed("in_revisione", "approvata")).toBe(true);
    expect(transitionAllowed("in_revisione", "rifiutata")).toBe(true);
  });

  it("approved is irreversible: the book has already gone out", () => {
    for (const state of STATES) {
      expect(transitionAllowed("approvata", state)).toBe(false);
    }
  });

  it("from failed and from rejected you can regenerate", () => {
    expect(transitionAllowed("fallita", "in_generazione")).toBe(true);
    expect(transitionAllowed("rifiutata", "in_generazione")).toBe(true);
  });

  it("a made-up state leads nowhere", () => {
    expect(transitionAllowed("inventato", "approvata")).toBe(false);
  });
});
