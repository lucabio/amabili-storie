/**
 * The lifecycle of a purchased story. Five states, each one matching something
 * an admin does, or something that went wrong. No decorative states.
 *
 * There is no way back from `approvata`: if the book already went out, the
 * correction is a new book, not a state change.
 *
 * The values stay Italian on purpose: they are stored data, and `LABELS` is
 * what the backoffice actually shows.
 */
export const STATES = [
  "in_generazione",
  "in_revisione",
  "approvata",
  "rifiutata",
  "fallita",
];

export const TRANSITIONS = {
  in_generazione: ["in_revisione", "fallita"],
  in_revisione: ["approvata", "rifiutata"],
  approvata: [],
  rifiutata: ["in_generazione"],
  fallita: ["in_generazione"],
};

/** Labels for the backoffice. */
export const LABELS = {
  in_generazione: "In generazione",
  in_revisione: "Da rivedere",
  approvata: "Approvata",
  rifiutata: "Rifiutata",
  fallita: "Fallita",
};

export function transitionAllowed(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to);
}
