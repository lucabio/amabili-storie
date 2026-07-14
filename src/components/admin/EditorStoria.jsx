"use client";

import { useState, useTransition } from "react";

import { approvaStoria, rifiutaStoria, salvaStoria } from "@/app/admin/storie/azioni";
import { ETICHETTE } from "@/lib/storia/stati";

export default function EditorStoria({ storia }) {
  const [contenuto, setContenuto] = useState(storia.contenuto);
  const [nota, setNota] = useState("");
  const [esito, setEsito] = useState(null);
  const [inCorso, avvia] = useTransition();

  const revisionabile = storia.stato === "in_revisione";

  function aggiornaPagina(indice, campo, valore) {
    setContenuto((precedente) => ({
      ...precedente,
      pagine: precedente.pagine.map((pagina, i) =>
        i === indice ? { ...pagina, [campo]: valore } : pagina,
      ),
    }));
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
      </div>

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
          className="mt-2 w-full rounded-[14px] border border-bordo bg-white px-4 py-3 font-display text-lg font-semibold outline-accento"
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
              className="mt-3 w-full rounded-[14px] border border-bordo px-4 py-3 leading-relaxed font-medium outline-accento"
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
                className="mt-1.5 w-full rounded-[14px] border border-bordo px-4 py-2.5 text-sm font-medium outline-accento"
              />
            </label>
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
          className="mt-2 w-full rounded-[14px] border border-bordo bg-white px-4 py-3 font-semibold outline-accento"
        />
      </label>

      <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-bordo pt-6">
        <button
          type="button"
          disabled={inCorso}
          onClick={() => esegui(() => salvaStoria(storia.id, contenuto))}
          className="lift rounded-full border border-bordo bg-white px-6 py-3 font-bold disabled:opacity-40"
        >
          Salva
        </button>

        {revisionabile && (
          <>
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
      </div>
    </div>
  );
}
