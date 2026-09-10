/**
 * Injects the brand colors as CSS custom properties. The whole rest of the site
 * uses the Tailwind utilities (bg-accento, text-scuro…), which read from here: a
 * white-label version is a matter of changing three hex codes in the backoffice.
 *
 * The `tema-brand` class is not decorative: it is what remaps --brand-* onto the
 * theme tokens. Without it the merchant's colors never reach the screen (see
 * globals.css).
 */
export default function BrandTheme({ brand, children }) {
  const style = {
    "--brand-accento": brand.theme.accento,
    "--brand-accento-soft": brand.theme.accentoSoft,
    "--brand-scuro": brand.theme.scuro,
  };

  return (
    <div style={style} className="tema-brand bg-crema text-inchiostro">
      {children}
    </div>
  );
}
