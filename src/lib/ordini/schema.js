import { z } from "zod";

import { parametriStoriaSchema } from "@/lib/storia/schema";

/**
 * Il listino, in un posto solo. Ogni voce porta il prezzo (in centesimi — il
 * denaro non si tiene mai in virgola mobile) e l'etichetta da mostrare
 * all'utente, così che nome e prezzo non finiscano scritti a mano in giro
 * per i componenti.
 */
export const LISTINO = {
  ebook: { etichetta: "eBook", prezzoCents: 990 },
  brossura: { etichetta: "Brossura", prezzoCents: 2490 },
  rilegato: { etichetta: "Rilegato", prezzoCents: 3490 },
};

export const formatoSchema = z.enum(Object.keys(LISTINO));

/** `3490` → `"34,90 €"`. Mai `"34,9 €"`: i centesimi non si troncano. */
export function formattaPrezzo(prezzoCents) {
  return (prezzoCents / 100).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

/**
 * Il prezzo non arriva dal client: lo si prende dal listino a partire dal
 * formato. `transform` sovrascrive qualunque cosa il browser abbia mandato —
 * è la ragione per cui questo schema esiste.
 */
export const ordineSchema = z
  .object({
    email: z.email(),
    formato: formatoSchema,
    parametri: parametriStoriaSchema,
  })
  .transform((ordine) => ({
    ...ordine,
    prezzoCents: LISTINO[ordine.formato].prezzoCents,
  }));
