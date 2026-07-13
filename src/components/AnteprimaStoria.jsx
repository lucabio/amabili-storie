"use client";

import { useState } from "react";

/** Le 3 pagine gratuite + la cattura email. */
export default function AnteprimaStoria({ storia, nome, mostraPrezzi }) {
  const [email, setEmail] = useState("");
  const [inviata, setInviata] = useState(false);

  const emailValida = /.+@.+\..+/.test(email);

  return (
    <section className="relative flex min-h-svh snap-start flex-col justify-center overflow-hidden bg-scuro px-4 py-[clamp(48px,6vw,80px)]">
      <div
        className="pointer-events-none absolute -top-40 -right-25 h-100 w-100 rounded-full bg-accento/15"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1080px]">
        <h2 className="text-center font-display text-[clamp(1.7rem,3.4vw,2.2rem)] font-semibold text-crema">
          «{storia.titolo}»
        </h2>
        <p className="mt-2 mb-10 text-center font-semibold text-accento-soft">
          Ecco le prime pagine della storia di {nome}
          {" — l'eBook completo ha 20–24 pagine illustrate"}
        </p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
          {storia.pagine.map((pagina, indice) => (
            <article
              key={indice}
              className="anim-pop flex min-h-[240px] flex-col rounded-[18px] bg-crema p-6.5 shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
            >
              <span className="mb-3 text-[11px] font-extrabold tracking-[0.16em] text-accento uppercase">
                Pagina {indice + 1}
              </span>
              <p className="leading-[1.7] font-medium text-inchiostro">{pagina.testo}</p>
              <div className="mt-auto flex justify-center gap-1.5 pt-4.5" aria-hidden="true">
                <span className="h-1.5 w-1.5 rounded-full bg-accento" />
                <span className="h-1.5 w-1.5 rounded-full bg-accento-soft" />
                <span className="h-1.5 w-1.5 rounded-full bg-pergamena" />
              </div>
            </article>
          ))}
        </div>

        {storia.fraseAncora && (
          <p className="mx-auto mt-8 max-w-[640px] text-center font-display text-[1.15rem] text-accento-soft">
            La frase-àncora da riusare nella vita reale: «{storia.fraseAncora}»
          </p>
        )}

        <div className="mx-auto mt-10 max-w-[540px] rounded-[22px] border border-dashed border-accento-soft/60 bg-crema/8 p-7 text-center">
          {inviata ? (
            <div className="anim-pop">
              <p className="font-display text-[1.3rem] font-semibold text-accento-soft">
                Sei in lista!
              </p>
              <p className="mt-2.5 leading-relaxed font-medium text-pergamena">
                Ti scriviamo al lancio con il tuo sconto del 30% e l&apos;anteprima completa
                della storia di {nome}. Sogni d&apos;oro nel frattempo.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-display text-[1.3rem] font-semibold text-crema">
                Stiamo per aprire!
              </p>
              <p className="mt-2.5 leading-relaxed font-medium text-pergamena">
                Lascia la tua email: al lancio ricevi il libro completo di {nome} con il{" "}
                <span className="font-bold text-accento-soft">30% di sconto riservato</span>.
              </p>

              <form
                className="mt-5 flex flex-wrap gap-3"
                onSubmit={(evento) => {
                  evento.preventDefault();
                  // TODO: persistere il lead su Supabase (tabella `lead`).
                  if (emailValida) setInviata(true);
                }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  placeholder="La tua email"
                  className="min-w-[200px] flex-1 rounded-full bg-crema px-5.5 py-3.5 font-semibold text-inchiostro"
                />
                <button
                  type="submit"
                  disabled={!emailValida}
                  className="lift rounded-full bg-accento px-7 py-3.5 font-bold text-crema disabled:opacity-40"
                >
                  Blocca lo sconto
                </button>
              </form>

              {mostraPrezzi && (
                <p className="mt-3.5 text-xs font-semibold text-inchiostro-tenue">
                  eBook 9,90 € · Cartaceo rigido 34,90 € · Niente spam, promesso.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
