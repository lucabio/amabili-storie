const PILASTRI = [
  {
    n: "01",
    titolo: "Supervisione scientifica",
    testo:
      "Gli archi narrativi sono validati da una psicologa infantile. L'emozione del bambino è sempre legittimata, mai punita: la soluzione nasce da lui.",
  },
  {
    n: "02",
    titolo: "Guida per mamma e papà",
    testo:
      "In ogni libro: la frase-àncora da riusare nella vita reale e i consigli pratici per trasformare la lettura in routine che funziona.",
  },
  {
    n: "03",
    titolo: "Garanzia serenità",
    testo:
      "Tre settimane di lettura insieme senza alcun progresso? Ti rimborsiamo. Crediamo nel metodo, non solo nel libro.",
  },
];

export default function Metodo() {
  return (
    <section className="flex flex-col justify-center bg-crema-scura bg-[url('/illustrazioni/doodle-lettura.svg')] bg-[length:min(135px,14vw)] bg-[right_2%_top_5%] bg-no-repeat px-4 py-[clamp(40px,5vw,64px)]">
      <div className="mx-auto max-w-[1080px]">
        <h2 className="text-center font-display text-[clamp(1.7rem,3.4vw,2.2rem)] font-semibold">
          Non un regalo. Uno strumento.
        </h2>
        <p className="mx-auto mt-3 max-w-[640px] text-center leading-relaxed font-medium text-inchiostro-soft">
          Ogni storia segue il Metodo Amabili: un arco narrativo costruito per aiutare davvero,
          non solo per fare sorridere.
        </p>

        <div className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
          {PILASTRI.map((pilastro) => (
            <div key={pilastro.n} className="lift-card rounded-card bg-white p-7">
              <span className="font-display text-[0.95rem] tracking-[0.08em] text-accento">
                {pilastro.n}
              </span>
              <h3 className="mt-2.5 font-display text-[1.2rem] font-semibold">
                {pilastro.titolo}
              </h3>
              <p className="mt-2.5 leading-relaxed font-medium text-inchiostro-soft">
                {pilastro.testo}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
