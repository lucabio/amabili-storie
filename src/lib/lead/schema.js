import { z } from "zod";

/**
 * A lead: the email of a parent who generated the free preview and tried to
 * buy, but the purchase did not go through (checkout not active yet, server
 * error...). It is the most valuable person to get back to — whoever gets this
 * far has already written a story, already seen the first pages, and already
 * left their email.
 *
 * The brand arrives as a slug, not as an id: the truth about the brand — and so
 * its id, which also decides the `unique (email, brand_id)` constraint — is read
 * by `saveLead` from the database via `resolveBrand`, never from an id the
 * client could declare.
 */
export const leadSchema = z.object({
  email: z.email(),
  brand: z.string().trim().min(1).default("amabili"),
});
