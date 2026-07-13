export default function Prezzi() {
  return (
    <section className="flex min-h-svh snap-start flex-col justify-center bg-crema bg-[url('/illustrazioni/doodle-passeggiata.svg')] bg-[length:min(130px,13vw)] bg-[left_2%_bottom_4%] bg-no-repeat px-6 py-[clamp(40px,5vw,64px)]">
      <div className="mx-auto w-full max-w-[1080px]">
        <h2 className="mb-10 text-center font-display text-[clamp(1.7rem,3.4vw,2.2rem)] font-semibold">
          Semplice e trasparente
        </h2>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] items-stretch gap-5">
          <div className="lift-card rounded-[22px] border border-bordo bg-white p-7.5 text-center">
            <span className="rounded-full bg-crema-scura px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-inchiostro-soft uppercase">
              Provala sopra
            </span>
            <h3 className="mt-4.5 font-display text-[1.35rem] font-semibold">Anteprima</h3>
            <p className="my-2 font-display text-[2.4rem] font-semibold">Gratis</p>
            <p className="leading-relaxed font-medium text-inchiostro-soft">
              Copertina + 3 pagine della storia personalizzata. Nessuna carta richiesta.
            </p>
          </div>

          <div className="rounded-[22px] bg-scuro p-7.5 text-center text-crema shadow-[0_24px_50px_-14px_rgba(67,48,42,0.45)] transition-transform duration-250 hover:-translate-y-1">
            <span className="rounded-full bg-accento px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-crema uppercase">
              Il più scelto
            </span>
            <h3 className="mt-4.5 font-display text-[1.35rem] font-semibold">eBook</h3>
            <p className="my-2 font-display text-[2.4rem] font-semibold text-accento-soft">
              9,90 €
            </p>
            <p className="leading-relaxed font-medium text-pergamena">
              20-24 pagine illustrate in PDF, consegna immediata via email. Rigenerazione
              gratuita se qualcosa non ti convince.
            </p>
          </div>

          <div className="lift-card rounded-[22px] border border-bordo bg-white p-7.5 text-center">
            <span className="rounded-full bg-accento-soft px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.14em] text-inchiostro uppercase">
              Il regalo perfetto
            </span>
            <h3 className="mt-4.5 font-display text-[1.35rem] font-semibold">Libro cartaceo</h3>
            <p className="my-2 font-display text-[2.4rem] font-semibold">34,90 €</p>
            <p className="leading-relaxed font-medium text-inchiostro-soft">
              Copertina rigida, carta di qualità, stampato apposta per voi e spedito a casa in
              5-8 giorni.
            </p>
          </div>
        </div>

        <p className="mx-auto mt-8 max-w-[640px] text-center leading-relaxed font-medium text-inchiostro-soft">
          Ogni arco narrativo è sviluppato con la supervisione di una psicologa infantile.
          Nessuna foto richiesta: bastano i nomi. I dati non vengono mai condivisi.
        </p>
      </div>
    </section>
  );
}
