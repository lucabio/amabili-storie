"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { creaClientBrowser } from "@/lib/supabase/browser";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errore, setErrore] = useState(null);
  const [inCorso, setInCorso] = useState(false);

  async function accedi(evento) {
    evento.preventDefault();
    setInCorso(true);
    setErrore(null);

    const supabase = creaClientBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrore("Email o password non validi.");
      setInCorso(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[420px]">
      <h1 className="font-display text-2xl font-semibold">Entra nel backoffice</h1>
      <p className="mt-2 font-medium text-inchiostro-soft">
        Solo gli account elencati fra gli amministratori possono entrare.
      </p>

      <form onSubmit={accedi} className="mt-6 flex flex-col gap-3">
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          className="rounded-[14px] border border-bordo bg-white px-4 py-3.5 font-semibold outline-accento"
        />
        <input
          type="password"
          required
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          className="rounded-[14px] border border-bordo bg-white px-4 py-3.5 font-semibold outline-accento"
        />

        {errore && (
          <p className="rounded-[14px] bg-accento/10 p-3 text-sm font-semibold text-accento">
            {errore}
          </p>
        )}

        <button
          type="submit"
          disabled={inCorso}
          className="lift mt-2 rounded-full bg-accento px-7 py-3.5 font-bold text-crema disabled:opacity-40"
        >
          {inCorso ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>
    </div>
  );
}
