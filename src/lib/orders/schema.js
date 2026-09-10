import { z } from "zod";

import { storyParamsSchema } from "@/lib/story/schema";

/**
 * The price list, in one place. Every entry carries the price (in cents — money
 * is never kept in floating point) and the label to show the user, so that name
 * and price do not end up hand-written across the components.
 *
 * The keys are the format values stored in `ordini.formato`: they stay Italian
 * because they are data, and the DB check constraint knows them by that name.
 */
export const PRICE_LIST = {
  ebook: { label: "eBook", priceCents: 990 },
  brossura: { label: "Brossura", priceCents: 2490 },
  rilegato: { label: "Rilegato", priceCents: 3490 },
};

export const formatSchema = z.enum(Object.keys(PRICE_LIST));

/** `3490` → `"34,90 €"`. Never `"34,9 €"`: cents are not truncated. */
export function formatPrice(priceCents) {
  return (priceCents / 100).toLocaleString("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

/**
 * The price does not come from the client: it is taken from the price list
 * given the format. `transform` overwrites whatever the browser sent — that is
 * the reason this schema exists.
 */
export const orderSchema = z
  .object({
    email: z.email(),
    format: formatSchema,
    params: storyParamsSchema,
  })
  .transform((order) => ({
    ...order,
    priceCents: PRICE_LIST[order.format].priceCents,
  }));
