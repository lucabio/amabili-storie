import { z } from "zod";

import { animaleIdSchema } from "@/lib/domain/animali";
import { capriccioIdSchema } from "@/lib/domain/capricci";

/** Quello che il wizard manda al server. Validato al confine dell'API. */
export const parametriStoriaSchema = z
  .object({
    capriccio: capriccioIdSchema,
    /** Obbligatorio solo quando capriccio === "altro". */
    capriccioLibero: z.string().trim().max(300).default(""),

    famiglia: z.enum(["umani", "animali"]),
    animale: animaleIdSchema.nullish().default(null),

    nome: z.string().trim().min(1, "Serve il nome del bambino").max(40),
    genere: z.enum(["bimbo", "bimba"]),
    eta: z.coerce.number().int().min(2).max(7),

    mamma: z.string().trim().max(40).default(""),
    papa: z.string().trim().max(40).default(""),
    dettaglio: z.string().trim().max(300).default(""),

    /** Slug del brand: decide il prompt guida applicato alla storia. */
    brand: z.string().trim().default("amabili"),
  })
  .refine((d) => d.famiglia !== "animali" || Boolean(d.animale), {
    message: "Scegli che animali sono",
    path: ["animale"],
  })
  .refine((d) => d.capriccio !== "altro" || d.capriccioLibero.length > 0, {
    message: "Raccontaci qual è il capriccio",
    path: ["capriccioLibero"],
  });

/**
 * Forma della storia prodotta dal modello. Passata a `generateObject`, quindi
 * ogni `.describe()` è istruzione per il modello, non solo documentazione.
 */
export function storiaGenerataSchema(numeroPagine) {
  return z.object({
    titolo: z
      .string()
      .describe("Titolo del libro, evocativo, che contiene il nome del bambino."),
    pagine: z
      .array(
        z.object({
          testo: z
            .string()
            .describe(
              "Il testo della pagina: 2-4 frasi, lette ad alta voce da un genitore.",
            ),
          illustrazione: z
            .string()
            .describe(
              "Descrizione della scena da illustrare, in una frase. Nessun testo nell'immagine.",
            ),
        }),
      )
      .length(numeroPagine)
      .describe(`Esattamente ${numeroPagine} pagine, che seguono l'arco narrativo.`),
    fraseAncora: z
      .string()
      .describe(
        "La frase-àncora: una frase breve, detta da un personaggio nella storia, che i genitori possono riusare nella vita reale.",
      ),
    guidaGenitori: z
      .array(z.string())
      .min(2)
      .max(4)
      .describe("Consigli pratici per il genitore, uno per riga, concreti e attuabili."),
  });
}

/**
 * Il contenuto di una storia salvata. È lo stesso schema che il modello produce,
 * ma con un numero di pagine libero: serve a validare le correzioni fatte a mano
 * nel backoffice, perché una modifica manuale non può produrre un libro malformato.
 */
export const contenutoStoriaSchema = z.object({
  titolo: z.string().trim().min(1, "Il titolo non può essere vuoto"),
  pagine: z
    .array(
      z.object({
        testo: z.string().trim().min(1, "Una pagina non può essere vuota"),
        illustrazione: z.string().trim().min(1, "Serve la descrizione della scena"),
      }),
    )
    .min(1),
  fraseAncora: z.string().trim().min(1, "La frase-àncora è il cuore del metodo"),
  guidaGenitori: z.array(z.string().trim().min(1)).min(2).max(4),
});
