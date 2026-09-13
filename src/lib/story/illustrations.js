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
 * Draws one image from a prompt and, optionally, a reference image (the public
 * URL of the character sheet). Returns the raw bytes and the media type — saving
 * them is the caller's job.
 *
 * The reference is downloaded here and sent as bytes: the Gateway declares every
 * URL as supported, so the SDK would pass the URL through and leave the fetch to
 * the provider — which can never reach a local stack's 127.0.0.1.
 *
 * @returns {Promise<{bytes: Uint8Array, mediaType: string}>}
 */
export async function generateIllustration({ prompt, reference }) {
  if (!aiAvailable()) throw new AiUnavailable();

  const content = [{ type: "text", text: prompt }];
  if (reference) {
    const response = await fetch(reference);
    if (!response.ok) {
      throw new Error(`Foglio personaggi non leggibile (${response.status}).`);
    }
    content.unshift({
      type: "file",
      mediaType: response.headers.get("content-type") ?? "image",
      data: new Uint8Array(await response.arrayBuffer()),
    });
  }

  const result = await generateText({
    model: IMAGE_MODEL,
    messages: [{ role: "user", content }],
  });

  const image = result.files?.find((file) => file.mediaType?.startsWith("image/"));
  if (!image) {
    throw new Error("Il modello non ha restituito nessuna immagine.");
  }

  return { bytes: image.uint8Array, mediaType: image.mediaType };
}
