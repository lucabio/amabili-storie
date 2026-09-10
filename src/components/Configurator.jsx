"use client";

import { useState } from "react";

import CharacterTraits from "@/components/CharacterTraits";
import LiveCover from "@/components/LiveCover";
import StoryPreview from "@/components/StoryPreview";
import { ANIMALS } from "@/lib/domain/animals";
import { composeTitle } from "@/lib/domain/whims";
import { formatPrice, PRICE_LIST } from "@/lib/orders/schema";

const EMPTY_TRAITS = {
  capelli: "",
  coloreCapelli: "",
  coloreOcchi: "",
  corporatura: "",
  descrizione: "",
};

const STEP_LABELS = ["Capriccio", "Famiglia", "Protagonisti"];

const inputClasses =
  "rounded-[14px] border border-border bg-cream px-4 py-3.5 font-semibold text-ink outline-accent";

function Chip({ active, children, ...props }) {
  return (
    <button
      type="button"
      className={`lift flex min-h-[52px] items-center gap-2.5 rounded-[14px] border px-4 py-3.5 text-left text-sm font-semibold ${
        active
          ? "border-accent bg-accent text-cream"
          : "border-border bg-white text-ink"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function NextButton({ children, ...props }) {
  return (
    <button
      type="button"
      className="lift rounded-full bg-dark px-7.5 py-3.5 font-bold text-cream disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}

function BackButton(props) {
  return (
    <button
      type="button"
      className="lift rounded-full border border-border bg-white px-6 py-3.5 font-bold text-ink-soft"
      {...props}
    >
      Indietro
    </button>
  );
}

export default function Configurator({ brand, whims }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    capriccio: null,
    capriccioLibero: "",
    famiglia: null,
    animale: null,
    nome: "",
    genere: "bimbo",
    eta: "4",
    mamma: "",
    papa: "",
    dettaglio: "",
    tratti: {
      bambino: { ...EMPTY_TRAITS },
      mamma: { ...EMPTY_TRAITS },
      papa: { ...EMPTY_TRAITS },
    },
  });
  const [printed, setPrinted] = useState({ chosen: null, format: "brossura" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [story, setStory] = useState(null);

  const update = (field) => (event) =>
    setForm((previous) => ({ ...previous, [field]: event.target.value }));

  const updateTrait = (character, field) => (event) =>
    setForm((previous) => ({
      ...previous,
      tratti: {
        ...previous.tratti,
        [character]: { ...previous.tratti[character], [field]: event.target.value },
      },
    }));

  const chosenWhim = whims.find((whim) => whim.id === form.capriccio);
  const cleanName = form.nome.trim();

  // The "Solo eBook" button is not decorative: it is the default choice, and
  // "Sì, aggiungi!" moves it to the format picked in the dropdown. This is only
  // the format pre-selected at checkout, which stays editable in the preview.
  const chosenFormat = printed.chosen ? printed.format : "ebook";

  const coverTitle = composeTitle(chosenWhim, cleanName || "…");
  const initial = (cleanName[0] || "A").toUpperCase();

  const step1Done =
    Boolean(form.capriccio) &&
    (form.capriccio !== "altro" || form.capriccioLibero.trim().length > 0);
  const step2Done =
    Boolean(form.famiglia) && (form.famiglia !== "animali" || Boolean(form.animale));
  const canGenerate = step1Done && step2Done && cleanName.length > 0;

  async function generate() {
    if (!canGenerate || loading) return;

    setLoading(true);
    setError(null);
    setStory(null);

    try {
      const response = await fetch("/api/stories/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, brand: brand.slug }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Generazione fallita");
      }

      setStory(data.story);
      // Give the browser time to mount the section before scrolling to it.
      requestAnimationFrame(() => {
        document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" });
      });
    } catch (problem) {
      setError(problem.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section
        id="configurator"
        className="flex min-h-svh snap-start flex-col justify-center bg-sand bg-[url('/illustrations/doodle-sky.svg')] bg-[length:min(180px,22vw)] bg-[right_4%_top_10%] bg-no-repeat px-4 py-[clamp(32px,4vw,56px)]"
      >
        <div className="mx-auto w-full max-w-[920px] rounded-panel border border-border bg-white p-[clamp(24px,4.5vw,44px)] shadow-[0_24px_60px_-20px_rgba(67,48,42,0.14)]">
          <h2 className="text-center font-display text-[clamp(1.5rem,3vw,1.9rem)] font-semibold">
            Il libro si scrive mentre lo componi
          </h2>

          {/* Stepper */}
          <div className="my-7 flex justify-center" aria-hidden="true">
            {[1, 2, 3].map((number, index) => (
              <div key={number} className="flex items-center">
                {index > 0 && (
                  <span
                    className={`mx-1.5 h-0.5 w-8 ${step > index ? "bg-accent" : "bg-border"}`}
                  />
                )}
                <span className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-8.5 w-8.5 items-center justify-center rounded-full font-display text-sm font-bold transition-colors ${
                      step >= number
                        ? "bg-accent text-cream"
                        : "bg-cream-dark text-ink-muted"
                    }`}
                  >
                    {number}
                  </span>
                  <span
                    className={`text-[11px] font-bold tracking-[0.06em] uppercase ${
                      step >= number ? "text-ink" : "text-ink-faint"
                    }`}
                  >
                    {STEP_LABELS[index]}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <div className="grid items-start gap-9 md:grid-cols-[1fr_auto]">
            <div>
              {step === 1 && (
                <div className="anim-pop">
                  <p className="mb-4 text-[1.1rem] font-bold">Quale capriccio vuoi risolvere?</p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
                    {whims.map((whim) => {
                      const active = form.capriccio === whim.id;
                      return (
                        <Chip
                          key={whim.id}
                          active={active}
                          onClick={() =>
                            setForm((previous) => ({
                              ...previous,
                              capriccio: whim.id,
                            }))
                          }
                        >
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              active ? "bg-cream" : "bg-accent-soft"
                            }`}
                          />
                          <span>{whim.label}</span>
                        </Chip>
                      );
                    })}
                  </div>

                  {form.capriccio === "altro" && (
                    <input
                      className={`${inputClasses} mt-3.5 w-full`}
                      placeholder="Raccontacelo tu: es. non vuole lavarsi i denti…"
                      value={form.capriccioLibero}
                      onChange={update("capriccioLibero")}
                    />
                  )}

                  <div className="mt-6">
                    <NextButton disabled={!step1Done} onClick={() => setStep(2)}>
                      Avanti
                    </NextButton>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="anim-pop">
                  <p className="mb-4 text-[1.1rem] font-bold">
                    Come vuoi rappresentare la famiglia?
                  </p>
                  <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
                    <Chip
                      active={form.famiglia === "umani"}
                      onClick={() =>
                        setForm((p) => ({ ...p, famiglia: "umani", animale: null }))
                      }
                    >
                      <span className="block">
                        <span className="block font-display text-[1.05rem]">Come siamo noi</span>
                        <span className="opacity-75">Personaggi umani con i vostri nomi</span>
                      </span>
                    </Chip>
                    <Chip
                      active={form.famiglia === "animali"}
                      onClick={() => setForm((p) => ({ ...p, famiglia: "animali" }))}
                    >
                      <span className="block">
                        <span className="block font-display text-[1.05rem]">
                          Famiglia di animali
                        </span>
                        <span className="opacity-75">Teneri animali del bosco</span>
                      </span>
                    </Chip>
                  </div>

                  {form.famiglia === "animali" && (
                    <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                      {ANIMALS.map((animal) => (
                        <Chip
                          key={animal.id}
                          active={form.animale === animal.id}
                          onClick={() => setForm((p) => ({ ...p, animale: animal.id }))}
                        >
                          {animal.plural}
                        </Chip>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex gap-3">
                    <BackButton onClick={() => setStep(1)} />
                    <NextButton disabled={!step2Done} onClick={() => setStep(3)}>
                      Avanti
                    </NextButton>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="anim-pop">
                  <p className="mb-4 text-[1.1rem] font-bold">Presenta i protagonisti</p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                    <input
                      className={inputClasses}
                      placeholder="Nome del bambino/a *"
                      value={form.nome}
                      onChange={update("nome")}
                    />
                    <div className="flex gap-2">
                      <select
                        className={`${inputClasses} flex-1`}
                        value={form.genere}
                        onChange={update("genere")}
                        aria-label="Genere"
                      >
                        <option value="bimbo">Bimbo</option>
                        <option value="bimba">Bimba</option>
                      </select>
                      <select
                        className={`${inputClasses} flex-1`}
                        value={form.eta}
                        onChange={update("eta")}
                        aria-label="Età"
                      >
                        {[2, 3, 4, 5, 6, 7].map((years) => (
                          <option key={years} value={years}>
                            {years} anni
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      className={inputClasses}
                      placeholder="Nome della mamma"
                      value={form.mamma}
                      onChange={update("mamma")}
                    />
                    <input
                      className={inputClasses}
                      placeholder="Nome del papà"
                      value={form.papa}
                      onChange={update("papa")}
                    />
                    <input
                      className={`${inputClasses} col-span-full`}
                      placeholder="Cosa adora? (es. la pasta al pesto, i dinosauri…)"
                      value={form.dettaglio}
                      onChange={update("dettaglio")}
                    />
                  </div>

                  <details className="group mt-5 rounded-[14px] border border-border bg-cream/60 p-4">
                    <summary className="cursor-pointer list-none text-sm font-bold text-ink-soft marker:content-none">
                      <span className="inline-flex items-center gap-2">
                        <span className="inline-block transition-transform group-open:rotate-90">
                          ›
                        </span>
                        Aggiungi qualche dettaglio — facoltativo
                      </span>
                    </summary>
                    <p className="mt-2 mb-4 text-xs font-medium text-ink-muted">
                      Capelli, occhi, un oggetto che non lascia mai: più dettagli scrivi, più la
                      storia sembrerà scritta apposta per loro.
                    </p>
                    <div className="grid gap-3">
                      <CharacterTraits
                        title={`Aspetto di ${cleanName || "chi vive la storia"}`}
                        values={form.tratti.bambino}
                        onChange={(field) => updateTrait("bambino", field)}
                      />
                      <CharacterTraits
                        title="Aspetto della mamma"
                        values={form.tratti.mamma}
                        onChange={(field) => updateTrait("mamma", field)}
                      />
                      <CharacterTraits
                        title="Aspetto del papà"
                        values={form.tratti.papa}
                        onChange={(field) => updateTrait("papa", field)}
                      />
                    </div>
                  </details>

                  {brand.acceptsPayments && (
                    <div className="mt-8 rounded-[18px] border border-dashed border-accent bg-accent/5 p-5.5">
                      <p className="mb-1.5 text-[1.05rem] font-bold text-accent">
                        Vuoi anche la copia cartacea?
                      </p>
                      <p className="mb-4 leading-relaxed font-medium text-ink-soft">
                        Aggiungi un bellissimo libro illustrato{" "}
                        <strong>stampato e spedito a casa</strong> — perfetto come ricordo della
                        storia.
                      </p>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[220px] flex-1">
                          <label
                            htmlFor="printed-format"
                            className="mb-2 block text-[0.9rem] font-semibold"
                          >
                            Scegli formato:
                          </label>
                          <select
                            id="printed-format"
                            className={`${inputClasses} w-full bg-white py-2.5 text-sm`}
                            value={printed.format}
                            onChange={(event) =>
                              setPrinted((p) => ({ ...p, format: event.target.value }))
                            }
                          >
                            <option value="brossura">
                              {PRICE_LIST.brossura.label} (copertina morbida) —{" "}
                              {formatPrice(PRICE_LIST.brossura.priceCents)}
                            </option>
                            <option value="rilegato">
                              {PRICE_LIST.rilegato.label} (copertina rigida) —{" "}
                              {formatPrice(PRICE_LIST.rilegato.priceCents)}
                            </option>
                          </select>
                        </div>
                        <button
                          type="button"
                          aria-pressed={printed.chosen === true}
                          onClick={() => setPrinted((p) => ({ ...p, chosen: true }))}
                          className={`lift rounded-full border px-5.5 py-2.5 text-sm font-bold ${
                            printed.chosen === true
                              ? "border-accent bg-accent text-cream"
                              : "border-border bg-white text-ink-soft"
                          }`}
                        >
                          Sì, aggiungi!
                        </button>
                        <button
                          type="button"
                          aria-pressed={printed.chosen === false}
                          onClick={() => setPrinted((p) => ({ ...p, chosen: false }))}
                          className={`lift rounded-full border px-5.5 py-2.5 text-sm font-bold ${
                            printed.chosen === false
                              ? "border-accent bg-accent text-cream"
                              : "border-border bg-white text-ink-soft"
                          }`}
                        >
                          Solo eBook
                        </button>
                      </div>

                      {printed.chosen === true && (
                        <p className="anim-pop mt-4 rounded-[14px] bg-white p-4 text-sm font-semibold text-ink-soft">
                          {/* Template literal, not JSX text over multiple lines: across a
                          JSX expression the space after the closing brace collapses,
                          and "brossura" and "resta" end up glued together. */}
                          {`Segnato: il ${PRICE_LIST[printed.format].label.toLowerCase()} resta preselezionato quando generi l'anteprima — lì puoi ancora cambiarlo prima di confermare.`}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <BackButton onClick={() => setStep(2)} />
                    <button
                      type="button"
                      onClick={generate}
                      disabled={!canGenerate || loading}
                      className="lift rounded-full bg-accent px-8 py-4 text-[1.05rem] font-bold text-cream shadow-[0_10px_24px_rgba(233,109,79,0.3)] disabled:opacity-40"
                    >
                      {loading ? "Stiamo scrivendo…" : "Genera l'anteprima gratis"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block">
              <LiveCover title={coverTitle} initial={initial} brandName={brand.name} />
              <p className="mt-3 text-center text-xs font-bold text-ink-muted">
                Anteprima copertina dal vivo
              </p>
            </div>
          </div>

          {loading && (
            <div className="mt-8 flex items-center justify-center gap-3" role="status">
              <span className="anim-spinny inline-block h-5.5 w-5.5 rounded-full border-3 border-border border-t-accento" />
              <span className="font-semibold text-ink-soft">
                Stiamo scrivendo la storia di {cleanName || "tuo figlio"}…
              </span>
            </div>
          )}

          {error && (
            <p className="mt-6 rounded-[14px] bg-accent/10 p-4 text-center font-semibold text-accent">
              {error}
            </p>
          )}
        </div>
      </section>

      {story && (
        <div id="preview">
          <StoryPreview
            story={story}
            name={cleanName}
            brand={brand}
            params={{ ...form, brand: brand.slug }}
            initialFormat={chosenFormat}
          />
        </div>
      )}
    </>
  );
}
