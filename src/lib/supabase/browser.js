import { createBrowserClient } from "@supabase/ssr";

/**
 * Client per i Client Component (login del backoffice).
 * Ritorna null se Supabase non è ancora configurato.
 */
export function creaClientBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chiave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chiave) return null;

  return createBrowserClient(url, chiave);
}
