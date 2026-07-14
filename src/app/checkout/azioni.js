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

  // Il run_id lo scrive il workflow stesso, nello step che crea la riga "storie"
  // (creaStoriaInGenerazione): start() ritorna subito, prima che quella riga esista,
  // quindi un update da qui sarebbe una corsa quasi sempre persa.
  try {
    await start(generaLibro, [riga.id]);
  } catch (problema) {
    // Qui non c'è ancora nessuna riga "storie": nessun fantasma nella coda.
    // Ma l'ordine sì, resta "pagato" per sempre senza che nessuno lo sappia
    // (la coda del backoffice mostra le storie, non gli ordini). Non possiamo
    // sistemarlo con una transizione di stato — "ordini.stato" ammette solo
    // 'pagato'/'rimborsato' (migration 0002), qui non c'è spazio per un
    // 'fallito' senza toccare lo schema, fuori perimetro per questa funzione.
    // Il minimo indispensabile: loggarlo in modo cercabile e non redirigere
    // come se tutto fosse andato bene, così chi ha pagato riprova subito
    // invece di aspettare un libro che non arriverà mai.
    console.error(`Avvio della generazione fallito per l'ordine ${riga.id}:`, problema.message);
    return {
      errore:
        "Il tuo ordine è stato registrato, ma non siamo riusciti ad avviare la generazione del libro. Riprova, o scrivici indicando questo riferimento: " +
        riga.id,
    };
  }

  redirect("/checkout/in-lavorazione");
}
