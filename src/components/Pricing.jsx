import { formatPrice, PRICE_LIST } from "@/lib/orders/schema";

export default function Pricing() {
  return (
    <section className="flex min-h-svh snap-start flex-col justify-center bg-cream bg-[url('/illustrations/doodle-walk.svg')] bg-[length:min(130px,13vw)] bg-[left_2%_bottom_4%] bg-no-repeat px-6 py-[clamp(40px,5vw,64px)]">
      <div className="mx-auto w-full max-w-[1080px]">
        <h2 className="mb-10 text-center font-display text-[clamp(1.7rem,3.4vw,2.2rem)] font-semibold">
          Semplice e trasparente
        </h2>

        <div className="flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          <div className="lift-card w-[80%] shrink-0 snap-start rounded-[22px] border border-border bg-white p-7.5 text-center md:w-auto">
            <span className="rounded-full bg-cream-dark px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-ink-soft uppercase">
              Provala sopra
            </span>
            <h3 className="mt-4.5 font-display text-[1.35rem] font-semibold">Anteprima</h3>
            <p className="my-2 font-display text-[2.4rem] font-semibold">Gratis</p>
            <p className="leading-relaxed font-medium text-ink-soft">
              Copertina + 3 pages della storia personalizzata. Nessuna carta richiesta.
            </p>
          </div>

          <div className="w-[80%] shrink-0 snap-start rounded-[22px] bg-dark p-7.5 text-center text-cream shadow-[0_24px_50px_-14px_rgba(67,48,42,0.45)] transition-transform duration-250 hover:-translate-y-1 md:w-auto">
            <span className="rounded-full bg-accent px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-cream uppercase">
              Il più scelto
            </span>
            <h3 className="mt-4.5 font-display text-[1.35rem] font-semibold">eBook</h3>
            <p className="my-2 font-display text-[2.4rem] font-semibold text-accent-soft">
              {formatPrice(PRICE_LIST.ebook.priceCents)}
            </p>
            <p className="leading-relaxed font-medium text-parchment">
              20-24 pages illustrate in PDF, consegna immediata via email. Rigenerazione
              gratuita se qualcosa non ti convince.
            </p>
          </div>

          <div className="lift-card w-[80%] shrink-0 snap-start rounded-[22px] border border-border bg-white p-7.5 text-center md:w-auto">
            <span className="rounded-full bg-accent-soft px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-ink uppercase">
              Il regalo perfetto
            </span>
            <h3 className="mt-4.5 font-display text-[1.35rem] font-semibold">Libro cartaceo</h3>
            <p className="my-2 font-display text-[2.4rem] font-semibold">
              {formatPrice(PRICE_LIST.rilegato.priceCents)}
            </p>
            <p className="leading-relaxed font-medium text-ink-soft">
              Copertina rigida, carta di qualità, stampato apposta per voi e spedito a casa in
              5-8 giorni.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-[640px] text-center leading-relaxed font-medium text-ink-soft">
          Ogni arco narrativo è sviluppato con la supervisione di una psicologa infantile.
          Nessuna foto richiesta: bastano i nomi. I dati non vengono mai condivisi.
        </p>
      </div>
    </section>
  );
}
