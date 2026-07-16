import { creaClientServer, supabaseConfigurato } from "@/lib/supabase/server";

/**
 * Chi ha lasciato la mail entra nella propria area con email + OTP. A differenza
 * del backoffice, qui non serve appartenere a nessuna tabella: qualunque utente
 * autenticato è un cliente valido. Quali storie vede lo decidono le RLS
 * (`email = auth.email()`), non un controllo qui.
 *
 * @returns l'utente loggato, o null.
 */
export async function utenteCliente() {
  if (!supabaseConfigurato()) return null;

  const supabase = await creaClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}
