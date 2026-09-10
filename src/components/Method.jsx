const PILLARS = [
  {
    n: "01",
    title: "Supervisione scientifica",
    text:
      "Gli archi narrativi sono validati da una psicologa infantile. L'emozione del bambino è sempre legittimata, mai punita: la soluzione nasce da lui.",
  },
  {
    n: "02",
    title: "Guida per mamma e papà",
    text:
      "In ogni libro: la frase-àncora da riusare nella vita reale e i consigli pratici per trasformare la lettura in routine che funziona.",
  },
  {
    n: "03",
    title: "Garanzia serenità",
    text:
      "Tre settimane di lettura insieme senza alcun progresso? Ti rimborsiamo. Crediamo nel metodo, non solo nel libro.",
  },
];

export default function Method() {
  return (
    <section className="flex min-h-svh snap-start flex-col justify-center bg-cream-dark bg-[url('/illustrations/doodle-reading.svg')] bg-[length:min(135px,14vw)] bg-[right_2%_top_5%] bg-no-repeat px-4 py-[clamp(40px,5vw,64px)]">
      <div className="mx-auto w-full max-w-[1080px]">
        <h2 className="text-center font-display text-[clamp(1.7rem,3.4vw,2.2rem)] font-semibold">
          Non un regalo. Uno strumento.
        </h2>
        <p className="mx-auto mt-3 max-w-[640px] text-center leading-relaxed font-medium text-ink-soft">
          Ogni storia segue il Metodo Amabili: un arco narrativo costruito per aiutare davvero,
          non solo per fare sorridere.
        </p>

        <div className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
          {PILLARS.map((pillar) => (
            <div
              key={pillar.n}
              className="lift-card w-[80%] shrink-0 snap-start rounded-card bg-white p-7 md:w-auto"
            >
              <span className="font-display text-[0.95rem] tracking-[0.08em] text-accent">
                {pillar.n}
              </span>
              <h3 className="mt-2.5 font-display text-[1.2rem] font-semibold">
                {pillar.title}
              </h3>
              <p className="mt-2.5 leading-relaxed font-medium text-ink-soft">
                {pillar.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
