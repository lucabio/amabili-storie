"use client";

import { useState, useTransition } from "react";

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
  const [inCorso, avvia] = useTransition();

  const revisionabile = storia.stato === "in_revisione";
  const rigenerabile = transizionePermessa(storia.stato, "in_generazione");

  function aggiornaPagina(indice, campo, valore) {
    setContenuto((precedente) => ({
      ...precedente,
      pagine: precedente.pagine.map((pagina, i) =>
        i === indice ? { ...pagina, [campo]: valore } : pagina,
      ),
    }));
  }

  // Generare un'immagine è lento (secondi): stato per-pagina, così i bottoni
  // delle altre pagine restano usabili mentre una è in corso.
  async function illustra(indice) {
    setIllustrando((stato) => ({ ...stato, [indice]: true }));
    setEsito(null);
    const risposta = await generaIllustrazioneStoria(
      storia.id,
      indice,
      contenuto.pagine[indice].illustrazione,
    );
    setIllustrando((stato) => ({ ...stato, [indice]: false }));
    if (risposta?.ok && risposta.url) {
      aggiornaPagina(indice, "illustrazioneUrl", risposta.url);
    } else {
      setEsito(risposta);
    }
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
          onChange={(evento) =>
            setContenuto({ ...contenuto, titolo: evento.target.value })
          }
          disabled={!revisionabile}
          className="mt-2 w-full rounded-[14px] border border-bordo bg-white px-4 py-3 font-display text-lg font-semibold outline-accento disabled:bg-crema disabled:text-inchiostro-soft"
        />
      </label>

      <div className="mt-8 grid gap-5">
        {(contenuto.pagine ?? []).map((pagina, indice) => (
          <div key={indice} className="rounded-card border border-bordo bg-white p-5">
            <span className="text-sm font-bold text-inchiostro-tenue uppercase">
              Pagina {indice + 1}
            </span>

            <textarea
              value={pagina.testo}
              onChange={(evento) => aggiornaPagina(indice, "testo", evento.target.value)}
              rows={3}
              disabled={!revisionabile}
              className="mt-3 w-full rounded-[14px] border border-bordo px-4 py-3 leading-relaxed font-medium outline-accento disabled:bg-crema disabled:text-inchiostro-soft"
            />

            <label className="mt-3 block">
              <span className="text-xs font-bold text-inchiostro-tenue uppercase">
                La scena da illustrare
              </span>
              <textarea
                value={pagina.illustrazione}
                onChange={(evento) =>
                  aggiornaPagina(indice, "illustrazione", evento.target.value)
                }
                rows={2}
                disabled={!revisionabile}
                className="mt-1.5 w-full rounded-[14px] border border-bordo px-4 py-2.5 text-sm font-medium outline-accento disabled:bg-crema disabled:text-inchiostro-soft"
              />
            </label>

            <div className="mt-4 flex flex-wrap items-start gap-4">
              {pagina.illustrazioneUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pagina.illustrazioneUrl}
                  alt={`Illustrazione pagina ${indice + 1}`}
                  className="h-40 w-40 rounded-[14px] border border-bordo object-cover"
                />
              )}
              {revisionabile && (
                <button
                  type="button"
                  disabled={illustrando[indice] || !pagina.illustrazione?.trim()}
                  onClick={() => illustra(indice)}
                  className="lift rounded-full border border-accento px-5 py-2.5 text-sm font-bold text-accento disabled:opacity-40"
                >
                  {illustrando[indice]
                    ? "Sto disegnando…"
                    : pagina.illustrazioneUrl
                      ? "Rigenera illustrazione"
                      : "Genera illustrazione"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <label className="mt-8 block">
        <span className="text-sm font-bold text-inchiostro-soft uppercase">
          Frase-àncora
        </span>
        <input
          value={contenuto.fraseAncora ?? ""}
          onChange={(evento) =>
            setContenuto({ ...contenuto, fraseAncora: evento.target.value })
          }
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
