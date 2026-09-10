import { generateObject } from "ai";

import { fallbackStory } from "@/lib/story/fallback";
import { buildPrompt, buildSystemPrompt } from "@/lib/story/prompt";
import { generatedStorySchema } from "@/lib/story/schema";

/** Pages of the free preview. */
export const PREVIEW_PAGES = 3;

/** Pages of the full eBook. */
export const BOOK_PAGES = 22;

const MODEL = process.env.STORY_MODEL ?? "anthropic/claude-sonnet-5";

/** Raised when the AI is needed and the AI is not there. The workflow treats it as fatal. */
export class AiUnavailable extends Error {
  constructor() {
    super(
      "AI Gateway non configurato: un libro acquistato non può uscire dai template.",
    );
    this.name = "AiUnavailable";
  }
}

/**
 * On Vercel the Gateway authenticates itself via OIDC; locally the key is
 * needed. It holds for both the text and the illustrations: they go through the
 * same Gateway.
 */
export function aiAvailable() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

/**
 * `allowFallback` is the difference between a preview and a product.
 *
 * For the free preview (and for `npm run dev`) the templates are a convenience:
 * without them the project would not be developable bare-handed. For the paid
 * book they are a trap — all identical, without the merchant's `prompt_guida` —
 * and nobody would notice until a parent reads it. So there we fail, loudly.
 *
 * @returns {Promise<{story: object, source: "ai" | "fallback"}>}
 */
export async function generateStory({
  params,
  brand,
  pageCount = PREVIEW_PAGES,
  allowFallback = true,
}) {
  if (!aiAvailable()) {
    if (!allowFallback) throw new AiUnavailable();

    console.warn(
      "AI Gateway non configurato: uso i template di fallback. Imposta AI_GATEWAY_API_KEY.",
    );
    return { story: fallbackStory(params, pageCount), source: "fallback" };
  }

  const { object } = await generateObject({
    model: MODEL,
    schema: generatedStorySchema(pageCount),
    system: buildSystemPrompt(brand),
    prompt: buildPrompt(params, pageCount),
    temperature: 0.85,
  });

  return { story: object, source: "ai" };
}
