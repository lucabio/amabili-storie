import Link from "next/link";

import { signOut } from "@/app/account/(private)/actions";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata = {
  title: "Le tue storie — Amabili Storie",
};

// The internal state (in_revisione, fallita…) is none of the parent's business:
// for them a story is "Pronta" or "In lavorazione". The other shades are ours.
const CUSTOMER_STATE = {
  in_generazione: "In lavorazione",
  in_revisione: "In lavorazione",
  approvata: "Pronta",
  rifiutata: "In lavorazione",
  fallita: "In lavorazione",
};

function shortDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

export default async function CustomerArea() {
  const supabase = await createServerSupabase();

  // RLS filters by itself: only the stories with `email = auth.email()` show up.
  const { data } = supabase
    ? await supabase
        .from("stories")
        .select("id, state, content, created_at")
        .order("created_at", { ascending: false })
    : { data: [] };
  const stories = data ?? [];

  return (
    <main className="mx-auto max-w-[820px] px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Le tue stories</h1>
          <p className="mt-1 font-medium text-ink-soft">
            Ogni libro che hai creato, e a che punto è.
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border border-border bg-white px-4 py-2 text-sm font-semibold text-ink-soft"
          >
            Esci
          </button>
        </form>
      </div>

      {stories.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-border bg-cream-light p-10 text-center">
          <p className="font-display text-lg font-semibold">Ancora nessuna storia</p>
          <p className="mt-2 font-medium text-ink-soft">
            Quando crei un libro con questa email, lo ritrovi qui.
          </p>
          <Link
            href="/"
            className="lift mt-5 inline-block rounded-full bg-accent px-6 py-3 font-bold text-cream"
          >
            Crea la prima storia
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {stories.map((story) => {
            const ready = story.state === "approvata";
            const title = story.content?.title || "La tua storia";
            return (
              <li
                key={story.id}
                className="flex flex-wrap items-center gap-4 rounded-card border border-border bg-white p-5"
              >
                <div className="min-w-[200px] flex-1">
                  <p className="font-display text-lg font-semibold">«{title}»</p>
                  <p className="mt-1 text-sm font-medium text-ink-muted">
                    Creata il {shortDate(story.created_at)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    ready ? "bg-accent text-cream" : "bg-cream-dark text-ink-soft"
                  }`}
                >
                  {CUSTOMER_STATE[story.state] ?? "In lavorazione"}
                </span>

                {ready ? (
                  <div className="flex gap-2">
                    <Link
                      href={`/stories/${story.id}`}
                      className="lift rounded-full border border-border bg-white px-4 py-2 text-sm font-bold text-ink-soft"
                    >
                      Rileggi
                    </Link>
                    <a
                      href={`/account/stories/${story.id}/pdf`}
                      className="lift rounded-full bg-accent px-4 py-2 text-sm font-bold text-cream"
                    >
                      Scarica PDF
                    </a>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-ink-muted">
                    Ti avvisiamo appena è pronta
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
