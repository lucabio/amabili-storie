"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";

import { acquista } from "@/app/checkout/azioni";
import { salvaLead } from "@/lib/lead/azioni";
import { formattaPrezzo, LISTINO } from "@/lib/ordini/schema";

const OPZIONI_FORMATO = [
  { formato: "ebook", etichetta: "Solo eBook" },
  { formato: "brossura", etichetta: "eBook + copertina morbida" },
  { formato: "rilegato", etichetta: "eBook + copertina rigida" },
];

/**
 * Le 3 pagine gratuite, e subito dopo l'acquisto vero.
 *
 * Il formato e il prezzo sono solo per la vetrina: la verità su quanto costa
 * (e se costa qualcosa) la decide `acquista()` sul server, leggendo il brand
 * dal database. Un `brand.accettaPagamenti` letto qui serve solo a scegliere
 * quale porta mostrare, non a calcolare un prezzo.
 */
export default function AnteprimaStoria({ storia, nome, brand, parametri, formatoIniziale }) {
  const [email, setEmail] = useState("");
  const [formato, setFormato] = useState(formatoIniziale || "ebook");
  const [errore, setErrore] = useState(null);
  const [comprato, setComprato] = useState(false);
  const [inCorso, avvia] = useTransition();

  const emailValida = /.+@.+\..+/.test(email);

  // Non c'è più, in questo form, una casella separata per "lascia la mail":
  // da quando l'acquisto è vero, l'unico momento in cui un genitore lascia
  // la mail è questo. Se comprare non riesce, quella mail non deve andare
  // persa: la salviamo come lead, senza toccare l'errore già mostrato
  // all'utente (il fallimento del lead non è un suo problema).
  function salvaComeLead() {
    salvaLead({ email, brand: parametri.brand }).catch(() => {});
  }

  function compra(evento) {
    evento.preventDefault();
    if (!emailValida || inCorso) return;

    setErrore(null);
    avvia(async () => {
      try {
        const risposta = await acquista({
          email,
          // Per un brand che regala non c'è scelta: eBook, e il prezzo lo
          // azzera comunque il server. Mandare "ebook" qui è solo per
          // rispettare la forma dello schema, non una richiesta di sconto.
          formato: brand.accettaPagamenti ? formato : "ebook",
          parametri,
        });
        if (risposta?.errore) {
          setErrore(risposta.errore);
          salvaComeLead();
        } else {
          setComprato(true);
        }
      } catch (problema) {
        // acquista() chiama redirect() al successo, e Next lo implementa
        // lanciando un errore interno che deve arrivare al router — non è un
        // fallimento dell'acquisto, è la sua riuscita. Senza questo rilancio
        // finiremmo nel ramo "errore" (mostrando un messaggio inutile, per
        // un istante, prima della navigazione) e — peggio — registreremmo
        // come lead una mail che ha appena comprato con successo.
        unstable_rethrow(problema);
        setErrore(problema?.message ?? "Non siamo riusciti a registrare l'ordine. Riprova.");
        salvaComeLead();
      }
    });
  }

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
          {comprato ? (
            <div className="anim-pop">
              <p className="font-display text-[1.3rem] font-semibold text-accento-soft">
                Il libro di {nome} è in lavorazione!
              </p>
              <p className="mt-2.5 leading-relaxed font-medium text-pergamena">
                Ti abbiamo scritto una mail. La rileggiamo con cura prima che arrivi: ti
                avvisiamo appena è pronta.
              </p>
            </div>
          ) : (
            <div>
              {brand.accettaPagamenti ? (
                <>
                  <p className="font-display text-[1.3rem] font-semibold text-crema">
                    Porta a casa la storia intera
                  </p>
                  <p className="mt-2.5 leading-relaxed font-medium text-pergamena">
                    20–24 pagine illustrate, la stessa cura che hai appena letto, rilette da
                    un occhio umano prima di arrivarti.
                  </p>

                  <div className="mt-5 grid gap-2.5 text-left" role="radiogroup" aria-label="Formato">
                    {OPZIONI_FORMATO.map((opzione) => (
                      <label
                        key={opzione.formato}
                        className="flex cursor-pointer items-center gap-3 rounded-[14px] bg-crema px-4.5 py-3 font-semibold text-inchiostro"
                      >
                        <input
                          type="radio"
                          name="formato"
                          value={opzione.formato}
                          checked={formato === opzione.formato}
                          onChange={() => setFormato(opzione.formato)}
                          className="accent-accento"
                        />
                        <span className="flex-1">{opzione.etichetta}</span>
                        <span className="font-display text-accento">
                          {formattaPrezzo(LISTINO[opzione.formato].prezzoCents)}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-display text-[1.3rem] font-semibold text-crema">
                    Il libro completo di {nome}, in regalo
                  </p>
                  <p className="mt-2.5 leading-relaxed font-medium text-pergamena">
                    Lascia la tua email: scriviamo le altre pagine, le rileggiamo con cura, e
                    te le mandiamo — gratis, un pensiero di {brand.nome}.
                  </p>
                </>
              )}

              <form className="mt-5 flex flex-wrap gap-3" onSubmit={compra}>
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
                  disabled={!emailValida || inCorso}
                  className="lift rounded-full bg-accento px-7 py-3.5 font-bold text-crema disabled:opacity-40"
                >
                  {inCorso
                    ? "Un attimo…"
                    : brand.accettaPagamenti
                      ? `Compra per ${formattaPrezzo(LISTINO[formato].prezzoCents)}`
                      : "Ricevi il libro gratis"}
                </button>
              </form>

              {errore && (
                <p className="mt-3.5 text-sm font-semibold text-accento-soft">{errore}</p>
              )}

              <p className="mt-3.5 text-xs font-semibold text-inchiostro-tenue">
                Niente spam, promesso.
                {brand.accettaPagamenti && " Pagamento sicuro, ricevi il libro via email."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
