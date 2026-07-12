import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHIAVE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Finché il progetto Supabase non esiste, l'app deve girare lo stesso. */
export function supabaseConfigurato() {
  return Boolean(URL_SUPABASE && CHIAVE_ANON);
}

/**
 * Client per Server Component, Route Handler e Server Action: parla come
 * l'utente loggato, quindi le RLS valgono.
 * Ritorna null se Supabase non è ancora configurato.
 */
export async function creaClientServer() {
  if (!supabaseConfigurato()) return null;

  const cookieStore = await cookies();

  return createServerClient(URL_SUPABASE, CHIAVE_ANON, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (daImpostare) => {
        try {
          for (const { name, value, options } of daImpostare) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Da un Server Component i cookie sono in sola lettura: il refresh
          // del token lo fa il proxy, qui possiamo ignorare.
        }
      },
    },
  });
}

/**
 * Client con service role: bypassa le RLS. Usare SOLO lato server, mai in
 * codice che finisce nel bundle del browser.
 */
export function creaClientAdmin() {
  const chiaveServizio = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!URL_SUPABASE || !chiaveServizio) return null;

  return createServerClient(URL_SUPABASE, chiaveServizio, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
