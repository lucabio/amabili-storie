import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { creaClientServer, supabaseConfigurato } from "@/lib/supabase/server";

/**
 * Risolve il brand a partire dallo slug di `?version=`.
 *
 * Senza `?version=` si cerca comunque il brand `amabili` su Supabase: il sito
 * principale non è più una costante, ma una riga come le altre, modificabile
 * dal backoffice. Un brand sconosciuto, disattivato o malformato non è un
 * errore fatale, e nemmeno lo è Supabase non configurato: si serve
 * `BRAND_DEFAULT`. Un ospite che sbaglia a copiare il link — o che apre il
 * sito prima ancora che il database esista — deve comunque vedere Amabili
 * Storie, non una pagina rotta.
 */
export async function risolviBrand(slug) {
  const slugEffettivo = slug || BRAND_DEFAULT.slug;
  if (!supabaseConfigurato()) return BRAND_DEFAULT;

  const supabase = await creaClientServer();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slugEffettivo)
    .eq("attivo", true)
    .maybeSingle();

  if (error) {
    console.error(`Lettura brand "${slugEffettivo}" fallita:`, error.message);
    return BRAND_DEFAULT;
  }

  return brandDaRiga(data) ?? BRAND_DEFAULT;
}

/** Estrae lo slug da `searchParams` (già risolti). Next 16: sono una Promise. */
export function slugDaSearchParams(searchParams) {
  const grezzo = searchParams?.version;
  const valore = Array.isArray(grezzo) ? grezzo[0] : grezzo;
  return typeof valore === "string" && valore.trim() ? valore.trim() : null;
}
