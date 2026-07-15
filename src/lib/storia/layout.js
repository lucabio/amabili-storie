/**
 * Il modello di impaginazione di una pagina: dove stanno immagine e testo, e con
 * che stile. Condiviso fra l'editor (browser) e il PDF (server), così ciò che
 * l'amministratore trascina è esattamente ciò che viene stampato — WYSIWYG vero.
 *
 * Posizioni e dimensioni sono FRAZIONI della pagina (0–1): indipendenti dal
 * formato, mappano su qualsiasi dimensione (la tela dell'editor o l'A5 del PDF).
 */

/**
 * Le famiglie di font disponibili, identiche nei due mondi:
 * - `editorFamily`: il valore CSS `font-family` (vedi gli @font-face in globals.css)
 * - `pdfFamily`: la famiglia registrata in `@react-pdf` (vedi pdf.jsx)
 * Helvetica è built-in nel PDF: nessun file, nessun @font-face.
 */
export const FONT_CATALOG = [
  {
    chiave: "baloo2",
    label: "Baloo — tondo",
    editorFamily: '"Baloo2 Amabili", system-ui, sans-serif',
    pdfFamily: "Baloo2",
    corsivo: false,
  },
  {
    chiave: "fraunces",
    label: "Fraunces — serif",
    editorFamily: '"Fraunces Amabili", Georgia, serif',
    pdfFamily: "Fraunces",
    corsivo: true,
  },
  {
    chiave: "nunito",
    label: "Nunito — sans",
    editorFamily: '"Nunito Amabili", system-ui, sans-serif',
    pdfFamily: "Nunito",
    corsivo: true,
  },
  {
    chiave: "helvetica",
    label: "Helvetica",
    editorFamily: "Helvetica, Arial, sans-serif",
    pdfFamily: "Helvetica",
    corsivo: true,
  },
];

export const FONT_KEYS = FONT_CATALOG.map((f) => f.chiave);

export function fontById(chiave) {
  return FONT_CATALOG.find((f) => f.chiave === chiave) ?? FONT_CATALOG[0];
}

export const ALLINEAMENTI = ["left", "center", "right"];

/**
 * A5 orizzontale in punti PDF (1pt = 1/72"), lo stesso formato di pdf.jsx.
 * Serve all'editor per scalare la dimensione del font (in pt) alla tela in px,
 * così l'anteprima è a misura di stampa.
 */
export const PAGINA_PT = { larghezza: 595.28, altezza: 419.53 };
export const PAGINA_RATIO = PAGINA_PT.larghezza / PAGINA_PT.altezza;

export const STILE_DEFAULT = {
  font: "baloo2",
  dimensione: 16,
  colore: "#2b211d",
  allineamento: "center",
  grassetto: false,
  corsivo: false,
};

/** Default: immagine a tutta pagina, testo in una fascia in basso. */
export const LAYOUT_DEFAULT = {
  immagine: { x: 0, y: 0, w: 1, h: 1 },
  testo: { x: 0.06, y: 0.68, w: 0.88, h: 0.26 },
  stile: STILE_DEFAULT,
};

/** Fonde il layout salvato coi default: una pagina senza layout è comunque valida. */
export function layoutPagina(pagina) {
  const l = pagina?.layout ?? {};
  return {
    immagine: { ...LAYOUT_DEFAULT.immagine, ...(l.immagine ?? {}) },
    testo: { ...LAYOUT_DEFAULT.testo, ...(l.testo ?? {}) },
    stile: { ...STILE_DEFAULT, ...(l.stile ?? {}) },
  };
}
