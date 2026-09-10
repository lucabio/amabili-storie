import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Until the Supabase project exists, the app still has to run. */
export function supabaseConfigured() {
  return Boolean(SUPABASE_URL && ANON_KEY);
}

/**
 * Client for Server Components, Route Handlers and Server Actions: it speaks as
 * the logged-in user, so RLS applies.
 * Returns null if Supabase is not configured yet.
 */
export async function createServerSupabase() {
  if (!supabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // From a Server Component cookies are read-only: the proxy refreshes
          // the token, so we can ignore it here.
        }
      },
    },
  });
}

/**
 * Client with the service role: it bypasses RLS. Use ONLY on the server, never
 * in code that ends up in the browser bundle.
 */
export function createAdminSupabase() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !serviceRoleKey) return null;

  return createServerClient(SUPABASE_URL, serviceRoleKey, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
