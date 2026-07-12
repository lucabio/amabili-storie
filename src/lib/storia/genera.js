import { generateObject } from "ai";

import { storiaFallback } from "@/lib/storia/fallback";
import { costruisciPrompt, costruisciSystemPrompt } from "@/lib/storia/prompt";
import { storiaGenerataSchema } from "@/lib/storia/schema";

/** Pagine dell'anteprima gratuita; l'eBook completo ne ha 20-24. */
export const PAGINE_ANTEPRIMA = 3;

const MODELLO = process.env.MODELLO_STORIE ?? "anthropic/claude-sonnet-5";

/**
 * Su Vercel il Gateway si autentica da solo via OIDC; in locale serve la chiave.
 * Senza, si usano i template del demo: così `npm run dev` funziona a mani nude.
 */
function aiDisponibile() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

/**
 * @returns {Promise<{storia: object, fonte: "ai" | "fallback"}>}
 */
export async function generaStoria({ parametri, brand, numeroPagine = PAGINE_ANTEPRIMA }) {
  if (!aiDisponibile()) {
    console.warn(
      "AI Gateway non configurato: uso i template di fallback. Imposta AI_GATEWAY_API_KEY.",
    );
    return { storia: storiaFallback(parametri, numeroPagine), fonte: "fallback" };
  }

  const { object } = await generateObject({
    model: MODELLO,
    schema: storiaGenerataSchema(numeroPagine),
    system: costruisciSystemPrompt(brand),
    prompt: costruisciPrompt(parametri, numeroPagine),
    temperature: 0.85,
  });

  return { storia: object, fonte: "ai" };
}
