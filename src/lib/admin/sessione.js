import { creaClientServer, supabaseConfigurato } from "@/lib/supabase/server";

/**
 * Le due domande che il backoffice deve saper distinguere: "chi sei?" e "puoi
 * entrare?". Tenerle separate è ciò che permette alla pagina di login di dire
 * *perché* non si entra. Confuse in un solo `null`, chi è autenticato ma non
 * amministratore si vede ricomparire il modulo email e crede che il codice non
 * abbia funzionato.
 *
 * @returns { utente, amministratore } — l'utente loggato (o null) e se è
 * elencato nella tabella `amministratori`.
 */
export async function sessioneAdmin() {
  if (!supabaseConfigurato()) return { utente: null, amministratore: false };

  const supabase = await creaClientServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { utente: null, amministratore: false };

  const { data } = await supabase
    .from("amministratori")
    .select("utente_id")
    .eq("utente_id", user.id)
    .maybeSingle();

  return { utente: user, amministratore: Boolean(data) };
}

/**
 * Essere loggati non basta: si è amministratori solo se elencati nella tabella
 * `amministratori`. Così il backoffice non si apre a chiunque sappia
 * registrarsi su Supabase.
 *
 * @returns l'utente se è amministratore, altrimenti null.
 */
export async function utenteAmministratore() {
  const { utente, amministratore } = await sessioneAdmin();
  return amministratore ? utente : null;
}
