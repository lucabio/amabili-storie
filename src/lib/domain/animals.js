import { z } from "zod";

/**
 * @typedef {Object} Animal
 * @property {string} id
 * @property {string} plural
 * @property {string} singular
 * @property {string} setting  Scenery suggested to the model for the animal family.
 */

/** @type {Animal[]} */
export const ANIMALS = [
  { id: "pinguini", plural: "Pinguini", singular: "pinguino", setting: "una baia di ghiaccio" },
  { id: "orsetti", plural: "Orsetti", singular: "orsetto", setting: "una tana nel bosco" },
  { id: "conigli", plural: "Coniglietti", singular: "coniglietto", setting: "una conigliera tra i prati" },
  { id: "volpi", plural: "Volpine", singular: "volpina", setting: "una radura al tramonto" },
  { id: "elefanti", plural: "Elefantini", singular: "elefantino", setting: "una savana assolata" },
  { id: "gatti", plural: "Gattini", singular: "gattino", setting: "una casa dai tetti rossi" },
];

export const ANIMAL_IDS = ANIMALS.map((animal) => animal.id);

export const animalIdSchema = z.enum(ANIMAL_IDS);

export function getAnimal(id) {
  return ANIMALS.find((animal) => animal.id === id);
}
