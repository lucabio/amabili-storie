import { describe, expect, it } from "vitest";

import { BRAND_DEFAULT, brandSchema } from "@/lib/brand/schema";
import {
  buildCharacterSheetPrompt,
  buildIllustrationPrompt,
  buildSystemPrompt,
} from "@/lib/story/prompt";

describe("buildSystemPrompt", () => {
  it("a brand without a guide prompt gets the Method alone, as before ASD-8", () => {
    const prompt = buildSystemPrompt(BRAND_DEFAULT);

    expect(prompt.startsWith("Sei l'autore di Amabili Storie")).toBe(true);
    expect(prompt).not.toContain("<sicurezza>");
    expect(prompt).not.toContain("<istruzioni_edizione");
  });

  it("with a guide prompt the order is the priority: guardrails, canon, format, Method", () => {
    const brand = brandSchema.parse({
      slug: "relax",
      name: "Family Hotel Relax",
      type: "story",
      guidePrompt: "# Canone\nLa guida è sempre Kongy.",
    });
    const prompt = buildSystemPrompt(brand);

    const order = ["<sicurezza>", "La guida è sempre Kongy.", "<formato>", "<metodo_amabili>"].map(
      (marker) => prompt.indexOf(marker),
    );
    expect(order.every((position) => position >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(prompt).toContain("vincono queste");
  });
});

describe("illustration prompts", () => {
  const SHEET = "- Protagonista: Futura, una bambina di 4 anni (ha sempre in mano un dinosauro di gomma).";

  it("the sheet prompt draws the admin's text as a neutral model sheet", () => {
    const prompt = buildCharacterSheetPrompt(SHEET);

    expect(prompt).toContain(SHEET);
    expect(prompt).toContain("posa neutra");
    expect(prompt).toContain("NESSUN testo");
  });

  it("a page binds face and build to the reference, and frees clothes to the scene", () => {
    const prompt = buildIllustrationPrompt({ scene: "Futura al mare.", sheet: SHEET });

    expect(prompt).toContain(SHEET);
    expect(prompt).toContain("Stesso viso, stessa corporatura, stessa età del riferimento");
    expect(prompt).toContain("abbigliamento, posa e ambientazione seguono la scena");
    expect(prompt.endsWith("Scena da illustrare: Futura al mare.")).toBe(true);
  });
});
