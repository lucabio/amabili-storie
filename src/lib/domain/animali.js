import { z } from "zod";

/**
 * @typedef {Object} Animale
 * @property {string} id
 * @property {string} plurale
 * @property {string} singolare
 * @property {string} ambiente  Ambientazione suggerita al modello per la famiglia animale.
 */

/** @type {Animale[]} */
export const ANIMALI = [
  { id: "pinguini", plurale: "Pinguini", singolare: "pinguino", ambiente: "una baia di ghiaccio" },
  { id: "orsetti", plurale: "Orsetti", singolare: "orsetto", ambiente: "una tana nel bosco" },
  { id: "conigli", plurale: "Coniglietti", singolare: "coniglietto", ambiente: "una conigliera tra i prati" },
  { id: "volpi", plurale: "Volpine", singolare: "volpina", ambiente: "una radura al tramonto" },
  { id: "elefanti", plurale: "Elefantini", singolare: "elefantino", ambiente: "una savana assolata" },
  { id: "gatti", plurale: "Gattini", singolare: "gattino", ambiente: "una casa dai tetti rossi" },
];

export const ANIMALE_IDS = ANIMALI.map((a) => a.id);

export const animaleIdSchema = z.enum(ANIMALE_IDS);

export function getAnimale(id) {
  return ANIMALI.find((a) => a.id === id);
}
