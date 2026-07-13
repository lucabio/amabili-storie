/**
 * Il ciclo di vita di una storia acquistata. Cinque stati, e ognuno corrisponde
 * a qualcosa che un amministratore fa, o che è andato storto. Nessuno stato
 * decorativo.
 *
 * Da `approvata` non si torna indietro: se il libro è già partito, la correzione
 * è un libro nuovo, non un cambio di stato.
 */
export const STATI = [
  "in_generazione",
  "in_revisione",
  "approvata",
  "rifiutata",
  "fallita",
];

export const TRANSIZIONI = {
  in_generazione: ["in_revisione", "fallita"],
  in_revisione: ["approvata", "rifiutata"],
  approvata: [],
  rifiutata: ["in_generazione"],
  fallita: ["in_generazione"],
};

/** Etichette per il backoffice. */
export const ETICHETTE = {
  in_generazione: "In generazione",
  in_revisione: "Da rivedere",
  approvata: "Approvata",
  rifiutata: "Rifiutata",
  fallita: "Fallita",
};

export function transizionePermessa(da, a) {
  return (TRANSIZIONI[da] ?? []).includes(a);
}
