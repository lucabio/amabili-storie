import { generateText } from "ai";

import { aiDisponibile } from "@/lib/storia/genera";
import { costruisciPromptIllustrazione } from "@/lib/storia/prompt";

/**
 * Nano Banana (Gemini Flash Image): sul Gateway è un language model che
 * restituisce l'immagine fra i `files`, non un "image model" da `generateImage`.
 * Scelto per la COERENZA del personaggio fra le pagine, che è il nodo vero di
 * un libro illustrato.
 */
const MODELLO_IMMAGINI =
  process.env.MODELLO_ILLUSTRAZIONI ?? "google/gemini-2.5-flash-image";

/** Alzata quando serve l'AI e l'AI non c'è: un'illustrazione non ha fallback. */
export class AiNonDisponibile extends Error {
  constructor() {
    super("AI Gateway non configurato: impossibile generare l'illustrazione.");
    this.name = "AiNonDisponibile";
  }
}

/**
 * Genera l'illustrazione di una pagina. Ritorna i byte grezzi dell'immagine e il
 * suo media type — il salvataggio su storage è responsabilità di chi chiama.
 *
 * @returns {Promise<{bytes: Uint8Array, mediaType: string}>}
 */
export async function generaIllustrazione({ scena, parametri }) {
  if (!aiDisponibile()) throw new AiNonDisponibile();

  const risultato = await generateText({
    model: MODELLO_IMMAGINI,
    prompt: costruisciPromptIllustrazione({ scena, parametri }),
  });

  const immagine = risultato.files?.find((file) =>
    file.mediaType?.startsWith("image/"),
  );
  if (!immagine) {
    throw new Error("Il modello non ha restituito nessuna immagine.");
  }

  return { bytes: immagine.uint8Array, mediaType: immagine.mediaType };
}
