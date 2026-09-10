import { generateText } from "ai";

import { aiAvailable } from "@/lib/story/generate";
import { buildIllustrationPrompt } from "@/lib/story/prompt";

/**
 * Nano Banana (Gemini Flash Image): on the Gateway it is a language model that
 * returns the image among the `files`, not an "image model" for
 * `generateImage`. Chosen for the COHERENCE of the character between pages,
 * which is the real problem of a picture book.
 */
const IMAGE_MODEL =
  process.env.MODELLO_ILLUSTRAZIONI ?? "google/gemini-2.5-flash-image";

/** Raised when the AI is needed and the AI is not there: an illustration has no fallback. */
export class AiUnavailable extends Error {
  constructor() {
    super("AI Gateway non configurato: impossibile generare l'illustrazione.");
    this.name = "AiUnavailable";
  }
}

/**
 * Generates the illustration of one page. Returns the raw image bytes and its
 * media type — saving it to storage is the caller's responsibility.
 *
 * @returns {Promise<{bytes: Uint8Array, mediaType: string}>}
 */
export async function generateIllustration({ scene, params }) {
  if (!aiAvailable()) throw new AiUnavailable();

  const result = await generateText({
    model: IMAGE_MODEL,
    prompt: buildIllustrationPrompt({ scene, params }),
  });

  const image = result.files?.find((file) => file.mediaType?.startsWith("image/"));
  if (!image) {
    throw new Error("Il modello non ha restituito nessuna immagine.");
  }

  return { bytes: image.uint8Array, mediaType: image.mediaType };
}
