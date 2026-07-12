import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Next 16: quello che prima era `middleware.js` ora si chiama `proxy.js` e gira
 * sul runtime Node (l'edge non è supportato qui).
 *
 * Serve a una cosa sola: rinfrescare il token di sessione di Supabase, perché
 * un Server Component non può scrivere cookie. Senza questo, l'admin verrebbe
 * sloggato alla scadenza del token.
 */
export async function proxy(request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chiave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let risposta = NextResponse.next({ request });

  if (!url || !chiave) return risposta;

  const supabase = createServerClient(url, chiave, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (daImpostare) => {
        for (const { name, value } of daImpostare) {
          request.cookies.set(name, value);
        }
        risposta = NextResponse.next({ request });
        for (const { name, value, options } of daImpostare) {
          risposta.cookies.set(name, value, options);
        }
      },
    },
  });

  // Non rimuovere: è la chiamata che rinnova il token e riscrive i cookie.
  await supabase.auth.getUser();

  return risposta;
}

export const config = {
  matcher: ["/admin/:path*"],
};
