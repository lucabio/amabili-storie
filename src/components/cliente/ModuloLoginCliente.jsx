"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { creaClientBrowser } from "@/lib/supabase/browser";

const LUNGHEZZA_CODICE = 6;

/**
 * Login del cliente: niente password, si entra con un codice a 6 cifre mandato
 * alla mail. A differenza del backoffice, qui `shouldCreateUser: true` — chi ha
 * lasciato la mail (o la lascia ora) diventa un utente e vede le proprie storie.
 *
 * La stessa mail porta anche un magic link, che riporta su `/area` via
 * `/auth/callback?next=/area`.
 */
export default function ModuloLoginCliente({ erroreIniziale = null }) {
  const router = useRouter();
  const [passo, setPasso] = useState("email");
  const [email, setEmail] = useState("");
  const [codice, setCodice] = useState("");
  const [errore, setErrore] = useState(erroreIniziale);
  const [inCorso, setInCorso] = useState(false);

  async function chiediCodice(evento) {
    evento.preventDefault();
    setInCorso(true);
    setErrore(null);

    const supabase = creaClientBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Chi lascia la mail diventa un utente: qui ci si registra entrando.
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/area`,
      },
    });

    if (error) {
      setErrore(
        error.status === 429
          ? "Troppi tentativi. Aspetta qualche minuto e riprova."
          : "Non siamo riusciti a mandare il codice. Riprova fra poco.",
      );
      setInCorso(false);
      return;
    }

    setPasso("codice");
    setInCorso(false);
  }

  async function verificaCodice(evento) {
    evento.preventDefault();
    setInCorso(true);
    setErrore(null);

    const supabase = creaClientBrowser();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: codice,
      type: "email",
    });

    if (error) {
      setErrore("Codice non valido o scaduto. Controlla la mail, o chiedine uno nuovo.");
      setInCorso(false);
      return;
    }

    router.push("/area");
    router.refresh();
  }

  function ricomincia() {
    setPasso("email");
    setCodice("");
    setErrore(null);
  }

  return (
    <div className="mx-auto max-w-[420px]">
      <h1 className="font-display text-2xl font-semibold">La tua area</h1>
      <p className="mt-2 font-medium text-inchiostro-soft">
        {passo === "email"
          ? "Ti mandiamo un codice via mail per vedere le tue storie. Nessuna password."
          : `Abbiamo mandato un codice a ${email}. Controlla la posta.`}
      </p>

      {passo === "email" ? (
        <form onSubmit={chiediCodice} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="La tua email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            className="rounded-[14px] border border-bordo bg-white px-4 py-3.5 font-semibold outline-accento"
          />

          {errore && <Errore testo={errore} />}

          <button
            type="submit"
            disabled={inCorso}
            className="lift mt-2 rounded-full bg-accento px-7 py-3.5 font-bold text-crema disabled:opacity-40"
          >
            {inCorso ? "Invio in corso…" : "Mandami il codice"}
          </button>
        </form>
      ) : (
        <form onSubmit={verificaCodice} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={`[0-9]{${LUNGHEZZA_CODICE}}`}
            maxLength={LUNGHEZZA_CODICE}
            placeholder="000000"
            value={codice}
            onChange={(evento) => setCodice(evento.target.value.replace(/\D/g, ""))}
            className="rounded-[14px] border border-bordo bg-white px-4 py-3.5 text-center font-display text-2xl font-semibold tracking-[0.4em] outline-accento"
          />

          {errore && <Errore testo={errore} />}

          <button
            type="submit"
            disabled={inCorso || codice.length < LUNGHEZZA_CODICE}
            className="lift mt-2 rounded-full bg-accento px-7 py-3.5 font-bold text-crema disabled:opacity-40"
          >
            {inCorso ? "Verifica in corso…" : "Entra"}
          </button>

          <p className="mt-2 text-center text-sm font-medium text-inchiostro-soft">
            Nella mail c&apos;è anche un link per entrare con un clic.{" "}
            <button
              type="button"
              onClick={ricomincia}
              className="font-semibold text-accento hover:underline"
            >
              Usa un&apos;altra email
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

function Errore({ testo }) {
  return (
    <p role="alert" className="rounded-[14px] bg-accento/10 p-3 text-sm font-semibold text-accento">
      {testo}
    </p>
  );
}
