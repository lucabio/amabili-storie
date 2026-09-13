import { notFound } from "next/navigation";

import BrandForm from "@/components/admin/BrandForm";
import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { createServerSupabase } from "@/lib/supabase/server";

/** The empty form lives on the same path: /admin/brands/new */
const NEW_SLUG = "new";

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
    // Two foreign keys link brands and versions: the hint picks the brand's current one.
    .select("*, current_version:guide_prompt_versions!brands_guide_prompt_version_id_fkey (version)")
    .eq("slug", slug)
    .maybeSingle();

  if (!row) notFound();

  // The form works in camelCase; the DB in snake_case.
  const brand = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    active: row.active,
    type: row.type ?? "whim",
    theme: { ...BRAND_DEFAULT.theme, ...(row.theme ?? {}) },
    logoUrl: row.logo_url ?? "",
    hero: { ...BRAND_DEFAULT.hero, ...(row.hero ?? {}) },
    guidePrompt: row.guide_prompt ?? "",
    guidePromptVersion: row.current_version?.version ?? null,
    whims: row.whims,
    placePhotos: row.place_photos ?? [],
    showPrices: row.show_prices,
    acceptsPayments: row.accepts_payments,
  };

  return <BrandForm brand={brand} />;
}
