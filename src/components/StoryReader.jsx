/**
 * The whole book, for the parent who received the link by email. It is the big
 * sister of `StoryPreview` (the 3 free pages): same palette, same shapes, same
 * tone — but here there are all the pages, the anchor phrase and the parent
 * guide. `illustrazione` (the scene description) is never shown;
 * `illustrazioneUrl`, the image generated from the backoffice, is — when it is
 * there. Server Component: nothing here needs the browser.
 */
export default function StoryReader({ story, name }) {
  return (
    <>
      <header className="relative overflow-hidden bg-scuro px-4 py-[clamp(56px,8vw,96px)] text-center">
        <div
          className="pointer-events-none absolute -top-40 -right-25 h-100 w-100 rounded-full bg-accento/15"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[720px]">
          {name && (
            <p className="mb-4 text-[13px] font-extrabold tracking-[0.16em] text-accento-soft uppercase">
              La storia di {name}
            </p>
          )}
          <h1 className="font-display text-[clamp(2rem,4.4vw,3rem)] font-semibold text-crema">
            «{story.titolo}»
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 py-[clamp(40px,6vw,72px)]">
        <div className="flex flex-col gap-6">
          {story.pagine.map((page, index) => (
            <article
              key={index}
              className="anim-pop rounded-[18px] border border-bordo bg-crema-chiara p-7 shadow-[0_10px_30px_rgba(67,48,42,0.08)]"
            >
              <span className="mb-3 block text-[11px] font-extrabold tracking-[0.16em] text-accento uppercase">
                Pagina {index + 1}
              </span>
              {page.illustrazioneUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.illustrazioneUrl}
                  alt=""
                  className="mb-4 w-full rounded-[14px] border border-bordo"
                />
              )}
              <p className="text-lg leading-[1.8] font-medium text-inchiostro">{page.testo}</p>
            </article>
          ))}
        </div>

        {story.fraseAncora && (
          <p className="mx-auto mt-12 max-w-[540px] text-center font-display text-[1.3rem] text-accento">
            La frase-àncora da riusare nella vita reale: «{story.fraseAncora}»
          </p>
        )}

        {story.guidaGenitori?.length > 0 && (
          <div className="mx-auto mt-12 max-w-[620px] rounded-[22px] border border-dashed border-accento-soft/60 bg-sabbia p-7">
            <p className="font-display text-[1.2rem] font-semibold text-inchiostro">
              Guida per i genitori
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {story.guidaGenitori.map((tip, index) => (
                <li
                  key={index}
                  className="flex gap-3 leading-relaxed font-medium text-inchiostro-soft"
                >
                  <span
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accento"
                    aria-hidden="true"
                  />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </>
  );
}
