"use client";

import Link from "next/link";
import { useActionState } from "react";

import { eliminaBrand, salvaBrand } from "@/app/admin/azioni";
import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { CAPRICCI } from "@/lib/domain/capricci";

const classiCampo =
  "w-full rounded-[14px] border border-bordo bg-white px-4 py-3 font-semibold text-inchiostro outline-accento";

function Campo({ etichetta, aiuto, errore, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold">{etichetta}</span>
      {children}
      {aiuto && <span className="mt-1.5 block text-xs font-medium text-inchiostro-tenue">{aiuto}</span>}
      {errore && <span className="mt-1.5 block text-xs font-bold text-accento">{errore}</span>}
    </label>
  );
}

function Sezione({ titolo, descrizione, children }) {
  return (
    <section className="rounded-card border border-bordo bg-white p-6">
      <h2 className="font-display text-lg font-semibold">{titolo}</h2>
      {descrizione && (
        <p className="mt-1 mb-5 font-medium text-inchiostro-soft">{descrizione}</p>
      )}
      <div className="mt-4 grid gap-4">{children}</div>
    </section>
  );
}

export default function ModuloBrand({ brand }) {
  const [stato, azione, inCorso] = useActionState(salvaBrand, { errori: {} });
  const errori = stato?.errori ?? {};

  const nuovo = !brand;
  const valori = brand ?? {
    id: "",
    slug: "",
    nome: "",
    attivo: true,
    tema: BRAND_DEFAULT.tema,
    logoUrl: "",
    hero: BRAND_DEFAULT.hero,
    promptGuida: "",
    capricci: null,
    mostraPrezzi: true,
    accettaPagamenti: true,
  };

  // Il sito principale (amabilistorie.com senza ?version=) è la home: non si
  // disattiva né si elimina dal backoffice. La regola vera vive nel server
  // (azioni.js la applica comunque); qui è solo UX per non far cliccare a
  // vuoto.
  const principale = valori.slug === BRAND_DEFAULT.slug;

  return (
    <form action={azione} className="grid gap-6">
      <input type="hidden" name="id" defaultValue={valori.id ?? ""} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {nuovo ? "Nuovo merchant" : valori.nome}
          </h1>
          {!nuovo && (
            <p className="mt-1 font-medium text-inchiostro-soft">
              Anteprima:{" "}
              <Link
                href={`/?version=${valori.slug}`}
                className="font-bold text-accento hover:underline"
              >
                /?version={valori.slug}
              </Link>
            </p>
          )}
        </div>
        <Link href="/admin" className="text-sm font-semibold text-inchiostro-soft hover:underline">
          Torna all&apos;elenco
        </Link>
      </div>

      {errori.generale && (
        <p className="rounded-card bg-accento/10 p-4 font-semibold text-accento">
          {errori.generale.join(" ")}
        </p>
      )}

      <Sezione
        titolo="Identità"
        descrizione="Lo slug è quello che finisce nell'URL che dai al merchant."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Campo etichetta="Nome" errore={errori.nome?.[0]}>
            <input
              name="nome"
              required
              defaultValue={valori.nome}
              placeholder="Hotel Famiglia Serena"
              className={classiCampo}
            />
          </Campo>

          <Campo
            etichetta="Slug"
            aiuto="Minuscole, numeri, trattini e underscore. Es: famiglia_serena"
            errore={errori.slug?.[0]}
          >
            <input
              name="slug"
              required
              pattern="[a-z0-9_-]+"
              defaultValue={valori.slug}
              placeholder="famiglia_serena"
              className={classiCampo}
            />
          </Campo>
        </div>

        <Campo etichetta="URL del logo (opzionale)" errore={errori.logoUrl?.[0]}>
          <input
            name="logoUrl"
            type="url"
            defaultValue={valori.logoUrl}
            placeholder="https://…"
            className={classiCampo}
          />
        </Campo>

        <div className="flex flex-wrap gap-6">
          {principale ? (
            <label className="flex items-center gap-2 font-semibold opacity-60">
              <input type="hidden" name="attivo" value="on" />
              <input
                type="checkbox"
                checked
                disabled
                readOnly
                className="h-4 w-4 accent-[var(--color-accento)]"
              />
              Attivo
              <span className="text-xs font-medium text-inchiostro-tenue">
                (è la home: non si disattiva)
              </span>
            </label>
          ) : (
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                name="attivo"
                defaultChecked={valori.attivo}
                className="h-4 w-4 accent-[var(--color-accento)]"
              />
              Attivo
            </label>
          )}
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              name="mostraPrezzi"
              defaultChecked={valori.mostraPrezzi}
              className="h-4 w-4 accent-[var(--color-accento)]"
            />
            Mostra il listino
            <span className="text-xs font-medium text-inchiostro-tenue">
              (nasconde solo i prezzi in vetrina — il checkout resta quello che è. Se
              sotto spegni &quot;Accetta pagamenti&quot;, il listino resta comunque
              nascosto: un prezzo che nessuno può pagare non si mostra)
            </span>
          </label>
          <label className="flex items-center gap-2 font-semibold">
            <input
              type="checkbox"
              name="accettaPagamenti"
              defaultChecked={valori.accettaPagamenti}
              className="h-4 w-4 accent-[var(--color-accento)]"
            />
            Accetta pagamenti
            <span className="text-xs font-medium text-inchiostro-tenue">
              (spegnilo se l&apos;ente regala le storie: niente checkout, l&apos;ordine nasce
              comunque, a prezzo zero)
            </span>
          </label>
        </div>
      </Sezione>

      <Sezione
        titolo="Il prompt guida"
        descrizione="Il filo comune di tutte le storie di questo merchant. Viene messo nel system prompt sopra il Metodo Amabili: il capriccio resta il tema, questo è lo sfondo."
      >
        <Campo
          etichetta="Prompt guida"
          aiuto="Scrivi in italiano, come parlassi all'autore. Es: «La storia si svolge durante il soggiorno all'Hotel Famiglia Serena, in Val Gardena. Nomina almeno una volta, in modo naturale e mai pubblicitario, la colazione con le torte fatte in casa o Nina, la golden retriever dell'hotel.»"
          errore={errori.promptGuida?.[0]}
        >
          <textarea
            name="promptGuida"
            rows={7}
            defaultValue={valori.promptGuida}
            placeholder="La storia si svolge durante il soggiorno all'Hotel…"
            className={`${classiCampo} font-medium`}
          />
        </Campo>
      </Sezione>

      <Sezione
        titolo="Capricci offerti"
        descrizione="Non selezionarne nessuno per offrirli tutti. Un hotel di montagna, per dire, ha senso che offra solo quelli che si vivono in vacanza."
      >
        <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
          {CAPRICCI.map((capriccio) => (
            <label
              key={capriccio.id}
              className="flex items-center gap-2.5 rounded-[14px] border border-bordo px-4 py-3 font-semibold"
            >
              <input
                type="checkbox"
                name="capricci"
                value={capriccio.id}
                defaultChecked={valori.capricci?.includes(capriccio.id) ?? false}
                className="h-4 w-4 accent-[var(--color-accento)]"
              />
              {capriccio.label}
            </label>
          ))}
        </div>
        {errori.capricci && (
          <p className="text-xs font-bold text-accento">{errori.capricci[0]}</p>
        )}
      </Sezione>

      <Sezione titolo="Colori" descrizione="Tre esadecimali: il resto del sito si adatta da solo.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { campo: "accento", etichetta: "Accento", valore: valori.tema.accento },
            { campo: "accentoSoft", etichetta: "Accento chiaro", valore: valori.tema.accentoSoft },
            { campo: "scuro", etichetta: "Scuro", valore: valori.tema.scuro },
          ].map((colore) => (
            <Campo
              key={colore.campo}
              etichetta={colore.etichetta}
              errore={errori.tema?.[0]}
            >
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  name={colore.campo}
                  defaultValue={colore.valore}
                  className="h-11 w-14 cursor-pointer rounded-lg border border-bordo bg-white"
                />
                <output className="font-mono text-sm font-semibold text-inchiostro-soft">
                  {colore.valore}
                </output>
              </span>
            </Campo>
          ))}
        </div>
      </Sezione>

      <Sezione titolo="Testi dell'hero" descrizione="Quello che l'ospite legge appena apre la pagina.">
        <div className="grid gap-4 md:grid-cols-2">
          <Campo etichetta="Occhiello" errore={errori.hero?.[0]}>
            <input name="occhiello" required defaultValue={valori.hero.occhiello} className={classiCampo} />
          </Campo>
          <Campo etichetta="Testo del bottone">
            <input name="cta" required defaultValue={valori.hero.cta} className={classiCampo} />
          </Campo>
          <Campo etichetta="Titolo">
            <input name="titolo" required defaultValue={valori.hero.titolo} className={classiCampo} />
          </Campo>
          <Campo etichetta="Titolo — parte colorata">
            <input
              name="titoloAccento"
              required
              defaultValue={valori.hero.titoloAccento}
              className={classiCampo}
            />
          </Campo>
        </div>
        <Campo etichetta="Sottotitolo">
          <textarea
            name="sottotitolo"
            required
            rows={3}
            defaultValue={valori.hero.sottotitolo}
            className={`${classiCampo} font-medium`}
          />
        </Campo>
      </Sezione>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={inCorso}
          className="lift rounded-full bg-accento px-8 py-4 font-bold text-crema disabled:opacity-40"
        >
          {inCorso ? "Salvataggio…" : nuovo ? "Crea merchant" : "Salva modifiche"}
        </button>

        {!nuovo && !principale && (
          <button
            type="submit"
            formAction={eliminaBrand}
            formNoValidate
            className="lift rounded-full border border-bordo bg-white px-6 py-4 font-bold text-inchiostro-soft"
          >
            Elimina
          </button>
        )}
        {!nuovo && principale && (
          <span className="text-sm font-medium text-inchiostro-tenue">
            È il sito principale: non si elimina.
          </span>
        )}
      </div>
    </form>
  );
}
