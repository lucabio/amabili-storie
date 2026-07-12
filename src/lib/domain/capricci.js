import { z } from "zod";

/**
 * I capricci sono il cuore del prodotto: la scelta del capriccio determina
 * l'arco narrativo che la storia deve seguire. `arco` e `bisogno` finiscono nel
 * prompt come vincoli narrativi — non sono testo che appare nel libro.
 *
 * `modelloTitolo` è una stringa con il segnaposto {nome}, non una funzione: i
 * capricci attraversano il confine server→client (la home li passa al
 * Configuratore) e React non sa serializzare le funzioni.
 *
 * @typedef {Object} Capriccio
 * @property {string} id
 * @property {string} label
 * @property {string} modelloTitolo  Titolo per la copertina live, con {nome} da sostituire.
 * @property {string} bisogno  Bisogno evolutivo sottostante: guida la legittimazione dell'emozione.
 * @property {string} arco     Arco narrativo che il modello deve rispettare.
 */

/** @type {Capriccio[]} */
export const CAPRICCI = [
  {
    id: "sonno",
    label: "Dormire da soli",
    modelloTitolo: "La notte stellata di {nome}",
    bisogno:
      "Sicurezza affettiva quando la vicinanza fisica del genitore viene a mancare.",
    arco: "Di giorno il bambino sta bene, ma la sera la cameretta sembra troppo grande. Un genitore dà un nome all'emozione e la legittima. Insieme trovano un simbolo che rende presente l'amore anche a distanza. Il bambino affronta la notte e si addormenta da solo.",
  },
  {
    id: "pannolino",
    label: "Via il pannolino",
    modelloTitolo: "{nome} e il vasino dei grandi",
    bisogno: "Autonomia corporea e tolleranza dell'errore durante l'apprendimento.",
    arco: "Il bambino guarda il vasino con diffidenza. Impara a riconoscere i segnali del proprio corpo. Un primo tentativo va storto e i genitori lo normalizzano senza colpevolizzare. Un tentativo riesce: il bambino scopre di potersi fidare del proprio corpo.",
  },
  {
    id: "gelosia",
    label: "Gelosia del fratellino",
    modelloTitolo: "{nome} e il nuovo arrivato",
    bisogno:
      "Certezza di non essere sostituito, e diritto a provare emozioni ambivalenti.",
    arco: "Arriva un fratellino e il bambino sente un groviglio di amore e rabbia. Un genitore dà un nome a quel sentimento e lo dichiara legittimo. Il bambino scopre di avere un ruolo unico e insostituibile. Capisce che il posto nel cuore dei genitori non si divide: si allarga.",
  },
  {
    id: "buio",
    label: "Paura del buio",
    modelloTitolo: "{nome} e la lampada delle meraviglie",
    bisogno: "Padroneggiare la paura trasformando l'ignoto in conosciuto.",
    arco: "Al buio gli oggetti familiari diventano minacciosi. Il bambino riceve uno strumento per verificare la realtà. Scopre che sono gli stessi oggetti amici del giorno. Il buio diventa il momento delle cose speciali: le stelle, i sogni, le storie.",
  },
  {
    id: "cibo",
    label: "Non vuole assaggiare",
    modelloTitolo: "{nome} e il morso dell'esploratore",
    bisogno: "Controllo e prevedibilità di fronte al nuovo. Mai coercizione.",
    arco: "Nel piatto c'è qualcosa di nuovo e sospetto. Il bambino esplora con tutti i sensi, senza obbligo di mangiare. Un genitore propone un patto: un assaggio, poi decidi tu. Il bambino assaggia e viene lodato per il coraggio di provare, non per aver gradito.",
  },
  {
    id: "nido",
    label: "Inserimento al nido",
    modelloTitolo: "Il primo giorno di {nome}",
    bisogno: "Fiducia nella prevedibilità del ritorno del genitore.",
    arco: "Il primo giorno di nido incombe. Un genitore lascia un simbolo tangibile della propria presenza e una promessa chiara: io torno sempre. Il distacco è difficile, e va bene così. Il bambino scopre il mondo nuovo, e il genitore mantiene la promessa.",
  },
  {
    id: "bagnetto",
    label: "Non vuole fare il bagnetto",
    modelloTitolo: "{nome} e la nave-vasca",
    bisogno: "Prevedibilità e controllo sull'esperienza sensoriale.",
    arco: "L'acqua, la schiuma e il rumore dello scarico spaventano il bambino. La paura viene accolta senza forzature. Il bagnetto diventa un gioco di cui il bambino ha il comando. Il bambino entra in acqua alle proprie condizioni e ci sta bene.",
  },
  {
    id: "vacanza",
    label: "Dormire in vacanza",
    modelloTitolo: "{nome} e il letto viaggiatore",
    bisogno: "Continuità dei riti in un ambiente sconosciuto.",
    arco: "In un letto sconosciuto il bambino non si orienta e non si addormenta. Porta con sé un pezzo di casa e ricostruisce il rito della nanna. Il luogo nuovo diventa familiare. Il bambino scopre che la nanna la porta dentro di sé, non nella stanza.",
  },
  {
    id: "altro",
    label: "Altro: dillo tu",
    modelloTitolo: "La grande impresa di {nome}",
    bisogno: "Definito dal genitore nella descrizione libera.",
    arco: "La sfida descritta dal genitore sembra troppo grande. L'emozione del bambino viene nominata e legittimata. La sfida viene scomposta in un primo passo affrontabile. Il bambino ce la fa e impara che le grandi imprese si fanno un passo alla volta.",
  },
];

export const CAPRICCIO_IDS = CAPRICCI.map((c) => c.id);

/** Validatore riusabile: accetta solo un capriccio esistente. */
export const capriccioIdSchema = z.enum(CAPRICCIO_IDS);

export function getCapriccio(id) {
  return CAPRICCI.find((c) => c.id === id);
}

/** Titolo di riferimento per un capriccio, col nome del bambino dentro. */
export function componiTitolo(capriccio, nome) {
  if (!capriccio) return "La tua storia";
  return capriccio.modelloTitolo.replaceAll("{nome}", nome);
}
