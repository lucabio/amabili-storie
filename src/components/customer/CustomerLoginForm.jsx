"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabase } from "@/lib/supabase/browser";

const CODE_LENGTH = 6;

/**
 * Customer login: no password, you get in with a 6-digit code sent by email.
 * Unlike the backoffice, here `shouldCreateUser: true` — whoever left their
 * email (or leaves it now) becomes a user and sees their own stories.
 *
 * The same email also carries a magic link, which lands back on `/account` via
 * `/auth/callback?next=/account`.
 */
export default function CustomerLoginForm({ initialError = null }) {
  const router = useRouter();
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState(initialError);
  const [pending, setPending] = useState(false);

  async function requestCode(event) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Whoever leaves their email becomes a user: here you sign up by entering.
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/account`,
      },
    });

    if (error) {
      setError(
        error.status === 429
          ? "Troppi tentativi. Aspetta qualche minuto e riprova."
          : "Non siamo riusciti a mandare il codice. Riprova fra poco.",
      );
      setPending(false);
      return;
    }

    setStep("code");
    setPending(false);
  }

  async function verifyCode(event) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createBrowserSupabase();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      setError("Codice non valido o scaduto. Controlla la mail, o chiedine uno nuovo.");
      setPending(false);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  function restart() {
    setStep("email");
    setCode("");
    setError(null);
  }

  return (
    <div className="mx-auto max-w-[420px]">
      <h1 className="font-display text-2xl font-semibold">La tua area</h1>
      <p className="mt-2 font-medium text-ink-soft">
        {step === "email"
          ? "Ti mandiamo un codice via mail per vedere le tue storie. Nessuna password."
          : `Abbiamo mandato un codice a ${email}. Controlla la posta.`}
      </p>

      {step === "email" ? (
        <form onSubmit={requestCode} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="La tua email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-[14px] border border-border bg-white px-4 py-3.5 font-semibold outline-accent"
          />

          {error && <ErrorBox text={error} />}

          <button
            type="submit"
            disabled={pending}
            className="lift mt-2 rounded-full bg-accent px-7 py-3.5 font-bold text-cream disabled:opacity-40"
          >
            {pending ? "Invio in corso…" : "Mandami il codice"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-6 flex flex-col gap-3">
          <input
            type="text"
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern={`[0-9]{${CODE_LENGTH}}`}
            maxLength={CODE_LENGTH}
            placeholder="000000"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            className="rounded-[14px] border border-border bg-white px-4 py-3.5 text-center font-display text-2xl font-semibold tracking-[0.4em] outline-accent"
          />

          {error && <ErrorBox text={error} />}

          <button
            type="submit"
            disabled={pending || code.length < CODE_LENGTH}
            className="lift mt-2 rounded-full bg-accent px-7 py-3.5 font-bold text-cream disabled:opacity-40"
          >
            {pending ? "Verifica in corso…" : "Entra"}
          </button>

          <p className="mt-2 text-center text-sm font-medium text-ink-soft">
            Nella mail c&apos;è anche un link per entrare con un clic.{" "}
            <button
              type="button"
              onClick={restart}
              className="font-semibold text-accent hover:underline"
            >
              Usa un&apos;altra email
            </button>
          </p>
        </form>
      )}
    </div>
  );
}

function ErrorBox({ text }) {
  return (
    <p role="alert" className="rounded-[14px] bg-accent/10 p-3 text-sm font-semibold text-accent">
      {text}
    </p>
  );
}
