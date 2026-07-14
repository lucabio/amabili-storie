import Link from "next/link";

import { ETICHETTE, STATI } from "@/lib/storia/stati";
import { creaClientServer } from "@/lib/supabase/server";

const COLORI_STATO = {
  in_generazione: "bg-inchiostro-lieve/25 text-inchiostro",
  in_revisione: "bg-accento text-crema",
  approvata: "bg-accento-soft/40 text-scuro",
  rifiutata: "bg-inchiostro-lieve/25 text-inchiostro-soft",
  fallita: "bg-accento/15 text-accento",
};

function daQuanto(iso) {
  const ore = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (ore < 1) return "da poco";
  if (ore < 24) return `da ${ore} ${ore === 1 ? "ora" : "ore"}`;
  const giorni = Math.floor(ore / 24);
  return `da ${giorni} ${giorni === 1 ? "giorno" : "giorni"}`;
}

export default async function Coda({ searchParams }) {
  // Next 16: searchParams è una Promise.
  const filtri = await searchParams;
  const supabase = await creaClientServer();
  if (!supabase) return null;

  let query = supabase
    .from("storie")
    .select("id, stato, parametri, creato_il, errore, brands (slug, nome)")
    // Le più vecchie in cima: la coda si smaltisce dal fondo.
    .order("creato_il", { ascending: true });

  if (filtri?.stato) query = query.eq("stato", filtri.stato);
  if (filtri?.merchant === "principale") query = query.is("brand_id", null);

  const { data: storie, error } = await query;

  // Il filtro per merchant si applica qui e non nella query: `brands.slug` sta in
  // una tabella collegata, e filtrarci sopra costringerebbe a una inner join che
  // butterebbe via le storie del sito principale (che di brand non ne hanno).
  const visibili =
    filtri?.merchant && filtri.merchant !== "principale"
      ? (storie ?? []).filter((s) => s.brands?.slug === filtri.merchant)
      : (storie ?? []);

  const daRivedere = visibili.filter((s) => s.stato === "in_revisione").length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Storie</h1>
      <p className="mt-1 font-medium text-inchiostro-soft">
        {daRivedere === 0
          ? "Niente da rivedere. La coda è vuota."
          : `${daRivedere} ${daRivedere === 1 ? "storia aspetta" : "storie aspettano"} di essere riviste.`}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Filtro attivo={!filtri?.stato} href="/admin/storie" testo="Tutte" />
        {STATI.map((stato) => (
          <Filtro
            key={stato}
            attivo={filtri?.stato === stato}
            href={`/admin/storie?stato=${stato}`}
            testo={ETICHETTE[stato]}
          />
        ))}
      </div>

      {error && (
        <p className="mt-6 rounded-card bg-accento/10 p-4 font-semibold text-accento">
          Non riesco a leggere la coda: {error.message}
        </p>
      )}

      {visibili.length === 0 && (
        <p className="mt-8 rounded-card border border-dashed border-bordo p-8 text-center font-medium text-inchiostro-soft">
          Nessuna storia qui.
        </p>
      )}

      <div className="mt-6 grid gap-3">
        {visibili.map((storia) => (
          <Link
            key={storia.id}
            href={`/admin/storie/${storia.id}`}
            className="lift-card block rounded-card border border-bordo bg-white p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${COLORI_STATO[storia.stato]}`}
              >
                {ETICHETTE[storia.stato]}
              </span>
              <h2 className="font-display text-lg font-semibold">
                {storia.parametri?.nome ?? "senza nome"}
              </h2>
              <span className="text-sm font-semibold text-inchiostro-tenue">
                {storia.parametri?.capriccio}
              </span>
              <span className="ml-auto text-sm font-semibold text-inchiostro-tenue">
                {storia.brands?.nome ?? "Sito principale"} · {daQuanto(storia.creato_il)}
              </span>
            </div>

            {storia.errore && (
              <p className="mt-3 text-sm font-semibold text-accento">{storia.errore}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Filtro({ attivo, href, testo }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-bold ${
        attivo
          ? "border-accento bg-accento text-crema"
          : "border-bordo bg-white text-inchiostro-soft"
      }`}
    >
      {testo}
    </Link>
  );
}
