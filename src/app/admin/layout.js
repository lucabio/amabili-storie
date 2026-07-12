import Link from "next/link";

import { supabaseConfigurato } from "@/lib/supabase/server";

export const metadata = {
  title: "Backoffice — Amabili Storie",
};

/**
 * Chrome del backoffice. La protezione vera sta nel layout del gruppo
 * (gestione): la pagina di login deve restare raggiungibile senza sessione.
 */
export default function LayoutAdmin({ children }) {
  return (
    <div className="min-h-screen bg-crema-chiara">
      <header className="border-b border-bordo bg-white">
        <div className="mx-auto flex max-w-[1080px] items-center justify-between px-6 py-4">
          <Link href="/admin" className="font-display text-lg font-semibold">
            Amabili Storie <span className="text-inchiostro-tenue">· backoffice</span>
          </Link>
          <Link href="/" className="text-sm font-semibold text-inchiostro-soft hover:underline">
            Vai al sito
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1080px] px-6 py-10">
        {supabaseConfigurato() ? (
          children
        ) : (
          <div className="rounded-card border border-dashed border-accento bg-accento/5 p-8">
            <h1 className="font-display text-xl font-semibold">Supabase non è configurato</h1>
            <p className="mt-3 leading-relaxed font-medium text-inchiostro-soft">
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
