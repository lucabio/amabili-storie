"use server";

import { resolveBrand } from "@/lib/brand/resolve";
import { leadSchema } from "@/lib/lead/schema";
import { createAdminSupabase } from "@/lib/supabase/server";

/**
 * Saves a lead: called from the purchase form of `StoryPreview` when `buy()`
 * could not complete the order. There is no separate "leave your email" box in
 * the wizard any more: since the pre-launch waiting list was replaced by a real
 * purchase, the only point where a parent leaves their email is the purchase
 * form itself — so that is where the lead is captured, when buying fails, not
 * with a new box.
 *
 * It is a Server Action, so an HTTP endpoint reachable directly: nothing coming
 * from the client is trusted. The email is re-validated with Zod, and the brand
 * is resolved from the database via `resolveBrand` — never from an id the client
 * could make up.
 *
 * The `unique (email, brand_id)` constraint means someone who leaves their email
 * twice does not see an error: `ignoreDuplicates` silently skips the insert if
 * the pair already exists. A duplicate is not a failure, it is a person coming
 * back.
 *
 * Fails silently (never an error that blocks the user): losing a lead to a
 * network problem is less serious than breaking the purchase error message the
 * user is already reading.
 */
export async function saveLead(rawData) {
  const result = leadSchema.safeParse(rawData);
  if (!result.success) return { error: "Email non valida." };

  const db = createAdminSupabase();
  if (!db) return { error: "Supabase non è configurato." };

  const brand = await resolveBrand(result.data.brand);

  const { error } = await db.from("leads").upsert(
    {
      email: result.data.email,
      brand_id: brand.id ?? null,
    },
    { onConflict: "email,brand_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("Salvataggio lead fallito:", error.message);
    return { error: "Lead non salvato." };
  }

  return { ok: true };
}
