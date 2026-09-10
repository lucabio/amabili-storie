"use client";

import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";

import { buy } from "@/app/checkout/azioni";
import { saveLead } from "@/lib/lead/actions";
import { formatPrice, PRICE_LIST } from "@/lib/orders/schema";

const FORMAT_OPTIONS = [
  { format: "ebook", label: "Solo eBook" },
  { format: "brossura", label: "eBook + copertina morbida" },
  { format: "rilegato", label: "eBook + copertina rigida" },
];

/**
 * The 3 free pages, and right after them the real purchase.
 *
 * Format and price are only for the shop window: the truth about how much it
 * costs (and whether it costs anything) is decided by `buy()` on the server,
 * reading the brand from the database. A `brand.acceptsPayments` read here only
 * picks which door to show, it does not compute a price.
 */
export default function StoryPreview({ story, name, brand, params, initialFormat }) {
  const [email, setEmail] = useState("");
  const [format, setFormat] = useState(initialFormat || "ebook");
  const [error, setError] = useState(null);
  const [bought, setBought] = useState(false);
  const [pending, start] = useTransition();

  const emailValid = /.+@.+\..+/.test(email);

  // There is no separate "leave your email" box in this form any more: since the
  // purchase became real, the only moment a parent leaves their email is this
  // one. If buying fails, that email must not be lost: we save it as a lead,
  // without touching the error already shown to the user (a failed lead is not
  // their problem).
  function saveAsLead() {
    saveLead({ email, brand: params.brand }).catch(() => {});
  }

  function submitPurchase(event) {
    event.preventDefault();
    if (!emailValid || pending) return;

    setError(null);
    start(async () => {
      try {
        const response = await buy({
          email,
          // For a brand that gives stories away there is no choice: eBook, and
          // the server zeroes the price anyway. Sending "ebook" here is just to
          // respect the schema's shape, not a request for a discount.
          format: brand.acceptsPayments ? format : "ebook",
          params,
        });
        if (response?.error) {
          setError(response.error);
          saveAsLead();
        } else {
          setBought(true);
        }
      } catch (problem) {
        // buy() calls redirect() on success, and Next implements that by
        // throwing an internal error that has to reach the router — it is not a
        // failed purchase, it is a successful one. Without this rethrow we would
        // end up in the "error" branch (showing a useless message, for an
        // instant, before the navigation) and — worse — we would record as a
        // lead an email that has just bought successfully.
        unstable_rethrow(problem);
        setError(problem?.message ?? "Non siamo riusciti a registrare l'ordine. Riprova.");
        saveAsLead();
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
          «{story.titolo}»
        </h2>
        <p className="mt-2 mb-10 text-center font-semibold text-accento-soft">
          Ecco le prime pagine della storia di {name}
          {" — l'eBook completo ha 20–24 pagine illustrate"}
        </p>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
          {story.pagine.map((page, index) => (
            <article
              key={index}
              className="anim-pop flex min-h-[240px] flex-col rounded-[18px] bg-crema p-6.5 shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
            >
              <span className="mb-3 text-[11px] font-extrabold tracking-[0.16em] text-accento uppercase">
                Pagina {index + 1}
              </span>
              <p className="leading-[1.7] font-medium text-inchiostro">{page.testo}</p>
              <div className="mt-auto flex justify-center gap-1.5 pt-4.5" aria-hidden="true">
                <span className="h-1.5 w-1.5 rounded-full bg-accento" />
                <span className="h-1.5 w-1.5 rounded-full bg-accento-soft" />
                <span className="h-1.5 w-1.5 rounded-full bg-pergamena" />
              </div>
            </article>
          ))}
        </div>

        {story.fraseAncora && (
          <p className="mx-auto mt-8 max-w-[640px] text-center font-display text-[1.15rem] text-accento-soft">
            La frase-àncora da riusare nella vita reale: «{story.fraseAncora}»
          </p>
        )}

        <div className="mx-auto mt-10 max-w-[540px] rounded-[22px] border border-dashed border-accento-soft/60 bg-crema/8 p-7 text-center">
          {bought ? (
            <div className="anim-pop">
              <p className="font-display text-[1.3rem] font-semibold text-accento-soft">
                Il libro di {name} è in lavorazione!
              </p>
              <p className="mt-2.5 leading-relaxed font-medium text-pergamena">
                Ti abbiamo scritto una mail. La rileggiamo con cura prima che arrivi: ti
                avvisiamo appena è pronta.
              </p>
            </div>
          ) : (
            <div>
              {brand.acceptsPayments ? (
                <>
                  <p className="font-display text-[1.3rem] font-semibold text-crema">
                    Porta a casa la storia intera
                  </p>
                  <p className="mt-2.5 leading-relaxed font-medium text-pergamena">
                    20–24 pagine illustrate, la stessa cura che hai appena letto, rilette da
                    un occhio umano prima di arrivarti.
                  </p>

                  <div className="mt-5 grid gap-2.5 text-left" role="radiogroup" aria-label="Formato">
                    {FORMAT_OPTIONS.map((option) => (
                      <label
                        key={option.format}
                        className="flex cursor-pointer items-center gap-3 rounded-[14px] bg-crema px-4.5 py-3 font-semibold text-inchiostro"
                      >
                        <input
                          type="radio"
                          name="formato"
                          value={option.format}
                          checked={format === option.format}
                          onChange={() => setFormat(option.format)}
                          className="accent-accento"
                        />
                        <span className="flex-1">{option.label}</span>
                        <span className="font-display text-accento">
                          {formatPrice(PRICE_LIST[option.format].priceCents)}
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="font-display text-[1.3rem] font-semibold text-crema">
                    Il libro completo di {name}, in regalo
                  </p>
                  <p className="mt-2.5 leading-relaxed font-medium text-pergamena">
                    Lascia la tua email: scriviamo le altre pagine, le rileggiamo con cura, e
                    te le mandiamo — gratis, un pensiero di {brand.name}.
                  </p>
                </>
              )}

              <form className="mt-5 flex flex-wrap gap-3" onSubmit={submitPurchase}>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="La tua email"
                  className="min-w-[200px] flex-1 rounded-full bg-crema px-5.5 py-3.5 font-semibold text-inchiostro"
                />
                <button
                  type="submit"
                  disabled={!emailValid || pending}
                  className="lift rounded-full bg-accento px-7 py-3.5 font-bold text-crema disabled:opacity-40"
                >
                  {pending
                    ? "Un attimo…"
                    : brand.acceptsPayments
                      ? `Compra per ${formatPrice(PRICE_LIST[format].priceCents)}`
                      : "Ricevi il libro gratis"}
                </button>
              </form>

              {error && (
                <p className="mt-3.5 text-sm font-semibold text-accento-soft">{error}</p>
              )}

              <p className="mt-3.5 text-xs font-semibold text-inchiostro-tenue">
                Niente spam, promesso.
                {brand.acceptsPayments && " Pagamento sicuro, ricevi il libro via email."}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
