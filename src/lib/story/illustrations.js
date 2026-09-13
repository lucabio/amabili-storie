import { generateText } from "ai";

import { aiAvailable } from "@/lib/story/generate";

/**
 * Nano Banana (Gemini Flash Image): on the Gateway it is a language model that
 * returns the image among the `files`, not an "image model" for
 * `generateImage`. Chosen for the COHERENCE of the character between pages,
 * which is the real problem of a picture book.
 */
const IMAGE_MODEL =
  process.env.ILLUSTRATION_MODEL ?? "google/gemini-2.5-flash-image";

/** Raised when the AI is needed and the AI is not there: an illustration has no fallback. */
export class AiUnavailable extends Error {
  constructor() {
    super("AI Gateway non configurato: impossibile generare l'illustrazione.");
    this.name = "AiUnavailable";
  }
}

/**
 * Draws one image from a prompt and the reference images, in the order the
 * prompt names them (the character sheet, then the merchant's place). Returns the
 * raw bytes and the media type — saving them is the caller's job.
 *
 * The references are downloaded here and sent as bytes: the Gateway declares
 * every URL as supported, so the SDK would pass the URL through and leave the
 * fetch to the provider — which can never reach a local stack's 127.0.0.1.
 *
 * @returns {Promise<{bytes: Uint8Array, mediaType: string}>}
 */
export async function generateIllustration({ prompt, references = [] }) {
  if (!aiAvailable()) throw new AiUnavailable();

  const images = await Promise.all(
    references.map(async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Immagine di riferimento non leggibile (${response.status}).`);
      }
      return {
        type: "file",
        mediaType: response.headers.get("content-type") ?? "image",
        data: new Uint8Array(await response.arrayBuffer()),
      };
    }),
  );

  const result = await generateText({
    model: IMAGE_MODEL,
    messages: [{ role: "user", content: [...images, { type: "text", text: prompt }] }],
  });

  const image = result.files?.find((file) => file.mediaType?.startsWith("image/"));
  if (!image) {
    throw new Error("Il modello non ha restituito nessuna immagine.");
  }

  return { bytes: image.uint8Array, mediaType: image.mediaType };
}
