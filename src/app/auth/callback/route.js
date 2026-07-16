import { NextResponse } from "next/server";

import { creaClientServer } from "@/lib/supabase/server";

/**
 * Dove atterra il magic link della mail di accesso.
 *
 * Supabase rimanda qui con un `code` da scambiare per una sessione. Lo scambio
 * riesce solo nel browser che ha chiesto il codice — è il flusso PKCE, e il
 * verificatore sta in un cookie di quel browser. Chi apre la mail sul telefono
 * e sta lavorando sul portatile finisce qui con un errore: lo rimandiamo al
 * login, dove il codice a 6 cifre funziona comunque.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const codice = searchParams.get("code");
  const errore = searchParams.get("error");

  // Dove tornare dopo l'accesso. Solo path interni (via `next` di
  // ModuloLoginCliente): mai un redirect verso l'esterno. Il backoffice non
  // passa `next` e resta su /admin.
  const prossimo = searchParams.get("next");
  const destinazione = prossimo && prossimo.startsWith("/") ? prossimo : "/admin";
  const paginaLogin = destinazione.startsWith("/area") ? "/area/login" : "/admin/login";

  const alLogin = (motivo) =>
    NextResponse.redirect(`${origin}${paginaLogin}?errore=${motivo}`);

  if (errore) {
    return alLogin(searchParams.get("error_code") === "otp_expired" ? "scaduto" : "link");
  }
  if (!codice) return alLogin("link");

  const supabase = await creaClientServer();
  if (!supabase) return alLogin("link");

  // Qui i cookie si possono scrivere: siamo in un Route Handler, non in un
  // Server Component. È questa chiamata che deposita la sessione.
  const { error } = await supabase.auth.exchangeCodeForSession(codice);
  if (error) return alLogin("link");

  return NextResponse.redirect(`${origin}${destinazione}`);
}
