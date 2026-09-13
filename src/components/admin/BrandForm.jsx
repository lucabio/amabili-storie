"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";

import { deleteBrand, deletePlacePhoto, saveBrand, uploadPlacePhoto } from "@/app/admin/actions";
import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { WHIMS } from "@/lib/domain/whims";

const fieldClasses =
  "w-full rounded-[14px] border border-border bg-white px-4 py-3 font-semibold text-ink outline-accent";

function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs font-medium text-ink-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-bold text-accent">{error}</span>}
    </label>
  );
}

function Section({ title, description, children }) {
  return (
    <section className="rounded-card border border-border bg-white p-6">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {description && (
        <p className="mt-1 mb-5 font-medium text-ink-soft">{description}</p>
      )}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

/** The bucket's limit (migration 0012). Checked here only to say it in Italian before uploading. */
const PLACE_PHOTO_MAX_BYTES = 8 * 1024 * 1024;

/**
 * The merchant's place photos (ASD-10). Inside the brand form, but saved on their
 * own, the moment they are uploaded or deleted: its inputs have no name, so the
 * main form never submits them.
 */
function PlacePhotos({ brandId, initialPhotos }) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  async function call(action) {
    setBusy(true);
    setError(null);
    try {
      const response = await action();
      if (response?.ok) {
        setPhotos(response.placePhotos);
        return true;
      }
      setError(response?.error ?? "Operazione non riuscita.");
    } catch (problem) {
      // A body over the Server Action limit never reaches the action: it throws here.
      setError(`Operazione non riuscita: ${problem.message}`);
    } finally {
      setBusy(false);
    }
    return false;
  }

  async function upload() {
    const file = fileRef.current.files?.[0];
    if (!file) return setError("Scegli una foto.");
    if (file.size > PLACE_PHOTO_MAX_BYTES) {
      return setError("La foto supera gli 8 MB: riducila e riprova.");
    }
    const formData = new FormData();
    formData.set("photo", file);
    formData.set("caption", caption);
    if (await call(() => uploadPlacePhoto(brandId, formData))) {
      setCaption("");
      fileRef.current.value = "";
    }
  }

  return (
    <>
      <p className="rounded-[14px] bg-accent/10 px-4 py-3 text-sm font-semibold text-accent">
        Solo luoghi, nessuna persona riconoscibile. Le foto di un hotel ritraggono spesso ospiti,
        a volte bambini: qui finiscono a un modello di immagini e a un indirizzo pubblico, che è
        un&apos;altra cosa rispetto a pubblicarle sul proprio sito. Se nella foto c&apos;è
        qualcuno, scegline un&apos;altra.
      </p>

      {photos.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
          {photos.map((photo) => (
            <figure key={photo.url} className="rounded-[14px] border border-border p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={photo.caption}
                className="aspect-[4/3] w-full rounded-[10px] object-cover"
              />
              <figcaption className="mt-2 flex items-start justify-between gap-2 text-sm font-semibold">
                {photo.caption}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => call(() => deletePlacePhoto(brandId, photo.url))}
                  className="shrink-0 text-xs font-bold text-accent hover:underline disabled:opacity-40"
                >
                  Elimina
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-center">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="text-sm font-medium text-ink-soft"
        />
        <input
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          // Enter here would submit the whole brand form.
          onKeyDown={(event) => event.key === "Enter" && event.preventDefault()}
          maxLength={120}
          placeholder="Didascalia, es: la sala colazione"
          className={fieldClasses}
        />
        <button
          type="button"
          disabled={busy || !caption.trim()}
          onClick={upload}
          className="lift rounded-full border border-accent px-5 py-2.5 text-sm font-bold text-accent disabled:opacity-40"
        >
          {busy ? "Un momento…" : "Carica foto"}
        </button>
      </div>
      {error && <p className="text-xs font-bold text-accent">{error}</p>}
      <p className="text-xs font-medium text-ink-muted">
        JPEG, PNG o WebP, fino a 8 MB. Si salvano subito, senza «Salva modifiche».
      </p>
    </>
  );
}

export default function BrandForm({ brand }) {
  const [state, action, pending] = useActionState(saveBrand, { errors: {} });
  const errors = state?.errors ?? {};

  const isNew = !brand;
  const values = brand ?? {
    id: "",
    slug: "",
    name: "",
    active: true,
    type: "whim",
    theme: BRAND_DEFAULT.theme,
    logoUrl: "",
    hero: BRAND_DEFAULT.hero,
    guidePrompt: "",
    guidePromptVersion: null,
    whims: null,
    showPrices: true,
    acceptsPayments: true,
  };
  const [type, setType] = useState(values.type);
  const isStory = type === "story";

  // The .md is read here and poured into the textarea: the admin sees what goes
  // into the prompt before saving, and the server only ever receives text. The
  // file input has no name, so it is never submitted.
  const guidePromptRef = useRef(null);
  async function loadMarkdown(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    guidePromptRef.current.value = await file.text();
  }

  // The main site (amabilistorie.com without ?version=) is the home page: it is
  // not disabled or deleted from the backoffice. The real rule lives on the
  // server (actions.js applies it anyway); here it is only UX, so nobody clicks
  // for nothing.
  const isMainSite = values.slug === BRAND_DEFAULT.slug;

  return (
    <form action={action} className="grid gap-6">
      <input type="hidden" name="id" defaultValue={values.id ?? ""} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {isNew ? "Nuovo merchant" : values.name}
          </h1>
          {!isNew && (
            <p className="mt-1 font-medium text-ink-soft">
              Anteprima:{" "}
              <Link
                href={`/?version=${values.slug}`}
                className="font-bold text-accent hover:underline"
              >
                /?version={values.slug}
              </Link>
            </p>
          )}
        </div>
        <Link href="/admin" className="text-sm font-semibold text-ink-soft hover:underline">
          Torna all&apos;elenco
        </Link>
      </div>

      {errors.general && (
        <p className="rounded-card bg-accent/10 p-4 font-semibold text-accent">
          {errors.general.join(" ")}
        </p>
      )}

      <Section
        title="Identità"
        description="Lo slug è quello che finisce nell'URL che dai al merchant."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome" error={errors.name?.[0]}>
            <input
              name="name"
              required
              defaultValue={values.name}
              placeholder="Hotel Famiglia Serena"
              className={fieldClasses}
            />
          </Field>

          <Field
            label="Slug"
            hint="Minuscole, numeri, trattini e underscore. Es: famiglia_serena"
            error={errors.slug?.[0]}
          >
            <input
              name="slug"
              required
              pattern="[a-z0-9_-]+"
              defaultValue={values.slug}
              placeholder="famiglia_serena"
              className={fieldClasses}
            />
          </Field>
        </div>

        <Field label="Tipologia" error={errors.type?.[0]}>
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={fieldClasses}
          >
            <option value="whim">Capricci — il genitore sceglie il capriccio da risolvere</option>
            <option value="story">Storia — la trama è sempre la stessa, cambiano i protagonisti</option>
          </select>
        </Field>

        <Field label="URL del logo (opzionale)" error={errors.logoUrl?.[0]}>
          <input
            name="logoUrl"
            type="url"
            defaultValue={values.logoUrl}
            placeholder="https://…"
            className={fieldClasses}
          />
        </Field>

        <div className="flex flex-wrap gap-6">
          {isMainSite ? (
            <label className="flex items-center gap-2 font-semibold opacity-60">
              <input type="hidden" name="active" value="on" />
              <input
                type="checkbox"
                checked
                disabled
                readOnly
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Attivo
              <span className="text-xs font-medium text-ink-muted">
                (è la home: non si disattiva)
              </span>
            </label>
          ) : (
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                name="active"
                defaultChecked={values.active}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Attivo
            </label>
          )}
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              name="showPrices"
              defaultChecked={values.showPrices}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Mostra il listino
            <span className="text-xs font-medium text-ink-muted">
              (nasconde solo i prezzi in vetrina — il checkout resta quello che è. Se
              sotto spegni &quot;Accetta pagamenti&quot;, il listino resta comunque
              nascosto: un prezzo che nessuno può pagare non si mostra)
            </span>
          </label>
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              name="acceptsPayments"
              defaultChecked={values.acceptsPayments}
              className="h-4 w-4 accent-[var(--color-accent)]"
            />
            Accetta pagamenti
            <span className="text-xs font-medium text-ink-muted">
              (spegnilo se l&apos;ente regala le storie: niente checkout, l&apos;ordine nasce
              comunque, a prezzo zero)
            </span>
          </label>
        </div>
      </Section>

      <Section
        title="Il prompt guida"
        description={
          isStory
            ? "La trama di tutte le storie di questo merchant: è sempre la stessa, cambiano solo i protagonisti. Obbligatoria."
            : "Il filo comune di tutte le storie di questo merchant."
        }
      >
        <p className="text-sm font-medium text-ink-soft">
          È il canone del merchant: se è in conflitto con il Metodo Amabili, vince il prompt
          guida. Sopra resta solo la sicurezza, e il formato del libro lo decide comunque la
          piattaforma. Ogni modifica salvata è una nuova versione, e ogni storia ricorda quella
          con cui è stata scritta.
        </p>

        <label className="flex flex-wrap items-center gap-3 text-sm font-bold">
          Carica un file .md
          <input
            type="file"
            accept=".md,.markdown,.txt,text/markdown,text/plain"
            onChange={loadMarkdown}
            className="text-sm font-medium text-ink-soft"
          />
          <span className="font-medium text-ink-muted">
            (sostituisce il testo qui sotto: rileggilo e salva)
          </span>
        </label>

        <Field
          label={isStory ? "Prompt guida *" : "Prompt guida"}
          hint={
            values.guidePromptVersion
              ? `Versione attuale: v${values.guidePromptVersion}.`
              : "Scrivi in italiano, come parlassi all'autore, o carica un .md. Es: «La storia si svolge durante il soggiorno all'Hotel Famiglia Serena, in Val Gardena. Nomina almeno una volta, in modo naturale e mai pubblicitario, la colazione con le torte fatte in casa o Nina, la golden retriever dell'hotel.»"
          }
          error={errors.guidePrompt?.[0]}
        >
          <textarea
            ref={guidePromptRef}
            name="guidePrompt"
            // Only UX: saveBrand refuses a story merchant without it anyway.
            required={isStory}
            rows={12}
            defaultValue={values.guidePrompt}
            placeholder="La storia si svolge durante il soggiorno all'Hotel…"
            className={`${fieldClasses} font-medium`}
          />
        </Field>
      </Section>

      {/* Hidden, not unmounted: switching to Storia and back must not lose the
          chosen whims, and hidden checkboxes are still submitted. */}
      <div hidden={isStory}>
      <Section
        title="Capricci offerti"
        description="Non selezionarne nessuno per offrirli tutti. Un hotel di montagna, per dire, ha senso che offra solo quelli che si vivono in vacanza."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
          {WHIMS.map((whim) => (
            <label
              key={whim.id}
              className="flex items-center gap-2.5 rounded-[14px] border border-border px-4 py-3 font-semibold"
            >
              <input
                type="checkbox"
                name="whims"
                value={whim.id}
                defaultChecked={values.whims?.includes(whim.id) ?? false}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              {whim.label}
            </label>
          ))}
        </div>
        {errors.whims && <p className="text-xs font-bold text-accent">{errors.whims[0]}</p>}
      </Section>
      </div>

      <Section
        title="Foto dei luoghi"
        description="La sala colazione, la piscina, il bosco dietro l'albergo: nell'editor della storia si sceglie quale accompagna una pagina, così il posto disegnato somiglia a quello vero. Servono alle illustrazioni, non al testo."
      >
        {isNew ? (
          <p className="text-sm font-medium text-ink-muted">
            Crea prima il merchant: poi qui potrai caricare le foto.
          </p>
        ) : (
          <PlacePhotos brandId={values.id} initialPhotos={values.placePhotos ?? []} />
        )}
      </Section>

      <Section title="Colori" description="Tre esadecimali: il resto del sito si adatta da solo.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { field: "accent", label: "Accento", value: values.theme.accent },
            { field: "accentSoft", label: "Accento chiaro", value: values.theme.accentSoft },
            { field: "dark", label: "Scuro", value: values.theme.dark },
          ].map((color) => (
            <Field key={color.field} label={color.label} error={errors.theme?.[0]}>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  name={color.field}
                  defaultValue={color.value}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-border bg-white"
                />
                <output className="font-mono text-sm font-semibold text-ink-soft">
                  {color.value}
                </output>
              </span>
            </Field>
          ))}
        </div>
      </Section>

      <Section title="Testi dell'hero" description="Quello che l'ospite legge appena apre la pagina.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Occhiello" error={errors.hero?.[0]}>
            <input name="eyebrow" required defaultValue={values.hero.eyebrow} className={fieldClasses} />
          </Field>
          <Field label="Testo del bottone">
            <input name="cta" required defaultValue={values.hero.cta} className={fieldClasses} />
          </Field>
          <Field label="Titolo">
            <input name="title" required defaultValue={values.hero.title} className={fieldClasses} />
          </Field>
          <Field label="Titolo — parte colorata">
            <input
              name="titleAccent"
              required
              defaultValue={values.hero.titleAccent}
              className={fieldClasses}
            />
          </Field>
        </div>
        <Field label="Sottotitolo">
          <textarea
            name="subtitle"
            required
            rows={3}
            defaultValue={values.hero.subtitle}
            className={`${fieldClasses} font-medium`}
          />
        </Field>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="lift rounded-full bg-accent px-8 py-4 font-bold text-cream disabled:opacity-40"
        >
          {pending ? "Salvataggio…" : isNew ? "Crea merchant" : "Salva modifiche"}
        </button>

        {/* The field errors sit next to their fields, possibly far up the page:
            without this the button looks like it did nothing. */}
        {Object.keys(errors).length > 0 && !pending && (
          <span role="alert" className="text-sm font-bold text-accent">
            Non salvato: {Object.values(errors).flat().join(" ")}
          </span>
        )}

        {!isNew && !isMainSite && (
          <button
            type="submit"
            formAction={deleteBrand}
            formNoValidate
            className="lift rounded-full border border-border bg-white px-6 py-4 font-bold text-ink-soft"
          >
            Elimina
          </button>
        )}
        {!isNew && isMainSite && (
          <span className="text-sm font-medium text-ink-muted">
            È il sito principale: non si elimina.
          </span>
        )}
      </div>
    </form>
  );
}
