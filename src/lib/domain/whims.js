import { z } from "zod";

/**
 * Whims are the heart of the product: picking a whim decides the narrative arc
 * the story has to follow. `arc` and `need` end up in the prompt as narrative
 * constraints — they are not text that shows up in the book.
 *
 * `titleTemplate` is a string with a {name} placeholder, not a function: whims
 * cross the server→client boundary (the home page hands them to the
 * Configurator) and React cannot serialize functions.
 *
 * Ids and copy stay Italian on purpose: the ids are stored data, and the copy
 * is what an Italian parent reads.
 *
 * @typedef {Object} Whim
 * @property {string} id
 * @property {string} label
 * @property {string} titleTemplate  Title for the live cover, with {name} to replace.
 * @property {string} need  Underlying developmental need: drives how the emotion is validated.
 * @property {string} arc   Narrative arc the model has to respect.
 */

/** @type {Whim[]} */
export const WHIMS = [
  {
    id: "sonno",
    label: "Dormire da soli",
    titleTemplate: "La notte stellata di {nome}",
    need:
      "Sicurezza affettiva quando la vicinanza fisica del genitore viene a mancare.",
    arc: "Di giorno il bambino sta bene, ma la sera la cameretta sembra troppo grande. Un genitore dà un nome all'emozione e la legittima. Insieme trovano un simbolo che rende presente l'amore anche a distanza. Il bambino affronta la notte e si addormenta da solo.",
  },
  {
    id: "pannolino",
    label: "Via il pannolino",
    titleTemplate: "{nome} e il vasino dei grandi",
    need: "Autonomia corporea e tolleranza dell'errore durante l'apprendimento.",
    arc: "Il bambino guarda il vasino con diffidenza. Impara a riconoscere i segnali del proprio corpo. Un primo tentativo va storto e i genitori lo normalizzano senza colpevolizzare. Un tentativo riesce: il bambino scopre di potersi fidare del proprio corpo.",
  },
  {
    id: "gelosia",
    label: "Gelosia del fratellino",
    titleTemplate: "{nome} e il nuovo arrivato",
    need:
      "Certezza di non essere sostituito, e diritto a provare emozioni ambivalenti.",
    arc: "Arriva un fratellino e il bambino sente un groviglio di amore e rabbia. Un genitore dà un nome a quel sentimento e lo dichiara legittimo. Il bambino scopre di avere un ruolo unico e insostituibile. Capisce che il posto nel cuore dei genitori non si divide: si allarga.",
  },
  {
    id: "buio",
    label: "Paura del buio",
    titleTemplate: "{nome} e la lampada delle meraviglie",
    need: "Padroneggiare la paura trasformando l'ignoto in conosciuto.",
    arc: "Al buio gli oggetti familiari diventano minacciosi. Il bambino riceve uno strumento per verificare la realtà. Scopre che sono gli stessi oggetti amici del giorno. Il buio diventa il momento delle cose speciali: le stelle, i sogni, le storie.",
  },
  {
    id: "cibo",
    label: "Non vuole assaggiare",
    titleTemplate: "{nome} e il morso dell'esploratore",
    need: "Controllo e prevedibilità di fronte al nuovo. Mai coercizione.",
    arc: "Nel piatto c'è qualcosa di nuovo e sospetto. Il bambino esplora con tutti i sensi, senza obbligo di mangiare. Un genitore propone un patto: un assaggio, poi decidi tu. Il bambino assaggia e viene lodato per il coraggio di provare, non per aver gradito.",
  },
  {
    id: "nido",
    label: "Inserimento al nido",
    titleTemplate: "Il primo giorno di {nome}",
    need: "Fiducia nella prevedibilità del ritorno del genitore.",
    arc: "Il primo giorno di nido incombe. Un genitore lascia un simbolo tangibile della propria presenza e una promessa chiara: io torno sempre. Il distacco è difficile, e va bene così. Il bambino scopre il mondo nuovo, e il genitore mantiene la promessa.",
  },
  {
    id: "bagnetto",
    label: "Non vuole fare il bagnetto",
    titleTemplate: "{nome} e la nave-vasca",
    need: "Prevedibilità e controllo sull'esperienza sensoriale.",
    arc: "L'acqua, la schiuma e il rumore dello scarico spaventano il bambino. La paura viene accolta senza forzature. Il bagnetto diventa un gioco di cui il bambino ha il comando. Il bambino entra in acqua alle proprie condizioni e ci sta bene.",
  },
  {
    id: "vacanza",
    label: "Dormire in vacanza",
    titleTemplate: "{nome} e il letto viaggiatore",
    need: "Continuità dei riti in un ambiente sconosciuto.",
    arc: "In un letto sconosciuto il bambino non si orienta e non si addormenta. Porta con sé un pezzo di casa e ricostruisce il rito della nanna. Il luogo nuovo diventa familiare. Il bambino scopre che la nanna la porta dentro di sé, non nella stanza.",
  },
  {
    id: "altro",
    label: "Altro: dillo tu",
    titleTemplate: "La grande impresa di {nome}",
    need: "Definito dal genitore nella descrizione libera.",
    arc: "La sfida descritta dal genitore sembra troppo grande. L'emozione del bambino viene nominata e legittimata. La sfida viene scomposta in un primo passo affrontabile. Il bambino ce la fa e impara che le grandi imprese si fanno un passo alla volta.",
  },
];

export const WHIM_IDS = WHIMS.map((whim) => whim.id);

/** Reusable validator: only accepts an existing whim. */
export const whimIdSchema = z.enum(WHIM_IDS);

export function getWhim(id) {
  return WHIMS.find((whim) => whim.id === id);
}

/** Reference title for a whim, with the child's name inside. */
export function composeTitle(whim, name) {
  if (!whim) return "La tua storia";
  return whim.titleTemplate.replaceAll("{nome}", name);
}
