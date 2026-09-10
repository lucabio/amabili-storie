import Link from "next/link";

import { signOut } from "@/app/admin/actions";
import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { createServerSupabase } from "@/lib/supabase/server";

export default async function MerchantList() {
  const supabase = await createServerSupabase();
  // Without Supabase the parent layout already shows the setup instructions. The
  // check has to be repeated here: in RSC the page is evaluated anyway, even if
  // the layout does not render it.
  if (!supabase) return null;

  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, slug, nome, attivo, prompt_guida, capricci, mostra_prezzi, accetta_pagamenti")
    .order("creato_il", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Merchant</h1>
          <p className="mt-1 font-medium text-ink-soft">
            Ogni merchant è una versione del portale, raggiungibile da{" "}
            <code className="rounded bg-white px-1.5 py-0.5">/?version=slug</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-semibold text-ink-soft hover:underline"
            >
              Esci
            </button>
          </form>
          <Link
            href="/admin/brands/new"
            className="lift rounded-full bg-accent px-6 py-3 font-bold text-cream"
          >
            Nuovo merchant
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-card bg-accent/10 p-4 font-semibold text-accent">
          Non riesco a leggere i merchant: {error.message}
        </p>
      )}

      {brands?.length === 0 && (
        <p className="mt-8 rounded-card border border-dashed border-border p-8 text-center font-medium text-ink-soft">
          Nessun merchant ancora. Il primo potrebbe essere l&apos;Hotel Famiglia Serena.
        </p>
      )}

      <div className="mt-8 grid gap-4">
        {brands?.map((brand) => (
          <Link
            key={brand.id}
            href={`/admin/brands/${brand.slug}`}
            className="lift-card block rounded-card border border-border bg-white p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg font-semibold">{brand.nome}</h2>
              <code className="rounded bg-cream-dark px-2 py-0.5 text-xs font-bold">
                ?version={brand.slug}
              </code>
              {brand.slug === BRAND_DEFAULT.slug && (
                <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-bold uppercase">
                  sito principale
                </span>
              )}
              {!brand.attivo && (
                <span className="rounded-full bg-ink-faint/30 px-2.5 py-0.5 text-xs font-bold uppercase">
                  disattivato
                </span>
              )}
              {!brand.mostra_prezzi && (
                <span className="rounded-full bg-accent-soft/30 px-2.5 py-0.5 text-xs font-bold uppercase">
                  senza listino
                </span>
              )}
              {!brand.accetta_pagamenti && (
                <span className="rounded-full bg-accent-soft/30 px-2.5 py-0.5 text-xs font-bold uppercase">
                  regala le storie
                </span>
              )}
            </div>

            <p className="mt-3 line-clamp-2 font-medium text-ink-soft">
              {brand.prompt_guida ?? (
                <span className="italic">Nessun prompt guida: storie senza filo comune.</span>
              )}
            </p>

            <p className="mt-2 text-sm font-semibold text-ink-muted">
              {brand.capricci
                ? `${brand.capricci.length} capricci abilitati`
                : "Tutti i capricci"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
