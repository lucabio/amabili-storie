"use server";

import { revalidatePath } from "next/cache";

import { utenteAmministratore } from "@/lib/admin/sessione";
import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { inviaMail } from "@/lib/mail/invia";
import { mailStoriaPronta } from "@/lib/mail/modelli";
import { contenutoStoriaSchema } from "@/lib/storia/schema";
import { transizionePermessa } from "@/lib/storia/stati";
import { creaClientAdmin, creaClientServer } from "@/lib/supabase/server";

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

  const esito = contenutoStoriaSchema.safeParse(contenutoGrezzo);
  if (!esito.success) {
    return { errore: esito.error.issues[0].message };
  }

  const db = creaClientAdmin();
  const { error } = await db
    .from("storie")
    // `contenuto_originale` non si tocca mai: è la versione dell'AI, e la
    // differenza con questa è il diario di cosa correggiamo sempre.
    .update({ contenuto: esito.data })
    .eq("id", storiaId);

  if (error) return { errore: error.message };

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
  const { error } = await db
    .from("storie")
    .update({
      stato: "approvata",
      revisionata_da: utente.id,
      revisionata_il: new Date().toISOString(),
    })
    .eq("id", storiaId);

  if (error) return { errore: error.message };

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

  const storia = await leggiStoria(storiaId);
  if (!storia) return { errore: "Storia inesistente." };

  if (!transizionePermessa(storia.stato, "rifiutata")) {
    return { errore: `Una storia "${storia.stato}" non si può rifiutare.` };
  }

  const db = creaClientAdmin();
  const { error } = await db
    .from("storie")
    .update({
      stato: "rifiutata",
      note_revisione: nota,
      revisionata_da: utente.id,
      revisionata_il: new Date().toISOString(),
    })
    .eq("id", storiaId);

  if (error) return { errore: error.message };

  revalidatePath("/admin/storie");
  return { ok: true };
}
