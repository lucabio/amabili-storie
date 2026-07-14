"use client";

/**
 * I cinque campi dei tratti di un personaggio (bambino, mamma o papà), tutti
 * facoltativi. Riusato tre volte nel Configuratore: un genitore che vuole solo
 * cliccare "Genera" non li tocca mai, chi vuole entrare nel dettaglio trova lo
 * stesso modulo per ciascun protagonista.
 */
const CAMPI = [
  { chiave: "capelli", placeholder: "Capelli (es. ricci, corti…)" },
  { chiave: "coloreCapelli", placeholder: "Colore capelli" },
  { chiave: "coloreOcchi", placeholder: "Colore occhi" },
  { chiave: "corporatura", placeholder: "Corporatura" },
];

const classiInput =
  "rounded-[14px] border border-bordo bg-crema px-3.5 py-2.5 text-sm font-semibold text-inchiostro outline-accento";

export default function TrattiPersonaggio({ titolo, valori, aggiorna }) {
  return (
    <div className="rounded-[14px] border border-bordo bg-white p-4">
      <p className="mb-3 text-sm font-bold text-inchiostro">{titolo}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
        {CAMPI.map(({ chiave, placeholder }) => (
          <input
            key={chiave}
            className={classiInput}
            placeholder={placeholder}
            value={valori[chiave]}
            onChange={aggiorna(chiave)}
          />
        ))}
        <input
          className={`${classiInput} col-span-full`}
          placeholder="Un dettaglio in più (es. ha sempre in mano un dinosauro di gomma)"
          maxLength={200}
          value={valori.descrizione}
          onChange={aggiorna("descrizione")}
        />
      </div>
    </div>
  );
}
