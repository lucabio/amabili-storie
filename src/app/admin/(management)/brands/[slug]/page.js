import { notFound } from "next/navigation";

import BrandForm from "@/components/admin/BrandForm";
import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { createServerSupabase } from "@/lib/supabase/server";

/** The empty form lives on the same path: /admin/brands/new */
const NEW_SLUG = "nuovo";

export default async function EditMerchant({ params }) {
  // Next 16: params is a Promise.
  const { slug } = await params;

  if (slug === NEW_SLUG) {
    return <BrandForm />;
  }

  const supabase = await createServerSupabase();
  // See the comment in (management)/page.js: the page runs even when the layout
  // does not render it, so the check has to be repeated.
  if (!supabase) return null;

  const { data: row } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!row) notFound();

  // The form works in camelCase; the DB in snake_case.
  const brand = {
    id: row.id,
    slug: row.slug,
    name: row.nome,
    active: row.attivo,
    theme: { ...BRAND_DEFAULT.theme, ...(row.tema ?? {}) },
    logoUrl: row.logo_url ?? "",
    hero: { ...BRAND_DEFAULT.hero, ...(row.hero ?? {}) },
    guidePrompt: row.prompt_guida ?? "",
    whims: row.capricci,
    showPrices: row.mostra_prezzi,
    acceptsPayments: row.accetta_pagamenti,
  };

  return <BrandForm brand={brand} />;
}
