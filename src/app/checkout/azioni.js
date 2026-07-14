"use server";

import { redirect } from "next/navigation";
import { start } from "workflow/api";

import { risolviBrand } from "@/lib/brand/resolve";
import { ordineSchema } from "@/lib/ordini/schema";
import { creaClientAdmin } from "@/lib/supabase/server";
import { generaLibro } from "@/workflows/libro";

/**
 * Il checkout finto: crea l'ordine e lancia la generazione, senza far pagare
 * nessuno. Sta dietro una flag perché in produzione non deve esistere.
 *
 * Quando arriva Stripe, il webhook fa gli stessi tre passi con `finto: false`.
 * La firma non cambia, e la coda non si tocca.
 */
export async function acquista(datiGrezzi) {
  if (process.env.CHECKOUT_FINTO !== "1") {
    throw new Error("Il checkout non è attivo.");
  }

  const esito = ordineSchema.safeParse(datiGrezzi);
  if (!esito.success) {
    return { errore: "Dati dell'ordine non validi." };
  }
  const ordine = esito.data;

  const db = creaClientAdmin();
  if (!db) return { errore: "Supabase non è configurato." };

  const brand = await risolviBrand(ordine.parametri.brand);

  const { data: riga, error } = await db
    .from("ordini")
    .insert({
      brand_id: brand.id ?? null,
      email: ordine.email,
      parametri: ordine.parametri,
      formato: ordine.formato,
      prezzo_cents: ordine.prezzoCents,
      stato: "pagato",
      finto: true,
    })
    .select("id")
    .single();

  if (error) return { errore: `Ordine non creato: ${error.message}` };

  const run = await start(generaLibro, [riga.id]);

  await db.from("storie").update({ run_id: run.runId }).eq("ordine_id", riga.id);

  redirect("/checkout/in-lavorazione");
}
