"use server";

import { revalidatePath } from "next/cache";
import { start } from "workflow/api";

import { utenteAmministratore } from "@/lib/admin/sessione";
import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { inviaMail } from "@/lib/mail/invia";
import { mailStoriaPronta } from "@/lib/mail/modelli";
import { generaIllustrazione } from "@/lib/storia/illustrazioni";
import { contenutoStoriaSchema } from "@/lib/storia/schema";
import { transizionePermessa } from "@/lib/storia/stati";
import { salvaIllustrazione } from "@/lib/storia/storage";
import { creaClientAdmin, creaClientServer } from "@/lib/supabase/server";
import { generaLibro } from "@/workflows/libro";

/** Nessuna di queste azioni parte se chi la chiama non è amministratore. */
async function esigiAmministratore() {
  const utente = await utenteAmministratore();
  if (!utente) throw new Error("Non autorizzato.");
  return utente;
}

async function leggiStoria(storiaId) {
  const supabase = await creaClientServer();
  const { data } = await supabase
    .from("storie")
    .select("*, brands (*)")
    .eq("id", storiaId)
    .maybeSingle();
  return data;
}

export async function salvaStoria(storiaId, contenutoGrezzo) {
  await esigiAmministratore();

  const storia = await leggiStoria(storiaId);
  if (!storia) return { errore: "Storia inesistente." };

  if (storia.stato !== "in_revisione") {
    return {
      errore: `Una storia "${storia.stato}" non si può più correggere: se il libro è già partito, la correzione è un libro nuovo, non una modifica.`,
    };
  }

  const esito = contenutoStoriaSchema.safeParse(contenutoGrezzo);
  if (!esito.success) {
    return { errore: esito.error.issues[0].message };
  }

  const db = creaClientAdmin();
  const { data: righe, error } = await db
    .from("storie")
    // `contenuto_originale` non si tocca mai: è la versione dell'AI, e la
    // differenza con questa è il diario di cosa correggiamo sempre.
    .update({ contenuto: esito.data })
    // Vincolare l'UPDATE allo stato appena letto rende la transizione atomica:
    // due richieste concorrenti non possono superare entrambe il controllo.
    .eq("id", storiaId)
    .eq("stato", storia.stato)
    .select("id");

  if (error) return { errore: error.message };
  if (!righe || righe.length === 0) {
    return {
      errore: "Qualcun altro ha già modificato questa storia nel frattempo: ricarica la pagina.",
    };
  }

  revalidatePath(`/admin/storie/${storiaId}`);
  return { ok: true };
}

export async function approvaStoria(storiaId) {
  const utente = await esigiAmministratore();

  const storia = await leggiStoria(storiaId);
  if (!storia) return { errore: "Storia inesistente." };

  if (!transizionePermessa(storia.stato, "approvata")) {
    return { errore: `Una storia "${storia.stato}" non si può approvare.` };
  }

  const db = creaClientAdmin();
  const { data: righe, error } = await db
    .from("storie")
    .update({
      stato: "approvata",
      revisionata_da: utente.id,
      revisionata_il: new Date().toISOString(),
    })
    // Vincolare l'UPDATE allo stato appena letto rende la transizione atomica:
    // due richieste concorrenti (approva + rifiuta, o due approva) non possono
    // superare entrambe il controllo — "approvata" è irreversibile.
    .eq("id", storiaId)
    .eq("stato", storia.stato)
    .select("id");

  if (error) return { errore: error.message };
  if (!righe || righe.length === 0) {
    return {
      errore: "Qualcun altro ha già deciso su questa storia nel frattempo: ricarica la pagina.",
    };
  }

  // La mail non deve poter costare l'approvazione: se Resend è giù, la storia
  // resta approvata e la mail si rimanda a mano.
  try {
    const brand = brandDaRiga(storia.brands) ?? BRAND_DEFAULT;
    const { oggetto, html } = mailStoriaPronta({
      nome: storia.parametri.nome,
      brand,
      url: `${process.env.NEXT_PUBLIC_SITO_URL ?? "http://localhost:3000"}/storie/${storiaId}`,
    });
    await inviaMail({ a: storia.email, oggetto, html });
  } catch (problema) {
    console.error("Mail di approvazione non spedita:", problema.message);
  }

  revalidatePath("/admin/storie");
  return { ok: true };
}

export async function rifiutaStoria(storiaId, nota) {
  const utente = await esigiAmministratore();

  const notaPulita = typeof nota === "string" ? nota.trim() : "";
  if (!notaPulita) {
    return { errore: "Serve una nota per rifiutare una storia: fra un mese nessuno ricorderà il motivo." };
  }

  const storia = await leggiStoria(storiaId);
  if (!storia) return { errore: "Storia inesistente." };

  if (!transizionePermessa(storia.stato, "rifiutata")) {
    return { errore: `Una storia "${storia.stato}" non si può rifiutare.` };
  }

  const db = creaClientAdmin();
  const { data: righe, error } = await db
    .from("storie")
    .update({
      stato: "rifiutata",
      note_revisione: notaPulita,
      revisionata_da: utente.id,
      revisionata_il: new Date().toISOString(),
    })
    // Vincolare l'UPDATE allo stato appena letto rende la transizione atomica:
    // due richieste concorrenti non possono superare entrambe il controllo.
    .eq("id", storiaId)
    .eq("stato", storia.stato)
    .select("id");

  if (error) return { errore: error.message };
  if (!righe || righe.length === 0) {
    return {
      errore: "Qualcun altro ha già deciso su questa storia nel frattempo: ricarica la pagina.",
    };
  }

  revalidatePath("/admin/storie");
  return { ok: true };
}

export async function rigeneraStoria(storiaId) {
  await esigiAmministratore();

  const storia = await leggiStoria(storiaId);
  if (!storia) return { errore: "Storia inesistente." };

  if (!transizionePermessa(storia.stato, "in_generazione")) {
    return { errore: `Una storia "${storia.stato}" non si può rigenerare.` };
  }

  // Si riparte dall'ordine che aveva generato la storia: senza, non c'è nulla
  // da rilanciare.
  if (!storia.ordine_id) {
    return {
      errore: "Questa storia non ha un ordine collegato: non si sa cosa rigenerare.",
    };
  }

  const db = creaClientAdmin();
  const { data: righe, error } = await db
    .from("storie")
    .update({ stato: "in_generazione", errore: null })
    // Vincolare l'UPDATE allo stato appena letto rende la transizione atomica:
    // due click sullo stesso "Rigenera" non possono superare entrambi il
    // controllo e avviare due workflow per lo stesso ordine.
    .eq("id", storiaId)
    .eq("stato", storia.stato)
    .select("id");

  if (error) return { errore: error.message };
  if (!righe || righe.length === 0) {
    return {
      errore: "Qualcun altro ha già avviato la rigenerazione di questa storia nel frattempo: ricarica la pagina.",
    };
  }

  // Il workflow riusa la riga esistente (vedi creaStoriaInGenerazione in
  // src/workflows/libro.js): la storia mantiene il suo id, quindi il link
  // nella mail già spedita al genitore continua a puntare qui.
  try {
    await start(generaLibro, [storia.ordine_id]);
  } catch (problema) {
    // start() non è partito: nessun workflow prenderà mai in carico questa
    // storia, e senza workflow nessuno la segnerà mai "fallita" (è compito
    // suo, vedi il commento gemello in src/workflows/libro.js). Se non lo
    // facciamo qui, la riga resta bloccata in "in_generazione" per sempre —
    // il fantasma che questa funzione esiste per eliminare, e si tornerebbe
    // a doverla sbloccare con SQL a mano. "fallita" è lo stato giusto: da lì
    // l'amministratore può rigenerare di nuovo (TRANSIZIONI lo permette), e
    // la coda mostra subito l'errore leggibile in `errore`.
    const messaggio = `Avvio della rigenerazione fallito: ${problema.message}`;

    const { error: erroreRecupero } = await db
      .from("storie")
      .update({ stato: "fallita", errore: messaggio })
      .eq("id", storiaId)
      // Se nel frattempo il workflow era comunque partito ed è andato avanti,
      // questo UPDATE non tocca nulla: non si sotterra un libro buono.
      .eq("stato", "in_generazione");

    revalidatePath("/admin/storie");
    revalidatePath(`/admin/storie/${storiaId}`);

    // Doppio guasto: né il workflow è partito, né siamo riusciti a segnarlo.
    // La storia resta in "in_generazione", da cui non si rigenera — cioè
    // esattamente il fantasma. Non possiamo fare altro che dirlo forte, perché
    // qui l'unica uscita è una mano umana.
    if (erroreRecupero) {
      console.error(
        `Storia ${storiaId} bloccata in in_generazione: né avviata né segnata fallita (${erroreRecupero.message}).`,
      );
      return {
        errore: `${messaggio} — e non siamo riusciti a segnarla come fallita: la storia è bloccata, avvisa chi sviluppa.`,
      };
    }

    return { errore: messaggio };
  }

  revalidatePath("/admin/storie");
  revalidatePath(`/admin/storie/${storiaId}`);
  return { ok: true };
}

/**
 * Genera (o rigenera) l'illustrazione di una singola pagina e ne salva l'URL nel
 * contenuto. Solo su una storia `in_revisione`: le figure si rivedono nel
 * backoffice PRIMA dell'approvazione, una pagina alla volta, con retry.
 *
 * La `scena` arriva dal client (il testo "La scena da illustrare" che
 * l'amministratore vede, anche se non ancora salvato): così si disegna ciò che
 * ha davanti, non una versione vecchia sul database.
 */
export async function generaIllustrazioneStoria(storiaId, indice, scenaGrezza) {
  await esigiAmministratore();

  const storia = await leggiStoria(storiaId);
  if (!storia) return { errore: "Storia inesistente." };
  if (storia.stato !== "in_revisione") {
    return { errore: `Una storia "${storia.stato}" non si illustra più: si generano prima dell'approvazione.` };
  }

  const pagine = storia.contenuto?.pagine;
  if (!Array.isArray(pagine) || indice < 0 || indice >= pagine.length) {
    return { errore: "Pagina inesistente." };
  }

  const scena = typeof scenaGrezza === "string" ? scenaGrezza.trim() : "";
  if (!scena) {
    return { errore: "Serve la descrizione della scena per generare l'illustrazione." };
  }

  let url;
  try {
    const { bytes, mediaType } = await generaIllustrazione({
      scena,
      parametri: storia.parametri,
    });
    url = await salvaIllustrazione({ storiaId, indice, bytes, mediaType });
  } catch (problema) {
    return { errore: `Illustrazione non generata: ${problema.message}` };
  }

  // Read-modify-write del JSON: rileggo le pagine appena lette, ci scrivo l'URL
  // sull'indice giusto, e vincolo l'UPDATE allo stato `in_revisione` (atomico
  // rispetto ad approvazione/rifiuto). Con un solo revisore alla volta non c'è
  // corsa fra pagine; se un giorno saranno in due, si passerà a un jsonb_set.
  const pagineAggiornate = pagine.map((pagina, i) =>
    i === indice ? { ...pagina, illustrazioneUrl: url } : pagina,
  );

  const db = creaClientAdmin();
  const { data: righe, error } = await db
    .from("storie")
    .update({ contenuto: { ...storia.contenuto, pagine: pagineAggiornate } })
    .eq("id", storiaId)
    .eq("stato", "in_revisione")
    .select("id");

  if (error) return { errore: error.message };
  if (!righe || righe.length === 0) {
    return { errore: "Qualcun altro ha già deciso su questa storia nel frattempo: ricarica la pagina." };
  }

  revalidatePath(`/admin/storie/${storiaId}`);
  return { ok: true, url };
}
