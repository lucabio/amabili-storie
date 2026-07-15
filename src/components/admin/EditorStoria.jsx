"use client";

import { useEffect, useState, useTransition } from "react";

import {
  approvaStoria,
  generaIllustrazioneStoria,
  rifiutaStoria,
  rigeneraStoria,
  salvaStoria,
} from "@/app/admin/storie/azioni";
import { ETICHETTE, transizionePermessa } from "@/lib/storia/stati";

export default function EditorStoria({ storia }) {
  const [contenuto, setContenuto] = useState(storia.contenuto);
  const [nota, setNota] = useState("");
  const [esito, setEsito] = useState(null);
  const [illustrando, setIllustrando] = useState({});
  const [erroriPagina, setErroriPagina] = useState({});
  const [bulk, setBulk] = useState(null);
  const [pagina, setPagina] = useState(0);
  const [inCorso, avvia] = useTransition();

  const pagine = contenuto.pagine ?? [];
  const totale = pagine.length;
  const indice = Math.min(pagina, Math.max(0, totale - 1));
  const corrente = pagine[indice];

  const revisionabile = storia.stato === "in_revisione";
  const rigenerabile = transizionePermessa(storia.stato, "in_generazione");
  const bulkInCorso = bulk !== null;
  const mancanti = pagine.filter((p) => !p.illustrazioneUrl).length;

  // Si sfoglia con le frecce — ma non mentre si scrive in un campo, lì le frecce
  // muovono il cursore.
  useEffect(() => {
    function onKey(evento) {
      const t = evento.target;
      if (
        t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (evento.key === "ArrowLeft") setPagina((p) => Math.max(0, p - 1));
      else if (evento.key === "ArrowRight") setPagina((p) => Math.min(totale - 1, p + 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [totale]);

  function aggiornaPagina(i, campo, valore) {
    setContenuto((precedente) => ({
      ...precedente,
      pagine: precedente.pagine.map((p, j) => (j === i ? { ...p, [campo]: valore } : p)),
    }));
  }

  async function illustra(i) {
    setIllustrando((s) => ({ ...s, [i]: true }));
    setErroriPagina((e) => {
      const copia = { ...e };
      delete copia[i];
      return copia;
    });
    const risposta = await generaIllustrazioneStoria(storia.id, i, pagine[i].illustrazione);
    setIllustrando((s) => ({ ...s, [i]: false }));
    if (risposta?.ok && risposta.url) {
      aggiornaPagina(i, "illustrazioneUrl", risposta.url);
      return true;
    }
    setErroriPagina((e) => ({ ...e, [i]: risposta?.errore ?? "Illustrazione non generata." }));
    return false;
  }

  // Genera solo le pagine ancora senza figura, una alla volta: sequenziale per
  // non prendere rate limit e perché ogni scrittura del contenuto è atomica
  // rispetto alla precedente (niente clobber del JSON).
  async function illustraTutte() {
    const daFare = pagine.map((_, i) => i).filter((i) => !pagine[i].illustrazioneUrl);
    if (daFare.length === 0) return;
    setBulk({ fatte: 0, totali: daFare.length });
    for (let k = 0; k < daFare.length; k++) {
      await illustra(daFare[k]);
      setBulk({ fatte: k + 1, totali: daFare.length });
    }
    setBulk(null);
  }

  function esegui(azione) {
    avvia(async () => {
      const risposta = await azione();
      setEsito(risposta);
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-accento px-3 py-1 text-xs font-bold text-crema uppercase">
          {ETICHETTE[storia.stato]}
        </span>
        <h1 className="font-display text-2xl font-semibold">
          {storia.parametri?.nome} · {storia.parametri?.capriccio}
        </h1>
        <a
          href={`/admin/storie/${storia.id}/pdf`}
          className="lift ml-auto rounded-full border border-bordo bg-white px-5 py-2.5 text-sm font-bold text-inchiostro-soft"
        >
          Scarica PDF
        </a>
      </div>

      {storia.stato === "fallita" && storia.errore && (
        <p className="mt-4 rounded-card bg-accento/10 p-4 font-semibold text-accento">
          La generazione è fallita: {storia.errore}
        </p>
      )}
      {storia.stato === "rifiutata" && storia.note_revisione && (
        <p className="mt-4 rounded-card bg-accento/10 p-4 font-semibold text-accento">
          Rifiutata: {storia.note_revisione}
        </p>
      )}

      {esito?.errore && (
        <p className="mt-4 rounded-card bg-accento/10 p-4 font-semibold text-accento">
          {esito.errore}
        </p>
      )}
      {esito?.ok && (
        <p className="mt-4 rounded-card bg-accento-soft/20 p-4 font-semibold text-scuro">
          Fatto.
        </p>
      )}

      <label className="mt-8 block">
        <span className="text-sm font-bold text-inchiostro-soft uppercase">Titolo</span>
        <input
          value={contenuto.titolo ?? ""}
          onChange={(evento) => setContenuto({ ...contenuto, titolo: evento.target.value })}
          disabled={!revisionabile}
          className="mt-2 w-full rounded-[14px] border border-bordo bg-white px-4 py-3 font-display text-lg font-semibold outline-accento disabled:bg-crema disabled:text-inchiostro-soft"
        />
      </label>

      {revisionabile && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={illustraTutte}
            disabled={bulkInCorso || mancanti === 0}
            className="lift rounded-full bg-accento px-6 py-3 font-bold text-crema disabled:opacity-40"
          >
            {bulkInCorso
              ? `Genero le illustrazioni… ${bulk.fatte}/${bulk.totali}`
              : mancanti === 0
                ? "Tutte le illustrazioni ci sono"
                : `Genera tutte le illustrazioni (${mancanti})`}
          </button>
          <span className="text-sm font-medium text-inchiostro-tenue">
            Genera le pagine ancora senza figura. Le singole si rifanno sfogliando qui sotto.
          </span>
        </div>
      )}

      {/* Il libro, una pagina alla volta: frecce a schermo o ← → da tastiera. */}
      {corrente && (
        <div className="mt-6 flex items-stretch gap-3">
          <button
            type="button"
            onClick={() => setPagina((p) => Math.max(0, p - 1))}
            disabled={indice === 0}
            aria-label="Pagina precedente"
            className="lift shrink-0 self-center rounded-full border border-bordo bg-white px-4 py-6 text-2xl font-bold text-inchiostro-soft disabled:opacity-30"
          >
            ‹
          </button>

          <article className="flex-1 rounded-card border border-bordo bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-bold text-inchiostro-tenue uppercase">
                Pagina {indice + 1} di {totale}
              </span>
              <span className="text-xs font-medium text-inchiostro-tenue">
                ← → per sfogliare
              </span>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                {corrente.illustrazioneUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={corrente.illustrazioneUrl}
                    alt={`Illustrazione pagina ${indice + 1}`}
                    className="h-64 w-full rounded-[14px] border border-bordo object-cover"
                  />
                ) : (
                  <div className="flex h-64 w-full items-center justify-center rounded-[14px] border border-dashed border-bordo bg-crema text-sm font-medium text-inchiostro-tenue">
                    {illustrando[indice] ? "Sto disegnando…" : "Nessuna illustrazione"}
                  </div>
                )}
                {revisionabile && (
                  <button
                    type="button"
                    disabled={illustrando[indice] || bulkInCorso || !corrente.illustrazione?.trim()}
                    onClick={() => illustra(indice)}
                    className="lift rounded-full border border-accento px-5 py-2.5 text-sm font-bold text-accento disabled:opacity-40"
                  >
                    {illustrando[indice]
                      ? "Sto disegnando…"
                      : corrente.illustrazioneUrl
                        ? "Rigenera illustrazione"
                        : "Genera illustrazione"}
                  </button>
                )}
                {erroriPagina[indice] && (
                  <p className="rounded-[14px] bg-accento/10 px-4 py-3 text-sm font-semibold text-accento">
                    {erroriPagina[indice]}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <textarea
                  value={corrente.testo}
                  onChange={(evento) => aggiornaPagina(indice, "testo", evento.target.value)}
                  rows={6}
                  disabled={!revisionabile}
                  className="w-full rounded-[14px] border border-bordo px-4 py-3 leading-relaxed font-medium outline-accento disabled:bg-crema disabled:text-inchiostro-soft"
                />
                <label className="block">
                  <span className="text-xs font-bold text-inchiostro-tenue uppercase">
                    La scena da illustrare
                  </span>
                  <textarea
                    value={corrente.illustrazione}
                    onChange={(evento) =>
                      aggiornaPagina(indice, "illustrazione", evento.target.value)
                    }
                    rows={3}
                    disabled={!revisionabile}
                    className="mt-1.5 w-full rounded-[14px] border border-bordo px-4 py-2.5 text-sm font-medium outline-accento disabled:bg-crema disabled:text-inchiostro-soft"
                  />
                </label>
              </div>
            </div>
          </article>

          <button
            type="button"
            onClick={() => setPagina((p) => Math.min(totale - 1, p + 1))}
            disabled={indice === totale - 1}
            aria-label="Pagina successiva"
            className="lift shrink-0 self-center rounded-full border border-bordo bg-white px-4 py-6 text-2xl font-bold text-inchiostro-soft disabled:opacity-30"
          >
            ›
          </button>
        </div>
      )}

      <label className="mt-8 block">
        <span className="text-sm font-bold text-inchiostro-soft uppercase">Frase-àncora</span>
        <input
          value={contenuto.fraseAncora ?? ""}
          onChange={(evento) => setContenuto({ ...contenuto, fraseAncora: evento.target.value })}
          disabled={!revisionabile}
          className="mt-2 w-full rounded-[14px] border border-bordo bg-white px-4 py-3 font-semibold outline-accento disabled:bg-crema disabled:text-inchiostro-soft"
        />
      </label>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-bordo pt-6">
        {revisionabile && (
          <>
            <button
              type="button"
              disabled={inCorso}
              onClick={() => esegui(() => salvaStoria(storia.id, contenuto))}
              className="lift rounded-full border border-bordo bg-white px-6 py-3 font-bold disabled:opacity-40"
            >
              Salva
            </button>

            <button
              type="button"
              disabled={inCorso}
              onClick={() => esegui(() => approvaStoria(storia.id))}
              className="lift rounded-full bg-accento px-6 py-3 font-bold text-crema disabled:opacity-40"
            >
              Approva e manda la mail
            </button>

            <input
              value={nota}
              onChange={(evento) => setNota(evento.target.value)}
              placeholder="Perché la rifiuti?"
              className="ml-auto rounded-full border border-bordo bg-white px-4 py-2.5 text-sm font-semibold outline-accento"
            />
            <button
              type="button"
              disabled={inCorso || !nota.trim()}
              onClick={() => esegui(() => rifiutaStoria(storia.id, nota))}
              className="lift rounded-full border border-accento px-6 py-3 font-bold text-accento disabled:opacity-40"
            >
              Rifiuta
            </button>
          </>
        )}

        {rigenerabile && (
          <button
            type="button"
            disabled={inCorso}
            onClick={() => esegui(() => rigeneraStoria(storia.id))}
            className="lift rounded-full bg-accento px-6 py-3 font-bold text-crema disabled:opacity-40"
          >
            Rigenera
          </button>
        )}
      </div>
    </div>
  );
}
