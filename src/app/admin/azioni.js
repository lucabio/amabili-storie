"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { utenteAmministratore } from "@/lib/admin/sessione";
import { CAPRICCIO_IDS } from "@/lib/domain/capricci";
import { creaClientServer } from "@/lib/supabase/server";

const coloreEsadecimale = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "Serve un colore in formato #rrggbb");

const moduloBrandSchema = z.object({
  id: z.uuid().nullable(),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9_-]+$/, "Solo minuscole, numeri, trattini e underscore"),
  nome: z.string().trim().min(1, "Serve il nome del merchant"),
  attivo: z.boolean(),
  tema: z.object({
    accento: coloreEsadecimale,
    accentoSoft: coloreEsadecimale,
    scuro: coloreEsadecimale,
  }),
  logoUrl: z.union([z.url(), z.literal("")]).nullable(),
  hero: z.object({
    occhiello: z.string().trim().min(1),
    titolo: z.string().trim().min(1),
    titoloAccento: z.string().trim().min(1),
    sottotitolo: z.string().trim().min(1),
    cta: z.string().trim().min(1),
  }),
  promptGuida: z.string().trim().nullable(),
  /** Vuoto = tutti i capricci. */
  capricci: z.array(z.enum(CAPRICCIO_IDS)).nullable(),
  mostraPrezzi: z.boolean(),
});

function testo(formData, campo) {
  const valore = formData.get(campo);
  return typeof valore === "string" ? valore.trim() : "";
}

export async function salvaBrand(_statoPrecedente, formData) {
  const utente = await utenteAmministratore();
  if (!utente) redirect("/admin/login");

  const capricciScelti = formData.getAll("capricci").filter(Boolean);

  const esito = moduloBrandSchema.safeParse({
    id: testo(formData, "id") || null,
    slug: testo(formData, "slug"),
    nome: testo(formData, "nome"),
    attivo: formData.get("attivo") === "on",
    tema: {
      accento: testo(formData, "accento"),
      accentoSoft: testo(formData, "accentoSoft"),
      scuro: testo(formData, "scuro"),
    },
    logoUrl: testo(formData, "logoUrl") || null,
    hero: {
      occhiello: testo(formData, "occhiello"),
      titolo: testo(formData, "titolo"),
      titoloAccento: testo(formData, "titoloAccento"),
      sottotitolo: testo(formData, "sottotitolo"),
      cta: testo(formData, "cta"),
    },
    promptGuida: testo(formData, "promptGuida") || null,
    capricci: capricciScelti.length > 0 ? capricciScelti : null,
    mostraPrezzi: formData.get("mostraPrezzi") === "on",
  });

  if (!esito.success) {
    return { errori: z.flattenError(esito.error).fieldErrors };
  }

  const dati = esito.data;
  const riga = {
    slug: dati.slug,
    nome: dati.nome,
    attivo: dati.attivo,
    tema: dati.tema,
    logo_url: dati.logoUrl || null,
    hero: dati.hero,
    prompt_guida: dati.promptGuida,
    capricci: dati.capricci,
    mostra_prezzi: dati.mostraPrezzi,
  };

  const supabase = await creaClientServer();
  const { error } = dati.id
    ? await supabase.from("brands").update(riga).eq("id", dati.id)
    : await supabase.from("brands").insert(riga);

  if (error) {
    const messaggio =
      error.code === "23505"
        ? `Lo slug "${dati.slug}" è già usato da un altro merchant.`
        : error.message;
    return { errori: { generale: [messaggio] } };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  redirect("/admin");
}

export async function eliminaBrand(formData) {
  const utente = await utenteAmministratore();
  if (!utente) redirect("/admin/login");

  const id = testo(formData, "id");
  if (!id) return;

  const supabase = await creaClientServer();
  await supabase.from("brands").delete().eq("id", id);

  revalidatePath("/admin");
  redirect("/admin");
}

export async function esci() {
  const supabase = await creaClientServer();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
