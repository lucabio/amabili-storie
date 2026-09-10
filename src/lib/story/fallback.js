import { getAnimal } from "@/lib/domain/animals";
import { composeTitle, getWhim } from "@/lib/domain/whims";

/**
 * Template stories, carried over from the demo repo. They serve two purposes:
 * running the project without AI keys, and being a safety net if the Gateway is
 * down — better a hand-written story than an error page.
 */
function demoTexts({ name, parents, firstParent, opening }) {
  return {
    sonno: [
      opening,
      `Di giorno ${name} rideva e giocava. Ma la sera, quando le luci si spegnevano, la cameretta sembrava grande grande… e ${name} si sentiva piccino piccino. «È normale sentirsi così» sussurrò ${firstParent}, con un abbraccio morbido.`,
      `Così accesero insieme un cielo di stelle proprio sul soffitto. «Vedi ${name}? Anche quando non siamo nella stessa stanza, il nostro amore brilla come queste stelle.» E quella notte, sotto il suo cielo personale, ${name} si addormentò con il sorriso.`,
    ],
    pannolino: [
      opening,
      `Un giorno ${name} guardò il vasino e pensò: «Quello è per i grandi…». La pancia faceva il solletico: era l'avviso segreto del corpo! La prima volta qualcosa andò storto, ma ${parents} risero dolcemente: «Capita a tutti, si cambia e via!».`,
      `E poi, un mattino… ce l'ha fatta! «Il mio corpo mi avvisa, e io lo ascolto!» disse ${name} con le mani sui fianchi, come un supereroe. Da quel giorno il pannolino salutò e partì per una lunga vacanza.`,
    ],
    gelosia: [
      opening,
      `Poi arrivò un fagottino nuovo, piccolo e rumoroso. ${name} sentiva un groviglio nella pancia: un po' amore, un po' rabbia. «Puoi dirlo, sai?» disse ${firstParent}. «Anche i grandi a volte si sentono così.»`,
      `Ma una sera il fagottino piangeva… e solo la ninna nanna di ${name} riuscì a farlo sorridere! «Questo lo so fare solo io» pensò ${name}. E capì che il posto nel cuore di ${parents} non si divide: si allarga.`,
    ],
    buio: [
      opening,
      `Quando calava il buio, l'armadio sembrava un gigante e la sedia un drago. ${name} strinse la sua lampada delle meraviglie e — click! — il gigante tornò armadio, il drago tornò sedia. Erano sempre loro, i suoi amici di giorno!`,
      `Notte dopo notte, ${name} scoprì che il buio è il momento delle cose speciali: le stelle, i sogni, le storie sussurrate. «Il buio non porta via niente» disse ${name}. «Nasconde solo le sorprese di domani.»`,
    ],
    cibo: [
      opening,
      `Nel piatto c'era una cosa nuova e misteriosa. ${name} la annusò come un esploratore, la toccò con la forchetta, la guardò da vicino vicino. «Un morso da esploratore?» propose ${firstParent}. «Poi puoi decidere tu.»`,
      `${name} chiuse gli occhi e… crunch! «Mmm. Non è il mio preferito» disse ${name}, «ma l'ho assaggiato!» E ${parents} applaudirono forte: perché i veri esploratori non devono amare tutto — devono solo avere il coraggio di provare.`,
    ],
    nido: [
      opening,
      `Domani era un giorno speciale: il primo giorno di nido! ${firstParent} mise un bacio invisibile nel taschino di ${name}: «Se ti manco, stringilo forte. E ricorda: io torno sempre.»`,
      `Il saluto fu un po' difficile, ma va bene così. Poi ${name} scoprì i colori, la sabbia, un nuovo amico… e quando la porta si aprì, ${firstParent} era lì, come promesso. «Lo sapevo che tornavi!» rispose ${name}.`,
    ],
    bagnetto: [
      opening,
      `La vasca faceva un rumore strano e l'acqua saliva, saliva. ${name} non voleva entrare, e nessuno lo obbligò. «Ci pensi tu al comando» disse ${firstParent}, e mise in mano a ${name} la paletta del capitano.`,
      `Un dito, un piede, un ginocchio: ${name} entrò nella nave-vasca alle sue condizioni. «Rotta verso la schiuma!» gridò. E il rumore dello scarico, adesso, era solo il mare che salutava.`,
    ],
    vacanza: [
      opening,
      `Il letto della vacanza era diverso: profumo strano, ombre nuove, nessun rumore conosciuto. ${name} non riusciva a chiudere gli occhi. «Ci portiamo un pezzo di casa» propose ${firstParent}, e tirò fuori il libro della nanna di sempre.`,
      `Stessa storia, stessa voce, stessa coccola: e la stanza sconosciuta diventò un po' casa. «La nanna ce l'ho dentro» scoprì ${name}. «Viene con me dappertutto.»`,
    ],
  };
}

/** Generic ending for the "altro" whim (described freely by the parent). */
function otherTexts({ name, parents, firstParent, opening }) {
  return [
    opening,
    `Un giorno arrivò una grande sfida per ${name}. All'inizio sembrava troppo difficile, e ${name} sentiva un nodo nella pancia. «È normale sentirsi così» disse ${firstParent}, con un abbraccio morbido. «Le grandi imprese fanno un po' paura a tutti.»`,
    `Passo dopo passo, con ${parents} accanto, ${name} ci provò… e ce la fece! «Ce l'ho fatta davvero!» esclamò con un sorriso enorme. Da quel giorno, ogni volta che arrivava una sfida nuova, ${name} ricordava: le grandi imprese si fanno un passo alla volta.`,
  ];
}

export function fallbackStory(params, pageCount) {
  const whim = getWhim(params.whim);
  const animal = getAnimal(params.animal);
  const name = params.name;

  const who =
    params.family === "animali" && animal
      ? `un piccolo ${animal.singular} di nome ${name}`
      : params.gender === "bimba"
        ? `una bimba di nome ${name}`
        : `un bimbo di nome ${name}`;

  const parents =
    [params.mother, params.father].filter(Boolean).join(" e ") || "la mamma e il papà";
  const firstParent = parents.split(" e ")[0];
  const extra = params.detail ? ` A ${name} piaceva tantissimo ${params.detail}.` : "";
  const opening = `C'era una volta, in una casetta piena di allegria, ${who}, con due genitori fantastici: ${parents}.${extra}`;

  const context = { name, parents, firstParent, opening };
  const texts = demoTexts(context)[params.whim] ?? otherTexts(context);

  // The templates cover 3 pages (the preview). If more are needed, the last one
  // stays the last one and the missing pages are not invented: we truncate.
  const pages = texts.slice(0, pageCount).map((text) => ({
    text,
    illustration: `Scena della storia di ${name}, stile illustrazione per l'infanzia.`,
  }));

  return {
    title: composeTitle(whim, name),
    pages,
    anchorPhrase: "È normale sentirsi così. Ci sono qui io.",
    parentGuide: [
      "Rileggete la storia sempre alla stessa ora: la ripetizione crea sicurezza.",
      "Riusate la frase-àncora nella vita reale, con le stesse parole del libro.",
      "Lodate il tentativo, non il risultato.",
    ],
  };
}
