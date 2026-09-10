"use client";

import { useEffect, useState, useTransition } from "react";

import PageCanvas from "@/components/admin/PageCanvas";
import {
  approveStory,
  generateStoryIllustration,
  rejectStory,
  regenerateStory,
  saveStory,
} from "@/app/admin/stories/actions";
import { ALIGNMENTS, FONT_CATALOG, pageLayout } from "@/lib/story/layout";
import { LABELS, transitionAllowed } from "@/lib/story/states";

const ALIGNMENT_LABELS = { left: "Sx", center: "Ce", right: "Dx" };

export default function StoryEditor({ story }) {
  const [content, setContent] = useState(story.content);
  const [note, setNote] = useState("");
  const [result, setResult] = useState(null);
  const [drawing, setDrawing] = useState({});
  const [pageErrors, setPageErrors] = useState({});
  const [bulk, setBulk] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pending, start] = useTransition();

  const pages = content.pages ?? [];
  const total = pages.length;
  const index = Math.min(currentPage, Math.max(0, total - 1));
  const page = pages[index];
  const layout = page ? pageLayout(page) : null;

  const reviewable = story.state === "in_revisione";
  const regenerable = transitionAllowed(story.state, "in_generazione");
  const bulkRunning = bulk !== null;
  const missing = pages.filter((p) => !p.illustrationUrl).length;

  // You flip pages with the arrow keys — but not while typing in a field, there
  // the arrows move the caret.
  useEffect(() => {
    function onKey(event) {
      const target = event.target;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") setCurrentPage((p) => Math.max(0, p - 1));
      else if (event.key === "ArrowRight") setCurrentPage((p) => Math.min(total - 1, p + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  function updatePage(i, field, value) {
    setContent((previous) => ({
      ...previous,
      pages: previous.pages.map((p, j) => (j === i ? { ...p, [field]: value } : p)),
    }));
  }

  // Merges a piece of layout (a box or the style) always starting from the whole
  // defaults, so a page without a layout gains a valid one at the first touch.
  function updateLayout(i, patch) {
    setContent((previous) => ({
      ...previous,
      pages: previous.pages.map((p, j) => {
        if (j !== i) return p;
        const base = pageLayout(p);
        return {
          ...p,
          layout: {
            image: { ...base.image, ...(patch.image ?? {}) },
            text: { ...base.text, ...(patch.text ?? {}) },
            style: { ...base.style, ...(patch.style ?? {}) },
          },
        };
      }),
    }));
  }

  const updateStyle = (i, patch) => updateLayout(i, { style: patch });

  async function illustrate(i) {
    setDrawing((s) => ({ ...s, [i]: true }));
    setPageErrors((errors) => {
      const copy = { ...errors };
      delete copy[i];
      return copy;
    });
    const response = await generateStoryIllustration(story.id, i, pages[i].illustration);
    setDrawing((s) => ({ ...s, [i]: false }));
    if (response?.ok && response.url) {
      updatePage(i, "illustrazioneUrl", response.url);
      return true;
    }
    setPageErrors((errors) => ({
      ...errors,
      [i]: response?.error ?? "Illustrazione non generata.",
    }));
    return false;
  }

  // Only generates the pages still without a picture, one at a time: sequential
  // to avoid rate limits, and because every content write is atomic with respect
  // to the previous one (no clobbering of the JSON).
  async function illustrateAll() {
    const todo = pages.map((_, i) => i).filter((i) => !pages[i].illustrationUrl);
    if (todo.length === 0) return;
    setBulk({ done: 0, total: todo.length });
    for (let k = 0; k < todo.length; k++) {
      await illustrate(todo[k]);
      setBulk({ done: k + 1, total: todo.length });
    }
    setBulk(null);
  }

  function run(action) {
    start(async () => {
      const response = await action();
      setResult(response);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-cream uppercase">
          {LABELS[story.state]}
        </span>
        <h1 className="font-display text-2xl font-semibold">
          {story.params?.name} · {story.params?.whim}
        </h1>
        <a
          href={`/admin/stories/${story.id}/pdf`}
          className="lift ml-auto rounded-full border border-border bg-white px-5 py-2.5 text-sm font-bold text-ink-soft"
        >
          Scarica PDF
        </a>
      </div>

      {story.state === "fallita" && story.error && (
        <p className="mt-4 rounded-card bg-accent/10 p-4 font-semibold text-accent">
          La generazione è fallita: {story.error}
        </p>
      )}
      {story.state === "rifiutata" && story.review_notes && (
        <p className="mt-4 rounded-card bg-accent/10 p-4 font-semibold text-accent">
          Rifiutata: {story.review_notes}
        </p>
      )}

      {result?.error && (
        <p className="mt-4 rounded-card bg-accent/10 p-4 font-semibold text-accent">
          {result.error}
        </p>
      )}
      {result?.ok && (
        <p className="mt-4 rounded-card bg-accent-soft/20 p-4 font-semibold text-dark">Fatto.</p>
      )}

      <label className="mt-8 block">
        <span className="text-sm font-bold text-ink-soft uppercase">Titolo</span>
        <input
          value={content.title ?? ""}
          onChange={(event) => setContent({ ...content, title: event.target.value })}
          disabled={!reviewable}
          className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 font-display text-lg font-semibold outline-accent disabled:bg-cream disabled:text-ink-soft"
        />
      </label>

      {reviewable && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={illustrateAll}
            disabled={bulkRunning || missing === 0}
            className="lift rounded-full bg-accent px-6 py-3 font-bold text-cream disabled:opacity-40"
          >
            {bulkRunning
              ? `Genero le illustrazioni… ${bulk.done}/${bulk.total}`
              : missing === 0
                ? "Tutte le illustrazioni ci sono"
                : `Genera tutte le illustrazioni (${missing})`}
          </button>
          <span className="text-sm font-medium text-ink-muted">
            Genera le pages ancora senza figura. Le singole si rifanno sfogliando qui sotto.
          </span>
        </div>
      )}

      {/* The book, one page at a time: on-screen arrows or ← → from the keyboard. */}
      {page && (
        <div className="mt-6 flex items-stretch gap-3">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
            disabled={index === 0}
            aria-label="Pagina precedente"
            className="lift shrink-0 self-center rounded-full border border-border bg-white px-4 py-6 text-2xl font-bold text-ink-soft disabled:opacity-30"
          >
            ‹
          </button>

          <article className="flex-1 rounded-card border border-border bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-ink-muted uppercase">
                Pagina {index + 1} di {total}
              </span>
              <span className="text-xs font-medium text-ink-muted">
                trascina e ridimensiona · ← → per sfogliare
              </span>
            </div>

            <PageCanvas
              page={page}
              layout={layout}
              editable={reviewable}
              onLayout={(patch) => updateLayout(index, patch)}
            />

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                {reviewable && (
                  <button
                    type="button"
                    disabled={drawing[index] || bulkRunning || !page.illustration?.trim()}
                    onClick={() => illustrate(index)}
                    className="lift rounded-full border border-accent px-5 py-2.5 text-sm font-bold text-accent disabled:opacity-40"
                  >
                    {drawing[index]
                      ? "Sto disegnando…"
                      : page.illustrationUrl
                        ? "Rigenera illustrazione"
                        : "Genera illustrazione"}
                  </button>
                )}
                {pageErrors[index] && (
                  <p className="rounded-[14px] bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
                    {pageErrors[index]}
                  </p>
                )}
                <label className="block">
                  <span className="text-xs font-bold text-ink-muted uppercase">
                    La scena da illustrare
                  </span>
                  <textarea
                    value={page.illustration}
                    onChange={(event) =>
                      updatePage(index, "illustrazione", event.target.value)
                    }
                    rows={3}
                    disabled={!reviewable}
                    className="mt-1.5 w-full rounded-[14px] border border-border px-4 py-2.5 text-sm font-medium outline-accent disabled:bg-cream disabled:text-ink-soft"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3">
                {reviewable && layout && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={layout.style.font}
                      onChange={(event) => updateStyle(index, { font: event.target.value })}
                      className="rounded-[10px] border border-border bg-white px-2.5 py-2 text-sm font-semibold outline-accent"
                    >
                      {FONT_CATALOG.map((font) => (
                        <option key={font.key} value={font.key}>
                          {font.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 rounded-[10px] border border-border bg-white px-1">
                      <button
                        type="button"
                        aria-label="Riduci dimensione"
                        onClick={() =>
                          updateStyle(index, {
                            size: Math.max(8, layout.style.size - 1),
                          })
                        }
                        className="px-2 py-1 text-lg font-bold text-ink-soft"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold">
                        {layout.style.size}
                      </span>
                      <button
                        type="button"
                        aria-label="Aumenta dimensione"
                        onClick={() =>
                          updateStyle(index, {
                            size: Math.min(60, layout.style.size + 1),
                          })
                        }
                        className="px-2 py-1 text-lg font-bold text-ink-soft"
                      >
                        +
                      </button>
                    </div>

                    <input
                      type="color"
                      aria-label="Colore del testo"
                      value={layout.style.color}
                      onChange={(event) => updateStyle(index, { color: event.target.value })}
                      className="h-9 w-10 cursor-pointer rounded-[10px] border border-border bg-white"
                    />

                    <div className="flex items-center gap-1 rounded-[10px] border border-border bg-white px-1">
                      {ALIGNMENTS.map((alignment) => (
                        <button
                          key={alignment}
                          type="button"
                          onClick={() => updateStyle(index, { align: alignment })}
                          className={`rounded-[8px] px-2 py-1 text-xs font-bold ${
                            layout.style.align === alignment
                              ? "bg-accent text-cream"
                              : "text-ink-soft"
                          }`}
                        >
                          {ALIGNMENT_LABELS[alignment]}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => updateStyle(index, { bold: !layout.style.bold })}
                      className={`rounded-[10px] border border-border px-3 py-2 text-sm font-black ${
                        layout.style.bold
                          ? "bg-accent text-cream"
                          : "bg-white text-ink-soft"
                      }`}
                    >
                      G
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStyle(index, { italic: !layout.style.italic })}
                      className={`rounded-[10px] border border-border px-3 py-2 text-sm font-semibold italic ${
                        layout.style.italic
                          ? "bg-accent text-cream"
                          : "bg-white text-ink-soft"
                      }`}
                    >
                      C
                    </button>
                  </div>
                )}

                <textarea
                  value={page.text}
                  onChange={(event) => updatePage(index, "text", event.target.value)}
                  rows={5}
                  disabled={!reviewable}
                  className="w-full rounded-[14px] border border-border px-4 py-3 leading-relaxed font-medium outline-accent disabled:bg-cream disabled:text-ink-soft"
                />
              </div>
            </div>
          </article>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(total - 1, p + 1))}
            disabled={index === total - 1}
            aria-label="Pagina successiva"
            className="lift shrink-0 self-center rounded-full border border-border bg-white px-4 py-6 text-2xl font-bold text-ink-soft disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}

      <label className="mt-8 block">
        <span className="text-sm font-bold text-ink-soft uppercase">Frase-àncora</span>
        <input
          value={content.anchorPhrase ?? ""}
          onChange={(event) => setContent({ ...content, anchorPhrase: event.target.value })}
          disabled={!reviewable}
          className="mt-2 w-full rounded-[14px] border border-border bg-white px-4 py-3 font-semibold outline-accent disabled:bg-cream disabled:text-ink-soft"
        />
      </label>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6">
        {reviewable && (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => saveStory(story.id, content))}
              className="lift rounded-full border border-border bg-white px-6 py-3 font-bold disabled:opacity-40"
            >
              Salva
            </button>

            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => approveStory(story.id))}
              className="lift rounded-full bg-accent px-6 py-3 font-bold text-cream disabled:opacity-40"
            >
              Approva e manda la mail
            </button>

            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Perché la rifiuti?"
              className="ml-auto rounded-full border border-border bg-white px-4 py-2.5 text-sm font-semibold outline-accent"
            />
            <button
              type="button"
              disabled={pending || !note.trim()}
              onClick={() => run(() => rejectStory(story.id, note))}
              className="lift rounded-full border border-accent px-6 py-3 font-bold text-accent disabled:opacity-40"
            >
              Rifiuta
            </button>
          </>
        )}

        {regenerable && (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => regenerateStory(story.id))}
            className="lift rounded-full bg-accent px-6 py-3 font-bold text-cream disabled:opacity-40"
          >
            Rigenera
          </button>
        )}
      </div>
    </div>
  );
}
