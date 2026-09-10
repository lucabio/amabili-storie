import Link from "next/link";

import { LABELS, STATES } from "@/lib/story/states";
import { createServerSupabase } from "@/lib/supabase/server";

const STATE_COLORS = {
  in_generazione: "bg-ink-faint/25 text-ink",
  in_revisione: "bg-accent text-cream",
  approvata: "bg-accent-soft/40 text-dark",
  rifiutata: "bg-ink-faint/25 text-ink-soft",
  fallita: "bg-accent/15 text-accent",
};

function howLongAgo(iso) {
  const hours = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000);
  if (hours < 1) return "da poco";
  if (hours < 24) return `da ${hours} ${hours === 1 ? "ora" : "ore"}`;
  const days = Math.floor(hours / 24);
  return `da ${days} ${days === 1 ? "giorno" : "giorni"}`;
}

export default async function Queue({ searchParams }) {
  // Next 16: searchParams is a Promise.
  const filters = await searchParams;
  const supabase = await createServerSupabase();
  if (!supabase) return null;

  let query = supabase
    .from("storie")
    .select("id, stato, parametri, creato_il, errore, brands (slug, nome)")
    // Oldest at the top: the queue is worked from the bottom.
    .order("creato_il", { ascending: true });

  if (filters?.state) query = query.eq("stato", filters.state);
  if (filters?.merchant === "main") query = query.is("brand_id", null);

  const { data: stories, error } = await query;

  // The merchant filter is applied here and not in the query: `brands.slug` is
  // in a related table, and filtering on it would force an inner join that would
  // throw away the main site's stories (which have no brand).
  const visible =
    filters?.merchant && filters.merchant !== "main"
      ? (stories ?? []).filter((story) => story.brands?.slug === filters.merchant)
      : (stories ?? []);

  const toReview = visible.filter((story) => story.stato === "in_revisione").length;

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Storie</h1>
      <p className="mt-1 font-medium text-ink-soft">
        {toReview === 0
          ? "Niente da rivedere. La coda è vuota."
          : `${toReview} ${toReview === 1 ? "storia aspetta" : "storie aspettano"} di essere riviste.`}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Filter active={!filters?.state} href="/admin/stories" label="Tutte" />
        {STATES.map((state) => (
          <Filter
            key={state}
            active={filters?.state === state}
            href={`/admin/stories?state=${state}`}
            label={LABELS[state]}
          />
        ))}
      </div>

      {error && (
        <p className="mt-6 rounded-card bg-accent/10 p-4 font-semibold text-accent">
          Non riesco a leggere la coda: {error.message}
        </p>
      )}

      {visible.length === 0 && (
        <p className="mt-8 rounded-card border border-dashed border-border p-8 text-center font-medium text-ink-soft">
          Nessuna storia qui.
        </p>
      )}

      <div className="mt-6 grid gap-3">
        {visible.map((story) => (
          <Link
            key={story.id}
            href={`/admin/stories/${story.id}`}
            className="lift-card block rounded-card border border-border bg-white p-5"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${STATE_COLORS[story.stato]}`}
              >
                {LABELS[story.stato]}
              </span>
              <h2 className="font-display text-lg font-semibold">
                {story.parametri?.nome ?? "senza nome"}
              </h2>
              <span className="text-sm font-semibold text-ink-muted">
                {story.parametri?.capriccio}
              </span>
              <span className="ml-auto text-sm font-semibold text-ink-muted">
                {story.brands?.nome ?? "Sito principale"} · {howLongAgo(story.creato_il)}
              </span>
            </div>

            {story.errore && (
              <p className="mt-3 text-sm font-semibold text-accent">{story.errore}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

function Filter({ active, href, label }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-2 text-sm font-bold ${
        active
          ? "border-accent bg-accent text-cream"
          : "border-border bg-white text-ink-soft"
      }`}
    >
      {label}
    </Link>
  );
}
