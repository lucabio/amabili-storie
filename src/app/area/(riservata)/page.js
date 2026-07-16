import Link from "next/link";

import { esci } from "@/app/area/(riservata)/azioni";
import { creaClientServer } from "@/lib/supabase/server";

export const metadata = {
  title: "Le tue storie — Amabili Storie",
};

// Lo stato interno (in_revisione, fallita…) non riguarda il genitore: per lui
// una storia è "Pronta" o "In lavorazione". Le altre sfumature sono cose nostre.
const STATO_CLIENTE = {
  in_generazione: "In lavorazione",
  in_revisione: "In lavorazione",
  approvata: "Pronta",
  rifiutata: "In lavorazione",
  fallita: "In lavorazione",
};

function dataBreve(iso) {
  if (!iso) return "";
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

export default async function AreaCliente() {
  const supabase = await creaClientServer();

  // Le RLS filtrano da sé: si vedono solo le storie con `email = auth.email()`.
  const { data } = supabase
    ? await supabase
        .from("storie")
        .select("id, stato, contenuto, creato_il")
        .order("creato_il", { ascending: false })
    : { data: [] };
  const storie = data ?? [];

  return (
    <main className="mx-auto max-w-[820px] px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Le tue storie</h1>
          <p className="mt-1 font-medium text-inchiostro-soft">
            Ogni libro che hai creato, e a che punto è.
          </p>
        </div>
        <form action={esci}>
          <button
            type="submit"
            className="rounded-full border border-bordo bg-white px-4 py-2 text-sm font-semibold text-inchiostro-soft"
          >
            Esci
          </button>
        </form>
      </div>

      {storie.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-bordo bg-crema-chiara p-10 text-center">
          <p className="font-display text-lg font-semibold">Ancora nessuna storia</p>
          <p className="mt-2 font-medium text-inchiostro-soft">
            Quando crei un libro con questa email, lo ritrovi qui.
          </p>
          <Link
            href="/"
            className="lift mt-5 inline-block rounded-full bg-accento px-6 py-3 font-bold text-crema"
          >
            Crea la prima storia
          </Link>
        </div>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {storie.map((storia) => {
            const pronta = storia.stato === "approvata";
            const titolo = storia.contenuto?.titolo || "La tua storia";
            return (
              <li
                key={storia.id}
                className="flex flex-wrap items-center gap-4 rounded-card border border-bordo bg-white p-5"
              >
                <div className="min-w-[200px] flex-1">
                  <p className="font-display text-lg font-semibold">«{titolo}»</p>
                  <p className="mt-1 text-sm font-medium text-inchiostro-tenue">
                    Creata il {dataBreve(storia.creato_il)}
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                    pronta ? "bg-accento text-crema" : "bg-crema-scura text-inchiostro-soft"
                  }`}
                >
                  {STATO_CLIENTE[storia.stato] ?? "In lavorazione"}
                </span>

                {pronta ? (
                  <div className="flex gap-2">
                    <Link
                      href={`/storie/${storia.id}`}
                      className="lift rounded-full border border-bordo bg-white px-4 py-2 text-sm font-bold text-inchiostro-soft"
                    >
                      Rileggi
                    </Link>
                    <a
                      href={`/area/storie/${storia.id}/pdf`}
                      className="lift rounded-full bg-accento px-4 py-2 text-sm font-bold text-crema"
                    >
                      Scarica PDF
                    </a>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-inchiostro-tenue">
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
