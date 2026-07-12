/**
 * Inietta i colori del brand come custom property CSS. Tutto il resto del sito
 * usa le utility Tailwind (bg-accento, text-scuro…), che leggono da qui: una
 * versione white-label si ottiene cambiando tre esadecimali nel backoffice.
 */
export default function TemaBrand({ brand, children }) {
  const stile = {
    "--brand-accento": brand.tema.accento,
    "--brand-accento-soft": brand.tema.accentoSoft,
    "--brand-scuro": brand.tema.scuro,
  };

  return (
    <div style={stile} className="bg-crema text-inchiostro">
      {children}
    </div>
  );
}
