import { z } from "zod";

import { animaleIdSchema } from "@/lib/domain/animali";
import { capriccioIdSchema } from "@/lib/domain/capricci";
import { ALLINEAMENTI, FONT_KEYS } from "@/lib/storia/layout";

/**
 * I tratti di un personaggio: tutti opzionali, tutti stringhe vuote di default.
 * Nutrono sia il prompt del testo sia, domani, la generazione delle illustrazioni.
 * `descrizione` è il campo che vale di più: la descrizione libera breve dove un
 * genitore scrive "ha sempre in mano un dinosauro di gomma".
 */
const trattiPersonaggioSchema = z.object({
  capelli: z.string().trim().max(60).default(""),
  coloreCapelli: z.string().trim().max(60).default(""),
  coloreOcchi: z.string().trim().max(60).default(""),
  corporatura: z.string().trim().max(60).default(""),
  descrizione: z.string().trim().max(200).default(""),
});

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

    // prefault, non default: in Zod 4 `.default()` corto-circuita e restituirebbe
    // il valore così com'è (es. `{}` resterebbe `{}` invece di applicare i default
    // dei tre personaggi). `.prefault()` lo fa passare per lo schema interno.
    tratti: z
      .object({
        bambino: trattiPersonaggioSchema.prefault({}),
        mamma: trattiPersonaggioSchema.prefault({}),
        papa: trattiPersonaggioSchema.prefault({}),
      })
      .prefault({}),

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

/** Un riquadro sulla pagina: posizione e dimensione in frazioni (0–1). */
const riquadroSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  w: z.number().default(1),
  h: z.number().default(1),
});

/** Lo stile del testo di una pagina (a blocco: vale per tutto il testo). */
const stileTestoSchema = z.object({
  font: z.enum(FONT_KEYS).default("baloo2"),
  dimensione: z.number().min(8).max(60).default(16),
  colore: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colore non valido").default("#2b211d"),
  allineamento: z.enum(ALLINEAMENTI).default("center"),
  grassetto: z.boolean().default(false),
  corsivo: z.boolean().default(false),
});

/** L'impaginazione di una pagina. Assente = si usano i default (LAYOUT_DEFAULT). */
const layoutPaginaSchema = z.object({
  immagine: riquadroSchema.prefault({}),
  testo: riquadroSchema.prefault({}),
  stile: stileTestoSchema.prefault({}),
});

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
        // L'immagine generata dal backoffice, se c'è. `illustrazione` resta la
        // descrizione della scena (il prompt); questo è il risultato disegnato.
        illustrazioneUrl: z.url().nullish(),
        // Impaginazione: dove stanno immagine e testo, e con che stile. Assente
        // sulle storie vecchie: si ripiega sui default.
        layout: layoutPaginaSchema.nullish(),
      }),
    )
    .min(1),
  fraseAncora: z.string().trim().min(1, "La frase-àncora è il cuore del metodo"),
  guidaGenitori: z.array(z.string().trim().min(1)).min(2).max(4),
});
