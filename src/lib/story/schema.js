import { z } from "zod";

import { animalIdSchema } from "@/lib/domain/animals";
import { whimIdSchema } from "@/lib/domain/whims";
import { ALIGNMENTS, FONT_KEYS } from "@/lib/story/layout";

/**
 * A character's traits: all optional, all empty strings by default. They feed
 * both the text prompt and the illustration generation. `descrizione` is the
 * field that is worth the most: the short free-form description where a parent
 * writes "ha sempre in mano un dinosauro di gomma".
 */
const characterTraitsSchema = z.object({
  hair: z.string().trim().max(60).default(""),
  hairColor: z.string().trim().max(60).default(""),
  eyeColor: z.string().trim().max(60).default(""),
  build: z.string().trim().max(60).default(""),
  description: z.string().trim().max(200).default(""),
});

/** What the wizard sends to the server. Validated at the API boundary. */
export const storyParamsSchema = z
  .object({
    whim: whimIdSchema,
    /** Required only when whim === "altro". */
    customWhim: z.string().trim().max(300).default(""),

    family: z.enum(["umani", "animali"]),
    animal: animalIdSchema.nullish().default(null),

    name: z.string().trim().min(1, "Serve il nome del bambino").max(40),
    gender: z.enum(["bimbo", "bimba"]),
    age: z.coerce.number().int().min(2).max(7),

    mother: z.string().trim().max(40).default(""),
    father: z.string().trim().max(40).default(""),
    detail: z.string().trim().max(300).default(""),

    // prefault, not default: in Zod 4 `.default()` short-circuits and would
    // return the value as-is (e.g. `{}` would stay `{}` instead of applying the
    // defaults of the three characters). `.prefault()` runs it through the
    // inner schema.
    traits: z
      .object({
        child: characterTraitsSchema.prefault({}),
        mother: characterTraitsSchema.prefault({}),
        father: characterTraitsSchema.prefault({}),
      })
      .prefault({}),

    /** Brand slug: decides which guide prompt is applied to the story. */
    brand: z.string().trim().default("amabili"),
  })
  .refine((params) => params.family !== "animali" || Boolean(params.animal), {
    message: "Scegli che animali sono",
    path: ["animal"],
  })
  .refine((params) => params.whim !== "altro" || params.customWhim.length > 0, {
    message: "Raccontaci qual è il capriccio",
    path: ["customWhim"],
  });

/**
 * Shape of the story produced by the model. Passed to `generateObject`, so every
 * `.describe()` is an instruction for the model, not just documentation.
 */
export function generatedStorySchema(pageCount) {
  return z.object({
    title: z
      .string()
      .describe("Titolo del libro, evocativo, che contiene il nome del bambino."),
    pages: z
      .array(
        z.object({
          text: z
            .string()
            .describe(
              "Il testo della pagina: 2-4 frasi, lette ad alta voce da un genitore.",
            ),
          illustration: z
            .string()
            .describe(
              "Descrizione della scena da illustrare, in una frase. Nessun testo nell'immagine.",
            ),
        }),
      )
      .length(pageCount)
      .describe(`Esattamente ${pageCount} pagine, che seguono l'arco narrativo.`),
    anchorPhrase: z
      .string()
      .describe(
        "La frase-àncora: una frase breve, detta da un personaggio nella storia, che i genitori possono riusare nella vita reale.",
      ),
    parentGuide: z
      .array(z.string())
      .min(2)
      .max(4)
      .describe("Consigli pratici per il genitore, uno per riga, concreti e attuabili."),
  });
}

/** A box on the page: position and size as fractions (0–1). */
const boxSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  w: z.number().default(1),
  h: z.number().default(1),
});

/** The text style of a page (block-level: it applies to the whole text). */
const textStyleSchema = z.object({
  font: z.enum(FONT_KEYS).default("baloo2"),
  size: z.number().min(8).max(60).default(16),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colore non valido").default("#2b211d"),
  align: z.enum(ALIGNMENTS).default("center"),
  bold: z.boolean().default(false),
  italic: z.boolean().default(false),
});

/** The layout of one page. Absent = the defaults are used (DEFAULT_LAYOUT). */
const pageLayoutSchema = z.object({
  image: boxSchema.prefault({}),
  text: boxSchema.prefault({}),
  style: textStyleSchema.prefault({}),
});

/**
 * The content of a saved story. It is the same schema the model produces, but
 * with a free page count: it validates the corrections made by hand in the
 * backoffice, because a manual edit must not be able to produce a malformed
 * book.
 */
export const storyContentSchema = z.object({
  title: z.string().trim().min(1, "Il titolo non può essere vuoto"),
  pages: z
    .array(
      z.object({
        text: z.string().trim().min(1, "Una pagina non può essere vuota"),
        illustration: z.string().trim().min(1, "Serve la descrizione della scena"),
        // The image generated from the backoffice, if there is one.
        // `illustrazione` stays the scene description (the prompt); this is the
        // drawn result.
        illustrationUrl: z.url().nullish(),
        // Layout: where image and text sit, and with what style. Absent on old
        // stories: we fall back to the defaults.
        layout: pageLayoutSchema.nullish(),
      }),
    )
    .min(1),
  anchorPhrase: z.string().trim().min(1, "La frase-àncora è il cuore del metodo"),
  parentGuide: z.array(z.string().trim().min(1)).min(2).max(4),
});
