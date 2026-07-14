"use server";

import { risolviBrand } from "@/lib/brand/resolve";
import { leadSchema } from "@/lib/lead/schema";
import { creaClientAdmin } from "@/lib/supabase/server";

/**
 * Salva un lead: si chiama dal form di acquisto di `AnteprimaStoria` quando
 * `acquista()` non è riuscita a concludere l'ordine. Non c'è più, nel wizard,
 * una casella separata "lascia la mail": da quando la lista d'attesa
 * pre-lancio è stata sostituita da un acquisto vero, l'unico punto in cui un
 * genitore lascia la mail è proprio il form di acquisto — quindi il lead si
 * cattura lì, quando comprare non riesce, non con una casella nuova.
 *
 * È una Server Action, quindi un endpoint HTTP raggiungibile direttamente:
 * non ci si fida di niente che arrivi dal client. L'email si rivalida con
 * Zod, e il brand si risolve dal database via `risolviBrand` — mai da un id
 * che il client potrebbe inventarsi.
 *
 * Il vincolo `unique (email, brand_id)` fa sì che chi lascia la mail due
 * volte non veda un errore: `ignoreDuplicates` salta silenziosamente
 * l'inserimento se la coppia esiste già. Un doppione non è un fallimento, è
 * una persona che torna.
 *
 * Fallisce in silenzio (mai un errore che blocchi l'utente): perdere un lead
 * per un problema di rete è meno grave che rompere il messaggio di errore
 * dell'acquisto che l'utente sta già leggendo.
 */
export async function salvaLead(datiGrezzi) {
  const esito = leadSchema.safeParse(datiGrezzi);
  if (!esito.success) return { errore: "Email non valida." };

  const db = creaClientAdmin();
  if (!db) return { errore: "Supabase non è configurato." };

  const brand = await risolviBrand(esito.data.brand);

  const { error } = await db.from("lead").upsert(
    {
      email: esito.data.email,
      brand_id: brand.id ?? null,
    },
    { onConflict: "email,brand_id", ignoreDuplicates: true },
  );

  if (error) {
    console.error("Salvataggio lead fallito:", error.message);
    return { errore: "Lead non salvato." };
  }

  return { ok: true };
}
