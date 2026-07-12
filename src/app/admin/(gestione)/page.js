import Link from "next/link";

import { esci } from "@/app/admin/azioni";
import { creaClientServer } from "@/lib/supabase/server";

export default async function ElencoMerchant() {
  const supabase = await creaClientServer();
  // Senza Supabase il layout padre mostra già le istruzioni di setup. Il
  // controllo va ripetuto qui: in RSC la pagina viene valutata comunque, anche
  // se il layout non la renderizza.
  if (!supabase) return null;

  const { data: brands, error } = await supabase
    .from("brands")
    .select("id, slug, nome, attivo, prompt_guida, capricci, mostra_prezzi")
    .order("creato_il", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Merchant</h1>
          <p className="mt-1 font-medium text-inchiostro-soft">
            Ogni merchant è una versione del portale, raggiungibile da{" "}
            <code className="rounded bg-white px-1.5 py-0.5">/?version=slug</code>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form action={esci}>
            <button
              type="submit"
              className="text-sm font-semibold text-inchiostro-soft hover:underline"
            >
              Esci
            </button>
          </form>
          <Link
            href="/admin/brands/nuovo"
            className="lift rounded-full bg-accento px-6 py-3 font-bold text-crema"
          >
            Nuovo merchant
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-card bg-accento/10 p-4 font-semibold text-accento">
          Non riesco a leggere i merchant: {error.message}
        </p>
      )}

      {brands?.length === 0 && (
        <p className="mt-8 rounded-card border border-dashed border-bordo p-8 text-center font-medium text-inchiostro-soft">
          Nessun merchant ancora. Il primo potrebbe essere l&apos;Hotel Famiglia Serena.
        </p>
      )}

      <div className="mt-8 grid gap-4">
        {brands?.map((brand) => (
          <Link
            key={brand.id}
            href={`/admin/brands/${brand.slug}`}
            className="lift-card block rounded-card border border-bordo bg-white p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-display text-lg font-semibold">{brand.nome}</h2>
              <code className="rounded bg-crema-scura px-2 py-0.5 text-xs font-bold">
                ?version={brand.slug}
              </code>
              {!brand.attivo && (
                <span className="rounded-full bg-inchiostro-lieve/30 px-2.5 py-0.5 text-xs font-bold uppercase">
                  disattivato
                </span>
              )}
              {!brand.mostra_prezzi && (
                <span className="rounded-full bg-accento-soft/30 px-2.5 py-0.5 text-xs font-bold uppercase">
                  senza listino
                </span>
              )}
            </div>

            <p className="mt-3 line-clamp-2 font-medium text-inchiostro-soft">
              {brand.prompt_guida ?? (
                <span className="italic">Nessun prompt guida: storie senza filo comune.</span>
              )}
            </p>

            <p className="mt-2 text-sm font-semibold text-inchiostro-tenue">
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
