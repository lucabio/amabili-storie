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
    name: row.name,
    active: row.active,
    theme: { ...BRAND_DEFAULT.theme, ...(row.theme ?? {}) },
    logoUrl: row.logo_url ?? "",
    hero: { ...BRAND_DEFAULT.hero, ...(row.hero ?? {}) },
    guidePrompt: row.guide_prompt ?? "",
    whims: row.whims,
    showPrices: row.show_prices,
    acceptsPayments: row.accepts_payments,
  };

  return <BrandForm brand={brand} />;
}
