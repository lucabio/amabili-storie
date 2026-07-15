/**
 * Il libro intero, per il genitore che ha ricevuto il link via mail. È la
 * sorella maggiore di `AnteprimaStoria` (le 3 pagine gratuite): stessa
 * palette, stesse forme, stesso tono — ma qui ci sono tutte le pagine, la
 * frase-àncora e la guida genitori. `illustrazione` (la descrizione della
 * scena) non si mostra mai; `illustrazioneUrl`, l'immagine generata dal
 * backoffice, sì — quando c'è. Server Component: niente qui ha bisogno del
 * browser.
 */
export default function LettoreStoria({ storia, nome }) {
  return (
    <>
      <header className="relative overflow-hidden bg-scuro px-4 py-[clamp(56px,8vw,96px)] text-center">
        <div
          className="pointer-events-none absolute -top-40 -right-25 h-100 w-100 rounded-full bg-accento/15"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[720px]">
          {nome && (
            <p className="mb-4 text-[13px] font-extrabold tracking-[0.16em] text-accento-soft uppercase">
              La storia di {nome}
            </p>
          )}
          <h1 className="font-display text-[clamp(2rem,4.4vw,3rem)] font-semibold text-crema">
            «{storia.titolo}»
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 py-[clamp(40px,6vw,72px)]">
        <div className="flex flex-col gap-6">
          {storia.pagine.map((pagina, indice) => (
            <article
              key={indice}
              className="anim-pop rounded-[18px] border border-bordo bg-crema-chiara p-7 shadow-[0_10px_30px_rgba(67,48,42,0.08)]"
            >
              <span className="mb-3 block text-[11px] font-extrabold tracking-[0.16em] text-accento uppercase">
                Pagina {indice + 1}
              </span>
              {pagina.illustrazioneUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pagina.illustrazioneUrl}
                  alt=""
                  className="mb-4 w-full rounded-[14px] border border-bordo"
                />
              )}
              <p className="text-lg leading-[1.8] font-medium text-inchiostro">{pagina.testo}</p>
            </article>
          ))}
        </div>

        {storia.fraseAncora && (
          <p className="mx-auto mt-12 max-w-[540px] text-center font-display text-[1.3rem] text-accento">
            La frase-àncora da riusare nella vita reale: «{storia.fraseAncora}»
          </p>
        )}

        {storia.guidaGenitori?.length > 0 && (
          <div className="mx-auto mt-12 max-w-[620px] rounded-[22px] border border-dashed border-accento-soft/60 bg-sabbia p-7">
            <p className="font-display text-[1.2rem] font-semibold text-inchiostro">
              Guida per i genitori
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {storia.guidaGenitori.map((consiglio, indice) => (
                <li
                  key={indice}
                  className="flex gap-3 leading-relaxed font-medium text-inchiostro-soft"
                >
                  <span
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accento"
                    aria-hidden="true"
                  />
                  <span>{consiglio}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
