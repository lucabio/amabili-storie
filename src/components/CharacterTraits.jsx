"use client";

/**
 * The five trait fields of a character (child, mother or father), all optional.
 * Reused three times in the Configurator: a parent who just wants to click
 * "Genera" never touches them, whoever wants the detail finds the same form for
 * each protagonist.
 */
const FIELDS = [
  { key: "capelli", placeholder: "Capelli (es. ricci, corti…)" },
  { key: "coloreCapelli", placeholder: "Colore capelli" },
  { key: "coloreOcchi", placeholder: "Colore occhi" },
  { key: "corporatura", placeholder: "Corporatura" },
];

const inputClasses =
  "rounded-[14px] border border-bordo bg-crema px-3.5 py-2.5 text-sm font-semibold text-inchiostro outline-accento";

export default function CharacterTraits({ title, values, onChange }) {
  return (
    <div className="rounded-[14px] border border-bordo bg-white p-4">
      <p className="mb-3 text-sm font-bold text-inchiostro">{title}</p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2.5">
        {FIELDS.map(({ key, placeholder }) => (
          <input
            key={key}
            className={inputClasses}
            placeholder={placeholder}
            value={values[key]}
            onChange={onChange(key)}
          />
        ))}
        <input
          className={`${inputClasses} col-span-full`}
          placeholder="Un dettaglio in più (es. ha sempre in mano un dinosauro di gomma)"
          maxLength={200}
          value={values.descrizione}
          onChange={onChange("descrizione")}
        />
      </div>
    </div>
  );
}
