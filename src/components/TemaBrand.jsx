/**
 * Inietta i colori del brand come custom property CSS. Tutto il resto del sito
 * usa le utility Tailwind (bg-accento, text-scuro…), che leggono da qui: una
 * versione white-label si ottiene cambiando tre esadecimali nel backoffice.
 *
 * La classe `tema-brand` non è decorativa: è lei che rimappa --brand-* sui token
 * del tema. Senza, i colori dell'ente non arrivano a schermo (vedi globals.css).
 */
export default function TemaBrand({ brand, children }) {
  const stile = {
    "--brand-accento": brand.tema.accento,
    "--brand-accento-soft": brand.tema.accentoSoft,
    "--brand-scuro": brand.tema.scuro,
  };

  return (
    <div style={stile} className="tema-brand bg-crema text-inchiostro">
      {children}
    </div>
  );
}
