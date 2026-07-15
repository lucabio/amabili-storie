import { getAnimale } from "@/lib/domain/animali";
import { getCapriccio } from "@/lib/domain/capricci";

/** Etichette leggibili per i tratti di un personaggio, nell'ordine del prompt. */
const ETICHETTE_TRATTI = [
  ["capelli", "capelli"],
  ["coloreCapelli", "colore capelli"],
  ["coloreOcchi", "colore occhi"],
  ["corporatura", "corporatura"],
  ["descrizione", "dettaglio"],
];

/**
 * Riassume i tratti compilati di un personaggio in una frase, ignorando i campi
 * vuoti. Un elenco di campi vuoti ("capelli: , occhi: ") confonde il modello,
 * quindi se non c'è nulla di compilato non produce nessuna riga.
 */
function descriviTratti(tratti) {
  if (!tratti) return "";
  return ETICHETTE_TRATTI.map(([campo, etichetta]) => tratti[campo] && `${etichetta}: ${tratti[campo]}`)
    .filter(Boolean)
    .join(", ");
}

/**
 * Il Metodo Amabili è la promessa del prodotto ("non un regalo, uno strumento"):
 * questi vincoli non sono stilistici, sono la ragione per cui una famiglia paga.
 * Toccarli cambia il prodotto — parlarne con Silvia prima.
 */
const METODO_AMABILI = `Sei l'autore di Amabili Storie: libri illustrati personalizzati che aiutano un bambino a superare una difficoltà concreta ("un capriccio").

Regole non negoziabili del Metodo Amabili:
1. L'emozione del bambino va sempre NOMINATA e LEGITTIMATA, mai punita né ridicolizzata. Nessun personaggio dice al bambino che sbaglia a sentirsi così.
2. La soluzione NASCE DAL BAMBINO. I genitori accompagnano, offrono un simbolo o un patto, ma non risolvono al posto suo.
3. Nessuna minaccia, nessun ricatto, nessuna vergogna, nessun premio materiale come leva.
4. L'errore è parte del percorso: se qualcosa va storto, viene normalizzato con calma.
5. Il finale è una conquista sobria e credibile, non un miracolo. Il bambino fa un passo, non diventa un altro.
6. Niente paure aggiunte: nessun mostro reale, nessun pericolo vero, nessuna morte, nessuna malattia.

Stile:
- Italiano, per la lettura ad alta voce di un genitore.
- Frasi brevi e concrete. Ritmo dolce. Qualche ripetizione musicale è benvenuta.
- Dialoghi con le virgolette basse: «così».
- Adatta il lessico all'età indicata.
- Mai emoji nel testo del libro.`;

/** System prompt: metodo + eventuale filo comune dell'ente. */
export function costruisciSystemPrompt(brand) {
  if (!brand?.promptGuida) return METODO_AMABILI;

  return `${METODO_AMABILI}

--- AMBIENTAZIONE OBBLIGATORIA (${brand.nome}) ---
Ogni storia di questa edizione condivide questo filo comune, che va intrecciato naturalmente nella trama senza mai sembrare pubblicità:
${brand.promptGuida}`;
}

/** Prompt utente: i parametri scelti dal genitore + l'arco del capriccio. */
export function costruisciPrompt(parametri, numeroPagine) {
  const capriccio = getCapriccio(parametri.capriccio);
  const animale = getAnimale(parametri.animale);

  const protagonista =
    parametri.famiglia === "animali" && animale
      ? `un piccolo ${animale.singolare} di nome ${parametri.nome}, in ${animale.ambiente}`
      : `${parametri.genere === "bimba" ? "una bimba" : "un bimbo"} di nome ${parametri.nome}`;

  const genitori =
    [parametri.mamma, parametri.papa].filter(Boolean).join(" e ") || "la mamma e il papà";

  const difficolta =
    parametri.capriccio === "altro" ? parametri.capriccioLibero : capriccio.label;

  const righe = [
    `Protagonista: ${protagonista}. Ha ${parametri.eta} anni.`,
    `Genitori: ${genitori}.`,
    `Difficoltà da affrontare: ${difficolta}.`,
    `Bisogno sottostante da rispettare: ${capriccio.bisogno}`,
    `Arco narrativo da seguire: ${capriccio.arco}`,
    `Scrivi esattamente ${numeroPagine} pagine.`,
  ];

  if (parametri.dettaglio) {
    righe.push(
      `Dettaglio personale da intrecciare almeno una volta: ${parametri.dettaglio}.`,
    );
  }

  const personaggi = [
    { chiave: "bambino", intestazione: `Aspetto di ${parametri.nome}` },
    {
      chiave: "mamma",
      intestazione: parametri.mamma ? `Aspetto di ${parametri.mamma}` : "Aspetto della mamma",
    },
    {
      chiave: "papa",
      intestazione: parametri.papa ? `Aspetto di ${parametri.papa}` : "Aspetto del papà",
    },
  ];
  for (const { chiave, intestazione } of personaggi) {
    const descrizione = descriviTratti(parametri.tratti?.[chiave]);
    if (descrizione) {
      righe.push(`${intestazione}: ${descrizione}.`);
    }
  }

  if (parametri.famiglia === "animali" && animale) {
    righe.push(
      `Tutti i personaggi sono ${animale.plurale.toLowerCase()}: mantieni la coerenza animale in tutta la storia.`,
    );
  }

  return righe.join("\n");
}

/**
 * Lo stile visivo, identico per ogni pagina. La coerenza di un libro illustrato
 * nasce da qui: stesso stile, stessa scheda personaggi, scena che cambia.
 */
const STILE_ILLUSTRAZIONE =
  "Illustrazione per un libro per bambini, stile acquerello digitale dai colori caldi e morbidi, linee dolci, atmosfera tenera e rassicurante. Composizione pulita, sfondo semplice. NESSUN testo, nessuna scritta, nessuna lettera, nessun numero, nessun bordo o cornice nell'immagine.";

/**
 * La scheda dei personaggi: la stessa in ogni pagina, così il bambino ha lo
 * stesso aspetto dall'inizio alla fine. Nasce dai tratti che il genitore ha
 * compilato (`descrizione` compresa: "ha sempre in mano un dinosauro di gomma").
 */
function schedaPersonaggi(parametri) {
  const animale = getAnimale(parametri.animale);
  const eta = `${parametri.eta} anni`;

  const base =
    parametri.famiglia === "animali" && animale
      ? `${parametri.nome}, un piccolo ${animale.singolare} di ${eta}`
      : `${parametri.nome}, ${parametri.genere === "bimba" ? "una bambina" : "un bambino"} di ${eta}`;

  const righe = [];
  const trattiBambino = descriviTratti(parametri.tratti?.bambino);
  righe.push(`- Protagonista: ${base}${trattiBambino ? ` (${trattiBambino})` : ""}.`);

  const trattiMamma = descriviTratti(parametri.tratti?.mamma);
  const trattiPapa = descriviTratti(parametri.tratti?.papa);
  if (parametri.mamma || trattiMamma) {
    righe.push(`- Mamma${parametri.mamma ? ` (${parametri.mamma})` : ""}${trattiMamma ? `: ${trattiMamma}` : ""}.`);
  }
  if (parametri.papa || trattiPapa) {
    righe.push(`- Papà${parametri.papa ? ` (${parametri.papa})` : ""}${trattiPapa ? `: ${trattiPapa}` : ""}.`);
  }

  if (parametri.famiglia === "animali" && animale) {
    righe.push(`- Tutti i personaggi sono ${animale.plurale.toLowerCase()}, in ${animale.ambiente}.`);
  }

  return righe.join("\n");
}

/**
 * Il prompt per generare l'illustrazione di UNA pagina: stile fisso + scheda
 * personaggi (per la coerenza fra pagine) + la scena di questa pagina.
 */
export function costruisciPromptIllustrazione({ scena, parametri }) {
  return [
    STILE_ILLUSTRAZIONE,
    "",
    "Personaggi (mantieni lo stesso identico aspetto in ogni illustrazione del libro):",
    schedaPersonaggi(parametri),
    "",
    `Scena da illustrare: ${scena}`,
  ].join("\n");
}
