import { z } from "zod";

import { CAPRICCIO_IDS } from "@/lib/domain/capricci";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Colore esadecimale non valido");

/**
 * Un brand è una versione white-label del portale (es. Hotel Famiglia Serena,
 * raggiungibile da amabilistorie.com/?version=famiglia_serena).
 *
 * `promptGuida` è il pezzo che caratterizza il prodotto: è il filo comune che
 * ogni storia di quell'ente deve seguire (es. "la storia si svolge durante un
 * soggiorno all'Hotel Famiglia Serena, in Val Gardena").
 */
export const brandSchema = z.object({
  /** null per il sito principale: BRAND_DEFAULT non sta su Supabase. */
  id: z.uuid().nullable().default(null),
  slug: z.string().min(1),
  nome: z.string().min(1),
  attivo: z.boolean().default(true),

  // prefault, non default: in Zod 4 `.default()` corto-circuita e restituisce il
  // valore così com'è, senza applicare i default dei campi interni. `{}` resterebbe
  // `{}`. `.prefault()` lo fa invece passare per lo schema, che è ciò che serve qui.
  tema: z
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

  /** Il filo comune delle storie dell'ente. Va dritto nel system prompt. */
  promptGuida: z.string().nullable().default(null),

  /** Sottoinsieme di capricci offerto dall'ente. null = tutti. */
  capricci: z.array(z.enum(CAPRICCIO_IDS)).min(1).nullable().default(null),

  /** Un ente che regala le storie agli ospiti non mostra il listino. */
  mostraPrezzi: z.boolean().default(true),

  /**
   * false = l'ente regala le storie: niente checkout, niente prezzi, l'ordine
   * nasce comunque a prezzo zero. Diverso da `mostraPrezzi`, che nasconde solo
   * il listino in vetrina ma lascia un checkout a pagamento.
   */
  accettaPagamenti: z.boolean().default(true),
});

/** Il brand di default: amabilistorie.com senza `?version=`. */
export const BRAND_DEFAULT = brandSchema.parse({
  slug: "amabili",
  nome: "Amabili Storie",
});

/**
 * Normalizza una riga della tabella `brands` di Supabase (snake_case) nella
 * forma usata dall'app. Ritorna null se la riga non è valida: meglio servire il
 * brand di default che rompere la pagina di un cliente.
 */
export function brandDaRiga(riga) {
  if (!riga) return null;

  const risultato = brandSchema.safeParse({
    id: riga.id ?? null,
    slug: riga.slug,
    nome: riga.nome,
    attivo: riga.attivo,
    tema: riga.tema ?? undefined,
    logoUrl: riga.logo_url ?? null,
    hero: riga.hero ?? undefined,
    promptGuida: riga.prompt_guida ?? null,
    capricci: riga.capricci ?? null,
    mostraPrezzi: riga.mostra_prezzi,
    accettaPagamenti: riga.accetta_pagamenti,
  });

  if (!risultato.success) {
    console.error(`Brand "${riga.slug}" non valido:`, risultato.error.issues);
    return null;
  }
  return risultato.data;
}
