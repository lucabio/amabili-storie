import { FatalError } from "workflow";

import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { inviaMail } from "@/lib/mail/invia";
import { mailStoriaInLavorazione } from "@/lib/mail/modelli";
import { creaClientAdmin } from "@/lib/supabase/server";
import { AiNonDisponibile, generaStoria, PAGINE_LIBRO } from "@/lib/storia/genera";

/**
 * La nascita di un libro.
 *
 * Il workflow è sandboxato e fa solo orchestrazione; tutto ciò che tocca la rete
 * — Supabase, l'AI, Resend — vive negli step, che hanno Node pieno. È la regola
 * d'oro del Workflow DevKit: infrangerla significa passare la giornata a
 * combattere il sandbox.
 *
 * In fase 1 gli step sono pochi. In fase 2 se ne aggiunge uno per il foglio del
 * personaggio e uno per pagina, e se salta la pagina 17 si rigenera solo quella
 * invece di tutto il libro. È l'unica ragione per cui il WDK è qui.
 */
export async function generaLibro(ordineId) {
  "use workflow";

  const { ordine, brand } = await caricaOrdine(ordineId);
  const storiaId = await creaStoriaInGenerazione(ordine);

  // Da qui in poi la riga "storie" esiste in stato in_generazione: qualunque cosa
  // vada storto deve portarla in "fallita", altrimenti resta un fantasma bloccato
  // per sempre (nessun errore, invisibile sia a "da rivedere" sia a "fallite").
  try {
    await avvisaCheStaNascendo(ordine, brand);
    const contenuto = await scriviTesto(ordine, brand);
    await depositaInCoda(storiaId, contenuto);
    return { storiaId, stato: "in_revisione" };
  } catch (problema) {
    await segnaFallita(storiaId, problema.message);
    throw problema;
  }
}

async function caricaOrdine(ordineId) {
  "use step";

  const db = creaClientAdmin();
  if (!db) throw new FatalError("Supabase non è configurato.");

  const { data: ordine, error } = await db
    .from("ordini")
    .select("*")
    .eq("id", ordineId)
    .maybeSingle();

  if (error) throw new Error(`Lettura ordine fallita: ${error.message}`);
  if (!ordine) throw new FatalError(`Ordine ${ordineId} inesistente.`);

  // Il brand decide il prompt guida: senza, la storia perde il filo dell'ente.
  let brand = BRAND_DEFAULT;
  if (ordine.brand_id) {
    const { data: riga } = await db
      .from("brands")
      .select("*")
      .eq("id", ordine.brand_id)
      .maybeSingle();
    brand = brandDaRiga(riga) ?? BRAND_DEFAULT;
  }

  return { ordine, brand };
}

async function creaStoriaInGenerazione(ordine) {
  "use step";

  const db = creaClientAdmin();
  const { data, error } = await db
    .from("storie")
    .insert({
      ordine_id: ordine.id,
      brand_id: ordine.brand_id,
      email: ordine.email,
      parametri: ordine.parametri,
      contenuto: {},
      fonte: "ai",
      stato: "in_generazione",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Creazione storia fallita: ${error.message}`);
  return data.id;
}

async function avvisaCheStaNascendo(ordine, brand) {
  "use step";

  const { oggetto, html } = mailStoriaInLavorazione({
    nome: ordine.parametri.nome,
    brand,
  });

  await inviaMail({ a: ordine.email, oggetto, html });
}

async function scriviTesto(ordine, brand) {
  "use step";

  try {
    // consentiFallback: false — chi ha pagato non riceve un template.
    const { storia } = await generaStoria({
      parametri: ordine.parametri,
      brand,
      numeroPagine: PAGINE_LIBRO,
      consentiFallback: false,
    });
    return storia;
  } catch (problema) {
    // Senza AI, ritentare è inutile: è una configurazione mancante, non un intoppo.
    if (problema instanceof AiNonDisponibile) throw new FatalError(problema.message);
    throw problema;
  }
}

async function depositaInCoda(storiaId, contenuto) {
  "use step";

  const db = creaClientAdmin();
  const { error } = await db
    .from("storie")
    .update({
      contenuto,
      // Si scrive una volta sola e non si tocca più: è la versione dell'AI,
      // quella con cui confrontare le correzioni a mano.
      contenuto_originale: contenuto,
      stato: "in_revisione",
    })
    .eq("id", storiaId);

  if (error) throw new Error(`Salvataggio storia fallito: ${error.message}`);
}

async function segnaFallita(storiaId, messaggio) {
  "use step";

  // Questo step è già dentro il catch del workflow: il suo unico compito è
  // scrivere l'errore vero, mai sostituirlo. Se anche l'update fallisce (DB giù,
  // rete...) lo si inghiotte qui, così il chiamante rilancia sempre "problema"
  // — il motivo originale del fallimento — invece dell'errore secondario.
  try {
    const db = creaClientAdmin();
    await db
      .from("storie")
      .update({ stato: "fallita", errore: messaggio })
      .eq("id", storiaId);
  } catch {
    // Volutamente ignorato: vedi commento sopra.
  }
}
