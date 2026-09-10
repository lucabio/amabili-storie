import { z } from "zod";

import { WHIM_IDS } from "@/lib/domain/whims";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colore esadecimale non valido");

/**
 * A brand is a white-label version of the portal (e.g. Hotel Famiglia Serena,
 * reachable at amabilistorie.com/?version=famiglia_serena).
 *
 * `guidePrompt` is the piece that characterises the product: it is the common
 * thread every story of that merchant has to follow (e.g. "the story takes
 * place during a stay at Hotel Famiglia Serena, in Val Gardena").
 */
export const brandSchema = z.object({
  /** null for the main site: BRAND_DEFAULT does not live on Supabase. */
  id: z.uuid().nullable().default(null),
  slug: z.string().min(1),
  name: z.string().min(1),
  active: z.boolean().default(true),

  // prefault, not default: in Zod 4 `.default()` short-circuits and returns the
  // value as-is, without applying the defaults of the inner fields. `{}` would
  // stay `{}`. `.prefault()` instead runs it through the schema, which is what
  // we need here.
  theme: z
    .object({
      accento: hexColor.default("#e96d4f"),
      accentoSoft: hexColor.default("#f6b27c"),
      scuro: hexColor.default("#43302a"),
    })
    .prefault({}),

  logoUrl: z.url().nullable().default(null),

  hero: z
    .object({
      occhiello: z.string().default("Amabili Storie"),
      titolo: z.string().default("Il libro personalizzato che risolve"),
      titoloAccento: z.string().default("il capriccio di stasera"),
      sottotitolo: z
        .string()
        .default(
          "Tuo figlio diventa il protagonista di una storia illustrata, creata in pochi minuti, che lo aiuta davvero: dormire da solo, salutare il pannolino, accogliere il fratellino…",
        ),
      cta: z.string().default("Crea la storia gratis"),
    })
    .prefault({}),

  /** The common thread of the merchant's stories. Goes straight into the system prompt. */
  guidePrompt: z.string().nullable().default(null),

  /** Subset of whims offered by the merchant. null = all of them. */
  whims: z.array(z.enum(WHIM_IDS)).min(1).nullable().default(null),

  /**
   * A merchant that gives stories away to its guests does not show the price
   * list. But it is not independent from `acceptsPayments`: showing a price
   * list nobody can pay is the contradiction the `.transform()` below removes.
   */
  showPrices: z.boolean().default(true),

  /**
   * false = the merchant gives the stories away: no checkout, no prices, the
   * order is still created at zero price. Different from `showPrices`, which
   * only hides the price list in the shop window but leaves a paid checkout —
   * and only as long as `acceptsPayments` stays true. The opposite (prices on
   * display, no way to pay them) is not a legitimate combination.
   */
  acceptsPayments: z.boolean().default(true),
})
  .transform((brand) => ({
    ...brand,
    // The relation between the two fields is enforced here, nowhere else:
    // `brandSchema` is the bottleneck EVERY brand goes through, however it was
    // born — a row written from the backoffice, a row written by hand on
    // Supabase (Studio or service role, which RLS does not see), or
    // BRAND_DEFAULT. A merchant that does not accept payments never shows the
    // price list, whatever `showPrices` says: not a validation error (which
    // would make `brandFromRow` fall back to BRAND_DEFAULT, hiding the whole
    // brand), but a silent correction, because the inconsistent case must not
    // be able to exist downstream, full stop.
    showPrices: brand.acceptsPayments && brand.showPrices,
  }));

/** The default brand: amabilistorie.com without `?version=`. */
export const BRAND_DEFAULT = brandSchema.parse({
  slug: "amabili",
  name: "Amabili Storie",
});

/**
 * Normalizes a row of the Supabase `brands` table (snake_case) into the shape
 * the app uses. Returns null if the row is invalid: better to serve the default
 * brand than to break a customer's page.
 */
export function brandFromRow(row) {
  if (!row) return null;

  const result = brandSchema.safeParse({
    id: row.id ?? null,
    slug: row.slug,
    name: row.nome,
    active: row.attivo,
    theme: row.tema ?? undefined,
    logoUrl: row.logo_url ?? null,
    hero: row.hero ?? undefined,
    guidePrompt: row.prompt_guida ?? null,
    whims: row.capricci ?? null,
    showPrices: row.mostra_prezzi,
    acceptsPayments: row.accetta_pagamenti,
  });

  if (!result.success) {
    console.error(`Brand "${row.slug}" non valido:`, result.error.issues);
    return null;
  }
  return result.data;
}
