/**
 * The layout model of a page: where image and text sit, and with what style.
 * Shared between the editor (browser) and the PDF (server), so what the admin
 * drags is exactly what gets printed — real WYSIWYG.
 *
 * Positions and sizes are FRACTIONS of the page (0–1): independent of the
 * format, they map onto any size (the editor canvas or the A5 of the PDF).
 */

/**
 * The available font families, identical in both worlds:
 * - `editorFamily`: the CSS `font-family` value (see the @font-face in globals.css)
 * - `pdfFamily`: the family registered in `@react-pdf` (see pdf.jsx)
 * Helvetica is built into the PDF: no file, no @font-face.
 */
export const FONT_CATALOG = [
  {
    key: "baloo2",
    label: "Baloo — tondo",
    editorFamily: '"Baloo2 Amabili", system-ui, sans-serif',
    pdfFamily: "Baloo2",
    italic: false,
  },
  {
    key: "fraunces",
    label: "Fraunces — serif",
    editorFamily: '"Fraunces Amabili", Georgia, serif',
    pdfFamily: "Fraunces",
    italic: true,
  },
  {
    key: "nunito",
    label: "Nunito — sans",
    editorFamily: '"Nunito Amabili", system-ui, sans-serif',
    pdfFamily: "Nunito",
    italic: true,
  },
  {
    key: "helvetica",
    label: "Helvetica",
    editorFamily: "Helvetica, Arial, sans-serif",
    pdfFamily: "Helvetica",
    italic: true,
  },
];

export const FONT_KEYS = FONT_CATALOG.map((font) => font.key);

export function fontById(key) {
  return FONT_CATALOG.find((font) => font.key === key) ?? FONT_CATALOG[0];
}

export const ALIGNMENTS = ["left", "center", "right"];

/**
 * A5 landscape in PDF points (1pt = 1/72"), the same format as pdf.jsx. The
 * editor needs it to scale the font size (in pt) to the canvas in px, so the
 * preview is at print scale.
 */
export const PAGE_PT = { width: 595.28, height: 419.53 };
export const PAGE_RATIO = PAGE_PT.width / PAGE_PT.height;

export const DEFAULT_STYLE = {
  font: "baloo2",
  size: 16,
  color: "#2b211d",
  align: "center",
  bold: false,
  italic: false,
};

/** Default: image full-page, text in a band at the bottom. */
export const DEFAULT_LAYOUT = {
  image: { x: 0, y: 0, w: 1, h: 1 },
  text: { x: 0.06, y: 0.68, w: 0.88, h: 0.26 },
  style: DEFAULT_STYLE,
};

/** Merges the saved layout with the defaults: a page without layout is still valid. */
export function pageLayout(page) {
  const saved = page?.layout ?? {};
  return {
    image: { ...DEFAULT_LAYOUT.image, ...(saved.image ?? {}) },
    text: { ...DEFAULT_LAYOUT.text, ...(saved.text ?? {}) },
    style: { ...DEFAULT_STYLE, ...(saved.style ?? {}) },
  };
}
