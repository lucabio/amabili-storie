import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { creaClientServer, supabaseConfigurato } from "@/lib/supabase/server";

/**
 * Risolve il brand a partire dallo slug di `?version=`.
 *
 * Un brand sconosciuto, disattivato o malformato non è un errore fatale: si
 * serve il brand di default. Un ospite che sbaglia a copiare il link deve
 * comunque vedere Amabili Storie, non una pagina rotta.
 */
export async function risolviBrand(slug) {
  if (!slug || slug === BRAND_DEFAULT.slug) return BRAND_DEFAULT;
  if (!supabaseConfigurato()) return BRAND_DEFAULT;

  const supabase = await creaClientServer();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .eq("attivo", true)
    .maybeSingle();

  if (error) {
    console.error(`Lettura brand "${slug}" fallita:`, error.message);
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
