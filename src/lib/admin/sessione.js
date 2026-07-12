import { creaClientServer, supabaseConfigurato } from "@/lib/supabase/server";

/**
 * Essere loggati non basta: si è amministratori solo se elencati nella tabella
 * `amministratori`. Così il backoffice non si apre a chiunque sappia
 * registrarsi su Supabase.
 *
 * @returns l'utente se è amministratore, altrimenti null.
 */
export async function utenteAmministratore() {
  if (!supabaseConfigurato()) return null;

  const supabase = await creaClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("amministratori")
    .select("utente_id")
    .eq("utente_id", user.id)
    .maybeSingle();

  return data ? user : null;
}
