import { cache } from "react";

import { notFound } from "next/navigation";

import LettoreStoria from "@/components/LettoreStoria";
import PiedePagina from "@/components/PiedePagina";
import TemaBrand from "@/components/TemaBrand";
import { BRAND_DEFAULT, brandDaRiga } from "@/lib/brand/schema";
import { contenutoStoriaSchema } from "@/lib/storia/schema";
import { creaClientAdmin } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Il link della mail "il libro è pronto" è la sola protezione: chi ha l'uuid
 * legge, chi non ce l'ha non lo indovina (come un link di condivisione
 * Dropbox). Per questo la pagina legge con la service role — le RLS su
 * `storie` permettono la lettura solo agli amministratori — e mostra SOLO le
 * storie `approvata`. Un uuid malformato, inesistente o non ancora approvato
 * devono essere indistinguibili: tutti e tre finiscono in `notFound()`,
 * altrimenti la pagina diventerebbe un oracolo su quali storie esistono.
 *
 * `cache()` dedupe la lettura fra `generateMetadata` e il componente pagina:
 * Next li invoca entrambi per la stessa richiesta.
 */
const leggiStoriaApprovata = cache(async (id) => {
  if (!UUID_RE.test(id)) return null;

  const db = creaClientAdmin();
  if (!db) return null;

  const { data, error } = await db
    .from("storie")
    .select("*, brands (*)")
    .eq("id", id)
    .eq("stato", "approvata")
    .maybeSingle();

  if (error) {
    console.error(`Lettura storia "${id}" fallita:`, error.message);
    return null;
  }

  return data;
});

async function storiaValidata(id) {
  const storia = await leggiStoriaApprovata(id);
  if (!storia) return null;

  const contenuto = contenutoStoriaSchema.safeParse(storia.contenuto);
  if (!contenuto.success) {
    console.error(`Contenuto della storia "${id}" non valido:`, contenuto.error.issues);
    return null;
  }

  return {
    contenuto: contenuto.data,
    nome: typeof storia.parametri?.nome === "string" ? storia.parametri.nome : "",
    brand: brandDaRiga(storia.brands) ?? BRAND_DEFAULT,
  };
}

export async function generateMetadata({ params }) {
  // Next 16: params è una Promise.
  const { id } = await params;
  const dati = await storiaValidata(id);
  if (!dati) return { title: "Storia non trovata — Amabili Storie" };

  return { title: `${dati.contenuto.titolo} — ${dati.brand.nome}` };
}

export default async function PaginaStoria({ params }) {
  const { id } = await params;
  const dati = await storiaValidata(id);
  if (!dati) notFound();

  return (
    <TemaBrand brand={dati.brand}>
      <LettoreStoria storia={dati.contenuto} nome={dati.nome} />
      <PiedePagina brand={dati.brand} />
    </TemaBrand>
  );
}
