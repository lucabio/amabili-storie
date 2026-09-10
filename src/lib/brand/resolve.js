import { BRAND_DEFAULT, brandFromRow } from "@/lib/brand/schema";
import { createServerSupabase, supabaseConfigured } from "@/lib/supabase/server";

/**
 * Resolves the brand from the `?version=` slug.
 *
 * Without `?version=` we still look up the `amabili` brand on Supabase: the
 * main site is no longer a constant but a row like any other, editable from the
 * backoffice. An unknown, disabled or malformed brand is not a fatal error, and
 * neither is Supabase not being configured: we serve `BRAND_DEFAULT`. A guest
 * who mistypes the link — or who opens the site before the database even
 * exists — must still see Amabili Storie, not a broken page.
 */
export async function resolveBrand(slug) {
  const effectiveSlug = slug || BRAND_DEFAULT.slug;
  if (!supabaseConfigured()) return BRAND_DEFAULT;

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", effectiveSlug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    console.error(`Lettura brand "${effectiveSlug}" fallita:`, error.message);
    return BRAND_DEFAULT;
  }

  return brandFromRow(data) ?? BRAND_DEFAULT;
}

/** Extracts the slug from `searchParams` (already resolved). Next 16: it is a Promise. */
export function slugFromSearchParams(searchParams) {
  const raw = searchParams?.version;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
