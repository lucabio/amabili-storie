import { describe, expect, it } from "vitest";

import { getWhim } from "@/lib/domain/whims";
import { buildPrompt } from "@/lib/story/prompt";
import { storyParamsSchema } from "@/lib/story/schema";

const BASE = {
  whim: "sonno",
  family: "umani",
  name: "Futura",
  gender: "bimba",
  age: 4,
};

/** Today's prompt, built from the same domain pieces `buildPrompt` uses. */
function todaysPrompt(pageCount) {
  const whim = getWhim("sonno");
  return [
    `Protagonista: una bimba di nome Futura. Ha 4 anni.`,
    `Genitori: la mamma e il papà.`,
    `Difficoltà da affrontare: ${whim.label}.`,
    `Bisogno sottostante da rispettare: ${whim.need}`,
    `Arco narrativo da seguire: ${whim.arc}`,
    `Scrivi esattamente ${pageCount} pagine.`,
  ].join("\n");
}

describe("storyParamsSchema — traits", () => {
  it("they are all optional: leaving them empty does not break validation", () => {
    const params = storyParamsSchema.parse(BASE);

    expect(params.traits).toEqual({
      child: { hair: "", hairColor: "", eyeColor: "", build: "", description: "" },
      mother: { hair: "", hairColor: "", eyeColor: "", build: "", description: "" },
      father: { hair: "", hairColor: "", eyeColor: "", build: "", description: "" },
    });
  });

  it("nested defaults are really applied (the .default() trap in Zod 4)", () => {
    // A client sending an empty or partial `tratti` object must still get the
    // five keys of each character back, not a half-filled object.
    const params = storyParamsSchema.parse({
      ...BASE,
      traits: { child: { hair: "ricci" } },
    });

    expect(params.traits.child).toEqual({
      hair: "ricci",
      hairColor: "",
      eyeColor: "",
      build: "",
      description: "",
    });
    expect(params.traits.mother).toEqual({
      hair: "",
      hairColor: "",
      eyeColor: "",
      build: "",
      description: "",
    });
  });

  it("accepts the free-form description up to 200 characters", () => {
    const description = "a".repeat(200);
    const params = storyParamsSchema.parse({
      ...BASE,
      traits: { child: { description } },
    });

    expect(params.traits.child.description).toBe(description);
  });
});

describe("buildPrompt — the traits", () => {
  it("with no traits filled in, the prompt is identical to the one from before traits existed", () => {
    const params = storyParamsSchema.parse(BASE);

    expect(buildPrompt(params, 3)).toBe(todaysPrompt(3));
  });

  it("a traits object present but with all fields empty does not change the prompt", () => {
    const withoutTraits = storyParamsSchema.parse(BASE);
    const withEmptyTraits = storyParamsSchema.parse({
      ...BASE,
      traits: { child: {}, mother: {}, father: {} },
    });

    expect(buildPrompt(withEmptyTraits, 3)).toBe(buildPrompt(withoutTraits, 3));
  });

  it("a filled-in trait shows up in the prompt, with the right label", () => {
    const params = storyParamsSchema.parse({
      ...BASE,
      traits: {
        child: {
          hair: "ricci",
          eyeColor: "verdi",
          description: "ha sempre in mano un dinosauro di gomma",
        },
      },
    });

    const prompt = buildPrompt(params, 3);

    expect(prompt).toContain("Aspetto di Futura:");
    expect(prompt).toContain("capelli: ricci");
    expect(prompt).toContain("colore occhi: verdi");
    expect(prompt).toContain("dettaglio: ha sempre in mano un dinosauro di gomma");
  });

  it("the empty fields of a partially filled character do not end up in the prompt", () => {
    const params = storyParamsSchema.parse({
      ...BASE,
      traits: { child: { hair: "lisci" } },
    });

    const prompt = buildPrompt(params, 3);

    expect(prompt).toContain("Aspetto di Futura: capelli: lisci.");
    expect(prompt).not.toContain("colore capelli:");
    expect(prompt).not.toContain("colore occhi:");
    expect(prompt).not.toContain("corporatura:");
  });

  it("the mother's and father's traits use the name if filled in, otherwise the role", () => {
    const withNames = storyParamsSchema.parse({
      ...BASE,
      mother: "Silvia",
      father: "Luca",
      traits: { mother: { hair: "corti" }, father: { hair: "lunghi" } },
    });
    expect(buildPrompt(withNames, 3)).toContain("Aspetto di Silvia: capelli: corti.");
    expect(buildPrompt(withNames, 3)).toContain("Aspetto di Luca: capelli: lunghi.");

    const withoutNames = storyParamsSchema.parse({
      ...BASE,
      traits: { mother: { hair: "corti" }, father: { hair: "lunghi" } },
    });
    expect(buildPrompt(withoutNames, 3)).toContain("Aspetto della mamma: capelli: corti.");
    expect(buildPrompt(withoutNames, 3)).toContain("Aspetto del papà: capelli: lunghi.");
  });
});
