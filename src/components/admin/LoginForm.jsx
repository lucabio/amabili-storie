"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabase } from "@/lib/supabase/browser";

const CODE_LENGTH = 6;

/**
 * Backoffice login: no password, you get in with a 6-digit code.
 *
 * The same email also carries a magic link (see supabase/templates/), which is
 * the fallback if the code gets lost on the way. The link, though, only works in
 * the browser the request started from: the PKCE flow keeps the verifier there.
 * That is why the code stays the main road — you can read the email on your
 * phone and type it on your laptop.
 *
 * Authenticating is not enough to get in: `adminUser()` requires the user to be
 * listed among the admins.
 */
export default function LoginForm({ initialError = null }) {
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
        // The backoffice is not a place you sign up in: you get in if you already exist.
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    // `otp_disabled` is the answer when the email belongs to no user. We do not
    // say so: someone trying addresses at random must not find out which ones
    // exist. (The same code comes back if OTP is off in the project: in that
    // case no email will ever arrive, and the wrong code will say so at the next
    // step.)
    if (error && error.code !== "otp_disabled") {
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

    router.push("/admin");
    router.refresh();
  }

  function restart() {
    setStep("email");
    setCode("");
    setError(null);
  }

  return (
    <div className="mx-auto max-w-[420px]">
      <h1 className="font-display text-2xl font-semibold">Entra nel backoffice</h1>
      <p className="mt-2 font-medium text-ink-soft">
        {step === "email"
          ? "Ti mandiamo un codice via mail. Nessuna password da ricordare."
          : `Se ${email} è di un amministratore, il codice è in arrivo.`}
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
    <p
      role="alert"
      className="rounded-[14px] bg-accent/10 p-3 text-sm font-semibold text-accent"
    >
      {text}
    </p>
  );
}
