import { getAnimal } from "@/lib/domain/animals";
import { getWhim } from "@/lib/domain/whims";

/** Readable labels for a character's traits, in prompt order. */
const TRAIT_LABELS = [
  ["capelli", "capelli"],
  ["coloreCapelli", "colore capelli"],
  ["coloreOcchi", "colore occhi"],
  ["corporatura", "corporatura"],
  ["descrizione", "dettaglio"],
];

/**
 * Sums up the filled-in traits of a character in one sentence, ignoring empty
 * fields. A list of empty fields ("capelli: , occhi: ") confuses the model, so
 * if nothing is filled in it produces no line at all.
 */
function describeTraits(traits) {
  if (!traits) return "";
  return TRAIT_LABELS.map(([field, label]) => traits[field] && `${label}: ${traits[field]}`)
    .filter(Boolean)
    .join(", ");
}

/**
 * The Amabili Method is the promise of the product ("not a gift, a tool"):
 * these constraints are not stylistic, they are the reason a family pays.
 * Touching them changes the product — talk to Silvia first.
 */
const AMABILI_METHOD = `Sei l'autore di Amabili Storie: libri illustrati personalizzati che aiutano un bambino a superare una difficoltà concreta ("un capriccio").

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

/** System prompt: the method plus the merchant's common thread, if any. */
export function buildSystemPrompt(brand) {
  if (!brand?.guidePrompt) return AMABILI_METHOD;

  return `${AMABILI_METHOD}

--- AMBIENTAZIONE OBBLIGATORIA (${brand.name}) ---
Ogni storia di questa edizione condivide questo filo comune, che va intrecciato naturalmente nella trama senza mai sembrare pubblicità:
${brand.guidePrompt}`;
}

/** User prompt: the params chosen by the parent plus the whim's arc. */
export function buildPrompt(params, pageCount) {
  const whim = getWhim(params.capriccio);
  const animal = getAnimal(params.animale);

  const protagonist =
    params.famiglia === "animali" && animal
      ? `un piccolo ${animal.singular} di nome ${params.nome}, in ${animal.setting}`
      : `${params.genere === "bimba" ? "una bimba" : "un bimbo"} di nome ${params.nome}`;

  const parents =
    [params.mamma, params.papa].filter(Boolean).join(" e ") || "la mamma e il papà";

  const difficulty =
    params.capriccio === "altro" ? params.capriccioLibero : whim.label;

  const lines = [
    `Protagonista: ${protagonist}. Ha ${params.eta} anni.`,
    `Genitori: ${parents}.`,
    `Difficoltà da affrontare: ${difficulty}.`,
    `Bisogno sottostante da rispettare: ${whim.need}`,
    `Arco narrativo da seguire: ${whim.arc}`,
    `Scrivi esattamente ${pageCount} pagine.`,
  ];

  if (params.dettaglio) {
    lines.push(
      `Dettaglio personale da intrecciare almeno una volta: ${params.dettaglio}.`,
    );
  }

  const characters = [
    { key: "bambino", heading: `Aspetto di ${params.nome}` },
    {
      key: "mamma",
      heading: params.mamma ? `Aspetto di ${params.mamma}` : "Aspetto della mamma",
    },
    {
      key: "papa",
      heading: params.papa ? `Aspetto di ${params.papa}` : "Aspetto del papà",
    },
  ];
  for (const { key, heading } of characters) {
    const description = describeTraits(params.tratti?.[key]);
    if (description) {
      lines.push(`${heading}: ${description}.`);
    }
  }

  if (params.famiglia === "animali" && animal) {
    lines.push(
      `Tutti i personaggi sono ${animal.plural.toLowerCase()}: mantieni la coerenza animale in tutta la storia.`,
    );
  }

  return lines.join("\n");
}

/**
 * The visual style, identical on every page. The coherence of a picture book
 * starts here: same style, same character sheet, only the scene changes.
 */
const ILLUSTRATION_STYLE =
  "Illustrazione per un libro per bambini, stile acquerello digitale dai colori caldi e morbidi, linee dolci, atmosfera tenera e rassicurante. Composizione pulita, sfondo semplice. NESSUN testo, nessuna scritta, nessuna lettera, nessun numero, nessun bordo o cornice nell'immagine.";

/**
 * The character sheet: the same on every page, so the child looks the same from
 * beginning to end. It is built from the traits the parent filled in
 * (`descrizione` included: "ha sempre in mano un dinosauro di gomma").
 */
function characterSheet(params) {
  const animal = getAnimal(params.animale);
  const age = `${params.eta} anni`;

  const base =
    params.famiglia === "animali" && animal
      ? `${params.nome}, un piccolo ${animal.singular} di ${age}`
      : `${params.nome}, ${params.genere === "bimba" ? "una bambina" : "un bambino"} di ${age}`;

  const lines = [];
  const childTraits = describeTraits(params.tratti?.bambino);
  lines.push(`- Protagonista: ${base}${childTraits ? ` (${childTraits})` : ""}.`);

  const motherTraits = describeTraits(params.tratti?.mamma);
  const fatherTraits = describeTraits(params.tratti?.papa);
  if (params.mamma || motherTraits) {
    lines.push(`- Mamma${params.mamma ? ` (${params.mamma})` : ""}${motherTraits ? `: ${motherTraits}` : ""}.`);
  }
  if (params.papa || fatherTraits) {
    lines.push(`- Papà${params.papa ? ` (${params.papa})` : ""}${fatherTraits ? `: ${fatherTraits}` : ""}.`);
  }

  if (params.famiglia === "animali" && animal) {
    lines.push(`- Tutti i personaggi sono ${animal.plural.toLowerCase()}, in ${animal.setting}.`);
  }

  return lines.join("\n");
}

/**
 * The prompt to generate the illustration of ONE page: fixed style + character
 * sheet (for coherence between pages) + this page's scene.
 */
export function buildIllustrationPrompt({ scene, params }) {
  return [
    ILLUSTRATION_STYLE,
    "",
    "Personaggi (mantieni lo stesso identico aspetto in ogni illustrazione del libro):",
    characterSheet(params),
    "",
    `Scena da illustrare: ${scene}`,
  ].join("\n");
}
