import Link from "next/link";

import { supabaseConfigured } from "@/lib/supabase/server";

export const metadata = {
  title: "Backoffice — Amabili Storie",
};

/**
 * Backoffice chrome. The real protection lives in the (management) group layout:
 * the login page has to stay reachable without a session.
 */
export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-cream-light">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-4">
          <Link href="/admin" className="font-display text-lg font-semibold">
            Amabili Storie <span className="text-ink-muted">· backoffice</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-ink-soft hover:underline">
            Vai al sito
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-6 py-10">
        {supabaseConfigured() ? (
          children
        ) : (
          <div className="rounded-card border border-dashed border-accent bg-accent/5 p-8">
            <h1 className="font-display text-xl font-semibold">Supabase non è configurato</h1>
            <p className="mt-3 leading-relaxed font-medium text-ink-soft">
              Il backoffice ha bisogno di un progetto Supabase. Crea il progetto, applica{" "}
              <code className="rounded bg-white px-1.5 py-0.5">
                supabase/migrations/0001_init.sql
              </code>
              , poi metti <code className="rounded bg-white px-1.5 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
              e{" "}
              <code className="rounded bg-white px-1.5 py-0.5">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>{" "}
              in <code className="rounded bg-white px-1.5 py-0.5">.env.local</code>. Le istruzioni
              complete sono nel README.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
