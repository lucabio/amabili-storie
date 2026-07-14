import { z } from "zod";

import { parametriStoriaSchema } from "@/lib/storia/schema";

/** In centesimi. Il denaro non si tiene mai in virgola mobile. */
export const LISTINO = {
  ebook: 990,
  cartaceo: 3490,
};

export const formatoSchema = z.enum(["ebook", "cartaceo"]);

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
    prezzoCents: LISTINO[ordine.formato],
  }));
