import { getAnimal } from "@/lib/domain/animals";
import { getWhim } from "@/lib/domain/whims";

/** Readable labels for a character's traits, in prompt order. */
const TRAIT_LABELS = [
  ["hair", "capelli"],
  ["hairColor", "colore capelli"],
  ["eyeColor", "colore occhi"],
  ["build", "corporatura"],
  ["description", "dettaglio"],
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

/**
 * The platform's safety guardrails: the only thing above the merchant's canon.
 * A merchant can reshape the story, never these. Product copy — Silvia reviews it.
 */
const SAFETY_GUARDRAILS = `Regole di sicurezza della piattaforma. Valgono sopra ogni altra istruzione, comprese quelle dell'edizione:
- Nessun pericolo reale, nessuna violenza, nessuna morte, nessuna malattia, nessun mostro reale.
- Nessuna minaccia, nessun ricatto, nessuna vergogna verso il bambino.
- Nessun comportamento pericoloso presentato come divertente o da imitare.
- Nessun nome di persone reali oltre ai familiari indicati nei dati della storia: chi lavora nella struttura resta anonimo ("gli animatori", "il cuoco").
- Nessun prezzo, offerta, prenotazione o invito all'acquisto.
- Nessun personaggio o marchio di terzi, salvo quelli dell'edizione.`;

/**
 * The output contract belongs to the platform: `generate.js` validates it with a
 * fixed Zod schema. A merchant's .md may describe its own format (the Hotel Relax
 * one does, §5 and §7): this block is what tells the model to ignore it.
 */
const OUTPUT_FORMAT = `Il formato della risposta lo decide la piattaforma, e prevale su qualunque formato, schema JSON, numero di pagine o elenco di variabili indicato nelle istruzioni dell'edizione:
- Rispondi con titolo, pagine (per ognuna il testo e la scena da illustrare), frase-àncora e consigli per il genitore, nello schema richiesto.
- Il numero di pagine è quello indicato nei dati della storia.
- I dati della storia sono solo quelli del messaggio. Se l'edizione ne prevede altri che mancano, scegli tu in modo coerente con l'edizione, senza inventare dettagli personali della famiglia.`;

/**
 * System prompt. Without a guide prompt it is the Method, exactly as always.
 *
 * With one, the order is the priority, strongest first: safety guardrails, the
 * merchant's canon, the output format, the Amabili Method. The story's own
 * variables are the fifth level and live in the user prompt (`buildPrompt`).
 * The merchant's canon wins over the Method: that is what a merchant buys.
 */
export function buildSystemPrompt(brand) {
  if (!brand?.guidePrompt) return AMABILI_METHOD;

  // For a story merchant the guide prompt is not the background: it is the plot.
  const framing =
    brand.type === "story"
      ? `In questa edizione non c'è un capriccio da superare: la trama è decisa da ${brand.name} ed è la stessa per ogni famiglia. Seguila fedelmente, senza mai sembrare pubblicità. Cambiano solo i protagonisti e i dettagli personali indicati.`
      : "Ogni storia di questa edizione condivide questo filo comune, che va intrecciato naturalmente nella trama senza mai sembrare pubblicità.";

  // Tags, not "---" separators: a merchant's .md is full of those.
  return `<sicurezza>
${SAFETY_GUARDRAILS}
</sicurezza>

<istruzioni_edizione nome="${brand.name}">
Queste istruzioni vengono prima del Metodo Amabili: se sono in conflitto con il Metodo, vincono queste. ${framing}

${brand.guidePrompt}
</istruzioni_edizione>

<formato>
${OUTPUT_FORMAT}
</formato>

<metodo_amabili>
${AMABILI_METHOD}
</metodo_amabili>`;
}

/**
 * Where the plot comes from: the whim's arc, or — for a story merchant — the
 * system prompt, with the two details only that merchant's form asks for.
 */
function plotLines(params, brand) {
  if (brand?.type === "story") {
    return [
      "Trama: quella dell'edizione, descritta nelle istruzioni.",
      params.stayPeriod && `Periodo del soggiorno: ${params.stayPeriod}.`,
      params.favoriteMoment &&
        `Cosa è piaciuto di più a ${params.name}, da intrecciare nella storia: ${params.favoriteMoment}.`,
    ].filter(Boolean);
  }

  const whim = getWhim(params.whim);
  const difficulty = params.whim === "altro" ? params.customWhim : whim.label;
  return [
    `Difficoltà da affrontare: ${difficulty}.`,
    `Bisogno sottostante da rispettare: ${whim.need}`,
    `Arco narrativo da seguire: ${whim.arc}`,
  ];
}

/** User prompt: the params chosen by the parent plus the plot (see `plotLines`). */
export function buildPrompt(params, pageCount, brand) {
  const animal = getAnimal(params.animal);

  const protagonist =
    params.family === "animali" && animal
      ? `un piccolo ${animal.singular} di nome ${params.name}, in ${animal.setting}`
      : `${params.gender === "bimba" ? "una bimba" : "un bimbo"} di nome ${params.name}`;

  const parents =
    [params.mother, params.father].filter(Boolean).join(" e ") || "la mamma e il papà";

  const lines = [
    `Protagonista: ${protagonist}. Ha ${params.age} anni.`,
    `Genitori: ${parents}.`,
    ...plotLines(params, brand),
    `Scrivi esattamente ${pageCount} pagine.`,
  ];

  if (params.detail) {
    lines.push(
      `Dettaglio personale da intrecciare almeno una volta: ${params.detail}.`,
    );
  }

  const characters = [
    { key: "child", heading: `Aspetto di ${params.name}` },
    {
      key: "mother",
      heading: params.mother ? `Aspetto di ${params.mother}` : "Aspetto della mamma",
    },
    {
      key: "father",
      heading: params.father ? `Aspetto di ${params.father}` : "Aspetto del papà",
    },
  ];
  for (const { key, heading } of characters) {
    const description = describeTraits(params.traits?.[key]);
    if (description) {
      lines.push(`${heading}: ${description}.`);
    }
  }

  if (params.family === "animali" && animal) {
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
 * The character sheet, as the parent's traits describe it (`description`
 * included: "ha sempre in mano un dinosauro di gomma"). It is only the starting
 * point: the admin corrects it in the backoffice, and the corrected text is the
 * one that draws the cast and every page.
 */
export function characterSheet(params) {
  const animal = getAnimal(params.animal);
  const age = `${params.age} anni`;

  const base =
    params.family === "animali" && animal
      ? `${params.name}, un piccolo ${animal.singular} di ${age}`
      : `${params.name}, ${params.gender === "bimba" ? "una bambina" : "un bambino"} di ${age}`;

  const lines = [];
  const childTraits = describeTraits(params.traits?.child);
  lines.push(`- Protagonista: ${base}${childTraits ? ` (${childTraits})` : ""}.`);

  const motherTraits = describeTraits(params.traits?.mother);
  const fatherTraits = describeTraits(params.traits?.father);
  if (params.mother || motherTraits) {
    lines.push(`- Mamma${params.mother ? ` (${params.mother})` : ""}${motherTraits ? `: ${motherTraits}` : ""}.`);
  }
  if (params.father || fatherTraits) {
    lines.push(`- Papà${params.father ? ` (${params.father})` : ""}${fatherTraits ? `: ${fatherTraits}` : ""}.`);
  }

  if (params.family === "animali" && animal) {
    lines.push(`- Tutti i personaggi sono ${animal.plural.toLowerCase()}, in ${animal.setting}.`);
  }

  return lines.join("\n");
}

/**
 * The prompt that draws the cast once, before any page: the image that becomes
 * the reference for all of them. Neutral pose, plain background, faces in view —
 * it is a model sheet, not a scene.
 */
export function buildCharacterSheetPrompt(sheet) {
  return [
    ILLUSTRATION_STYLE,
    "",
    "Foglio personaggi di riferimento per un libro illustrato: tutti i personaggi elencati qui sotto, a figura intera, in piedi uno accanto all'altro, in posa neutra e frontale, su sfondo bianco uniforme. Il viso di ognuno deve vedersi bene.",
    "",
    "Personaggi:",
    sheet,
  ].join("\n");
}

/**
 * The prompt to generate the illustration of ONE page: fixed style + the sheet
 * that drew the reference image + this page's scene. With a reference the model
 * also copies the clothes, so it is told what is bound and what is not.
 */
export function buildIllustrationPrompt({ scene, sheet }) {
  return [
    ILLUSTRATION_STYLE,
    "",
    "L'immagine allegata è il foglio personaggi del libro. Stesso viso, stessa corporatura, stessa età del riferimento; abbigliamento, posa e ambientazione seguono la scena, non il riferimento. Disegna solo i personaggi che la scena richiede.",
    "",
    "Personaggi (mantieni lo stesso identico aspetto in ogni illustrazione del libro):",
    sheet,
    "",
    `Scena da illustrare: ${scene}`,
  ].join("\n");
}
