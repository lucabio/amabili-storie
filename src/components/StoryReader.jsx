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
      <header className="relative overflow-hidden bg-dark px-4 py-[clamp(56px,8vw,96px)] text-center">
        <div
          className="pointer-events-none absolute -top-40 -right-25 h-100 w-100 rounded-full bg-accent/15"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-[720px]">
          {name && (
            <p className="mb-4 text-[13px] font-extrabold tracking-[0.16em] text-accent-soft uppercase">
              La storia di {name}
            </p>
          )}
          <h1 className="font-display text-[clamp(2rem,4.4vw,3rem)] font-semibold text-cream">
            «{story.title}»
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 py-[clamp(40px,6vw,72px)]">
        <div className="flex flex-col gap-6">
          {story.pages.map((page, index) => (
            <article
              key={index}
              className="anim-pop rounded-[18px] border border-border bg-cream-light p-7 shadow-[0_10px_30px_rgba(67,48,42,0.08)]"
            >
              <span className="mb-3 block text-[11px] font-extrabold tracking-[0.16em] text-accent uppercase">
                Pagina {index + 1}
              </span>
              {page.illustrationUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={page.illustrationUrl}
                  alt=""
                  className="mb-4 w-full rounded-[14px] border border-border"
                />
              )}
              <p className="text-lg leading-[1.8] font-medium text-ink">{page.text}</p>
            </article>
          ))}
        </div>

        {story.anchorPhrase && (
          <p className="mx-auto mt-12 max-w-[540px] text-center font-display text-[1.3rem] text-accent">
            La frase-àncora da riusare nella vita reale: «{story.anchorPhrase}»
          </p>
        )}

        {story.parentGuide?.length > 0 && (
          <div className="mx-auto mt-12 max-w-[620px] rounded-[22px] border border-dashed border-accent-soft/60 bg-sand p-7">
            <p className="font-display text-[1.2rem] font-semibold text-ink">
              Guida per i genitori
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {story.parentGuide.map((tip, index) => (
                <li
                  key={index}
                  className="flex gap-3 leading-relaxed font-medium text-ink-soft"
                >
                  <span
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
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
