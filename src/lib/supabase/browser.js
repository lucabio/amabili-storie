import { createBrowserClient } from "@supabase/ssr";

/**
 * Client for Client Components (the backoffice login).
 * Returns null if Supabase is not configured yet.
 */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  return createBrowserClient(url, key);
}
