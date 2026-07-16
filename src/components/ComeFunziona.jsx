import Image from "next/image";

const PASSI = [
  {
    n: 1,
    img: "/illustrazioni/step-1-nanna.svg",
    titolo: "Scegli il capriccio",
    testo: "Il problema che state vivendo ora: sonno, pannolino, gelosia, buio…",
  },
  {
    n: 2,
    img: "/illustrazioni/step-2-famiglia.svg",
    titolo: "Crea la tua famiglia",
    testo: "In versione umana o come simpatici animali. Niente foto: privacy totale.",
  },
  {
    n: 3,
    img: "/illustrazioni/step-3-lettura.svg",
    titolo: "Ricevi il libro",
    testo:
      "Storia con arco narrativo validato da psicologa infantile. eBook subito, cartaceo a casa.",
  },
];

export default function ComeFunziona() {
  return (
    <section className="flex min-h-svh snap-start flex-col justify-center bg-crema-chiara bg-[url('/illustrazioni/doodle-passeggiata.svg')] bg-[length:min(190px,24vw)] bg-[right_5%_bottom_8%] bg-no-repeat px-6 py-[clamp(40px,5vw,64px)]">
      <div className="mx-auto w-full max-w-[1080px]">
        <h2 className="text-center font-display text-[clamp(1.7rem,3.4vw,2.2rem)] font-semibold">
          Come funziona
        </h2>
        <p className="mt-2 mb-10 text-center font-medium text-inchiostro-soft">
          Tre passi, pochi minuti, una storia che è davvero sua.
        </p>

        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {PASSI.map((passo) => (
            <div
              key={passo.n}
              className="lift-card w-[80%] shrink-0 snap-start rounded-card border border-bordo bg-white p-5 md:w-auto"
            >
              <div className="mb-4.5 h-[150px] overflow-hidden rounded-[14px]">
                <Image
                  src={passo.img}
                  alt=""
                  width={400}
                  height={150}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="mb-2.5 inline-flex h-7.5 w-7.5 items-center justify-center rounded-full bg-accento/12 font-display text-sm text-accento">
                {passo.n}
              </span>
              <h3 className="font-display text-[1.2rem] font-semibold">{passo.titolo}</h3>
              <p className="mt-2 leading-relaxed font-medium text-inchiostro-soft">
                {passo.testo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
