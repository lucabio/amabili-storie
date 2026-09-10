"use client";

import Link from "next/link";
import { useActionState } from "react";

import { deleteBrand, saveBrand } from "@/app/admin/actions";
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

export default function BrandForm({ brand }) {
  const [state, action, pending] = useActionState(saveBrand, { errors: {} });
  const errors = state?.errors ?? {};

  const isNew = !brand;
  const values = brand ?? {
    id: "",
    slug: "",
    name: "",
    active: true,
    theme: BRAND_DEFAULT.theme,
    logoUrl: "",
    hero: BRAND_DEFAULT.hero,
    guidePrompt: "",
    whims: null,
    showPrices: true,
    acceptsPayments: true,
  };

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
              name="nome"
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
              <input type="hidden" name="attivo" value="on" />
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
                name="attivo"
                defaultChecked={values.active}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              Attivo
            </label>
          )}
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              name="mostraPrezzi"
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
              name="accettaPagamenti"
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
        description="Il filo comune di tutte le storie di questo merchant. Viene messo nel system prompt sopra il Metodo Amabili: il capriccio resta il tema, questo è lo sfondo."
      >
        <Field
          label="Prompt guida"
          hint="Scrivi in italiano, come parlassi all'autore. Es: «La storia si svolge durante il soggiorno all'Hotel Famiglia Serena, in Val Gardena. Nomina almeno una volta, in modo naturale e mai pubblicitario, la colazione con le torte fatte in casa o Nina, la golden retriever dell'hotel.»"
          error={errors.guidePrompt?.[0]}
        >
          <textarea
            name="promptGuida"
            rows={7}
            defaultValue={values.guidePrompt}
            placeholder="La storia si svolge durante il soggiorno all'Hotel…"
            className={`${fieldClasses} font-medium`}
          />
        </Field>
      </Section>

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
                name="capricci"
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

      <Section title="Colori" description="Tre esadecimali: il resto del sito si adatta da solo.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { field: "accento", label: "Accento", value: values.theme.accento },
            { field: "accentoSoft", label: "Accento chiaro", value: values.theme.accentoSoft },
            { field: "scuro", label: "Scuro", value: values.theme.scuro },
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
            <input name="occhiello" required defaultValue={values.hero.occhiello} className={fieldClasses} />
          </Field>
          <Field label="Testo del bottone">
            <input name="cta" required defaultValue={values.hero.cta} className={fieldClasses} />
          </Field>
          <Field label="Titolo">
            <input name="titolo" required defaultValue={values.hero.titolo} className={fieldClasses} />
          </Field>
          <Field label="Titolo — parte colorata">
            <input
              name="titoloAccento"
              required
              defaultValue={values.hero.titoloAccento}
              className={fieldClasses}
            />
          </Field>
        </div>
        <Field label="Sottotitolo">
          <textarea
            name="sottotitolo"
            required
            rows={3}
            defaultValue={values.hero.sottotitolo}
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
