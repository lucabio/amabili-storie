import { generateObject } from "ai";

import { storiaFallback } from "@/lib/storia/fallback";
import { costruisciPrompt, costruisciSystemPrompt } from "@/lib/storia/prompt";
import { storiaGenerataSchema } from "@/lib/storia/schema";

/** Pagine dell'anteprima gratuita. */
export const PAGINE_ANTEPRIMA = 3;

/** Pagine dell'eBook completo. */
export const PAGINE_LIBRO = 22;

const MODELLO = process.env.MODELLO_STORIE ?? "anthropic/claude-sonnet-5";

/** Alzata quando serve l'AI e l'AI non c'è. Il workflow la tratta come fatale. */
export class AiNonDisponibile extends Error {
  constructor() {
    super(
      "AI Gateway non configurato: un libro acquistato non può uscire dai template.",
    );
    this.name = "AiNonDisponibile";
  }
}

/**
 * Su Vercel il Gateway si autentica da solo via OIDC; in locale serve la chiave.
 */
function aiDisponibile() {
  return Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN);
}

/**
 * `consentiFallback` è la differenza fra un'anteprima e un prodotto.
 *
 * Per l'anteprima gratuita (e per `npm run dev`) i template sono una comodità:
 * senza, il progetto non sarebbe sviluppabile a mani nude. Per il libro pagato
 * sono una trappola — tutti uguali, senza il `prompt_guida` dell'ente — e nessuno
 * se ne accorgerebbe finché non lo legge un genitore. Quindi lì si fallisce, forte.
 *
 * @returns {Promise<{storia: object, fonte: "ai" | "fallback"}>}
 */
export async function generaStoria({
  parametri,
  brand,
  numeroPagine = PAGINE_ANTEPRIMA,
  consentiFallback = true,
}) {
  if (!aiDisponibile()) {
    if (!consentiFallback) throw new AiNonDisponibile();

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
