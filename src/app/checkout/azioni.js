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
  const esito = ordineSchema.safeParse(datiGrezzi);
  if (!esito.success) {
    return { errore: "Dati dell'ordine non validi." };
  }
  const ordine = esito.data;

  // La verità sul brand — e quindi sul prezzo — si legge qui, dal database.
  // `ordine.parametri.brand` è solo lo slug che dice QUALE brand risolvere:
  // non ci si fida di nient'altro che il client possa aver dichiarato su di
  // esso (un "sono gratuito" nel payload non esiste nemmeno in ordineSchema,
  // e se esistesse verrebbe comunque ignorato). Un ente che non accetta
  // pagamenti regala il libro: formato fisso "ebook", prezzo azzerato — ma
  // quella decisione la prende `brand.accettaPagamenti` appena letto dal DB,
  // mai il formato o il prezzo che il client ha mandato.
  const brand = await risolviBrand(ordine.parametri.brand);

  // La flag protegge SOLO il ramo a pagamento: l'acquisto è simulato finché
  // non arriva Stripe, e quel simulacro non deve esistere in produzione. Il
  // regalo di un ente che non accetta pagamenti non è un checkout finto: è
  // una consegna gratuita legittima (formato fisso, prezzo azzerato qui
  // sotto), e deve funzionare in produzione da subito — un ospite
  // dell'Hotel Famiglia Serena non può dipendere da una flag di sviluppo.
  if (brand.accettaPagamenti && process.env.CHECKOUT_FINTO !== "1") {
    throw new Error("Il checkout non è attivo.");
  }

  const db = creaClientAdmin();
  if (!db) return { errore: "Supabase non è configurato." };

  const formato = brand.accettaPagamenti ? ordine.formato : "ebook";
  const prezzoCents = brand.accettaPagamenti ? ordine.prezzoCents : 0;

  const { data: riga, error } = await db
    .from("ordini")
    .insert({
      brand_id: brand.id ?? null,
      email: ordine.email,
      parametri: ordine.parametri,
      formato,
      prezzo_cents: prezzoCents,
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
