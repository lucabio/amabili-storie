/**
 * Injects the brand colors as CSS custom properties. The whole rest of the site
 * uses the Tailwind utilities (bg-accent, text-dark…), which read from here: a
 * white-label version is a matter of changing three hex codes in the backoffice.
 *
 * The `tema-brand` class is not decorative: it is what remaps --brand-* onto the
 * theme tokens. Without it the merchant's colors never reach the screen (see
 * globals.css).
 */
export default function BrandTheme({ brand, children }) {
  const style = {
    "--brand-accent": brand.theme.accento,
    "--brand-accent-soft": brand.theme.accentoSoft,
    "--brand-dark": brand.theme.scuro,
  };

  return (
    <div style={style} className="brand-theme bg-cream text-ink">
      {children}
    </div>
  );
}
