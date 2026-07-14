import { notFound } from "next/navigation";

import ModuloBrand from "@/components/admin/ModuloBrand";
import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { creaClientServer } from "@/lib/supabase/server";

/** Il form vuoto vive sullo stesso percorso: /admin/brands/nuovo */
const SLUG_NUOVO = "nuovo";

export default async function ModificaMerchant({ params }) {
  // Next 16: params è una Promise.
  const { slug } = await params;

  if (slug === SLUG_NUOVO) {
    return <ModuloBrand />;
  }

  const supabase = await creaClientServer();
  // Vedi il commento in (gestione)/page.js: la pagina gira anche quando il
  // layout non la renderizza, quindi il controllo va ripetuto.
  if (!supabase) return null;

  const { data: riga } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!riga) notFound();

  // Il form lavora in camelCase; il DB in snake_case.
  const brand = {
    id: riga.id,
    slug: riga.slug,
    nome: riga.nome,
    attivo: riga.attivo,
    tema: { ...BRAND_DEFAULT.tema, ...(riga.tema ?? {}) },
    logoUrl: riga.logo_url ?? "",
    hero: { ...BRAND_DEFAULT.hero, ...(riga.hero ?? {}) },
    promptGuida: riga.prompt_guida ?? "",
    capricci: riga.capricci,
    mostraPrezzi: riga.mostra_prezzi,
    accettaPagamenti: riga.accetta_pagamenti,
  };

  return <ModuloBrand brand={brand} />;
}
