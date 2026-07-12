import { getAnimale } from "@/lib/domain/animali";
import { componiTitolo, getCapriccio } from "@/lib/domain/capricci";

/**
 * Storie da template, portate dal repo demo. Servono a due cose:
 * far girare il progetto senza chiavi AI, e dare una rete di sicurezza se il
 * Gateway è giù — meglio una storia scritta a mano che una pagina di errore.
 */
function testiDemo({ nome, genitori, primoGenitore, apertura }) {
  return {
    sonno: [
      apertura,
      `Di giorno ${nome} rideva e giocava. Ma la sera, quando le luci si spegnevano, la cameretta sembrava grande grande… e ${nome} si sentiva piccino piccino. «È normale sentirsi così» sussurrò ${primoGenitore}, con un abbraccio morbido.`,
      `Così accesero insieme un cielo di stelle proprio sul soffitto. «Vedi ${nome}? Anche quando non siamo nella stessa stanza, il nostro amore brilla come queste stelle.» E quella notte, sotto il suo cielo personale, ${nome} si addormentò con il sorriso.`,
    ],
    pannolino: [
      apertura,
      `Un giorno ${nome} guardò il vasino e pensò: «Quello è per i grandi…». La pancia faceva il solletico: era l'avviso segreto del corpo! La prima volta qualcosa andò storto, ma ${genitori} risero dolcemente: «Capita a tutti, si cambia e via!».`,
      `E poi, un mattino… ce l'ha fatta! «Il mio corpo mi avvisa, e io lo ascolto!» disse ${nome} con le mani sui fianchi, come un supereroe. Da quel giorno il pannolino salutò e partì per una lunga vacanza.`,
    ],
    gelosia: [
      apertura,
      `Poi arrivò un fagottino nuovo, piccolo e rumoroso. ${nome} sentiva un groviglio nella pancia: un po' amore, un po' rabbia. «Puoi dirlo, sai?» disse ${primoGenitore}. «Anche i grandi a volte si sentono così.»`,
      `Ma una sera il fagottino piangeva… e solo la ninna nanna di ${nome} riuscì a farlo sorridere! «Questo lo so fare solo io» pensò ${nome}. E capì che il posto nel cuore di ${genitori} non si divide: si allarga.`,
    ],
    buio: [
      apertura,
      `Quando calava il buio, l'armadio sembrava un gigante e la sedia un drago. ${nome} strinse la sua lampada delle meraviglie e — click! — il gigante tornò armadio, il drago tornò sedia. Erano sempre loro, i suoi amici di giorno!`,
      `Notte dopo notte, ${nome} scoprì che il buio è il momento delle cose speciali: le stelle, i sogni, le storie sussurrate. «Il buio non porta via niente» disse ${nome}. «Nasconde solo le sorprese di domani.»`,
    ],
    cibo: [
      apertura,
      `Nel piatto c'era una cosa nuova e misteriosa. ${nome} la annusò come un esploratore, la toccò con la forchetta, la guardò da vicino vicino. «Un morso da esploratore?» propose ${primoGenitore}. «Poi puoi decidere tu.»`,
      `${nome} chiuse gli occhi e… crunch! «Mmm. Non è il mio preferito» disse ${nome}, «ma l'ho assaggiato!» E ${genitori} applaudirono forte: perché i veri esploratori non devono amare tutto — devono solo avere il coraggio di provare.`,
    ],
    nido: [
      apertura,
      `Domani era un giorno speciale: il primo giorno di nido! ${primoGenitore} mise un bacio invisibile nel taschino di ${nome}: «Se ti manco, stringilo forte. E ricorda: io torno sempre.»`,
      `Il saluto fu un po' difficile, ma va bene così. Poi ${nome} scoprì i colori, la sabbia, un nuovo amico… e quando la porta si aprì, ${primoGenitore} era lì, come promesso. «Lo sapevo che tornavi!» rispose ${nome}.`,
    ],
    bagnetto: [
      apertura,
      `La vasca faceva un rumore strano e l'acqua saliva, saliva. ${nome} non voleva entrare, e nessuno lo obbligò. «Ci pensi tu al comando» disse ${primoGenitore}, e mise in mano a ${nome} la paletta del capitano.`,
      `Un dito, un piede, un ginocchio: ${nome} entrò nella nave-vasca alle sue condizioni. «Rotta verso la schiuma!» gridò. E il rumore dello scarico, adesso, era solo il mare che salutava.`,
    ],
    vacanza: [
      apertura,
      `Il letto della vacanza era diverso: profumo strano, ombre nuove, nessun rumore conosciuto. ${nome} non riusciva a chiudere gli occhi. «Ci portiamo un pezzo di casa» propose ${primoGenitore}, e tirò fuori il libro della nanna di sempre.`,
      `Stessa storia, stessa voce, stessa coccola: e la stanza sconosciuta diventò un po' casa. «La nanna ce l'ho dentro» scoprì ${nome}. «Viene con me dappertutto.»`,
    ],
  };
}

/** Chiusura generica per il capriccio "altro" (descritto liberamente dal genitore). */
function testiAltro({ nome, genitori, primoGenitore, apertura }) {
  return [
    apertura,
    `Un giorno arrivò una grande sfida per ${nome}. All'inizio sembrava troppo difficile, e ${nome} sentiva un nodo nella pancia. «È normale sentirsi così» disse ${primoGenitore}, con un abbraccio morbido. «Le grandi imprese fanno un po' paura a tutti.»`,
    `Passo dopo passo, con ${genitori} accanto, ${nome} ci provò… e ce la fece! «Ce l'ho fatta davvero!» esclamò con un sorriso enorme. Da quel giorno, ogni volta che arrivava una sfida nuova, ${nome} ricordava: le grandi imprese si fanno un passo alla volta.`,
  ];
}

export function storiaFallback(parametri, numeroPagine) {
  const capriccio = getCapriccio(parametri.capriccio);
  const animale = getAnimale(parametri.animale);
  const nome = parametri.nome;

  const chi =
    parametri.famiglia === "animali" && animale
      ? `un piccolo ${animale.singolare} di nome ${nome}`
      : parametri.genere === "bimba"
        ? `una bimba di nome ${nome}`
        : `un bimbo di nome ${nome}`;

  const genitori =
    [parametri.mamma, parametri.papa].filter(Boolean).join(" e ") || "la mamma e il papà";
  const primoGenitore = genitori.split(" e ")[0];
  const extra = parametri.dettaglio ? ` A ${nome} piaceva tantissimo ${parametri.dettaglio}.` : "";
  const apertura = `C'era una volta, in una casetta piena di allegria, ${chi}, con due genitori fantastici: ${genitori}.${extra}`;

  const contesto = { nome, genitori, primoGenitore, apertura };
  const testi = testiDemo(contesto)[parametri.capriccio] ?? testiAltro(contesto);

  // I template coprono 3 pagine (l'anteprima). Se ne servono di più, l'ultima
  // resta l'ultima e le pagine mancanti non vengono inventate: le tronchiamo.
  const pagine = testi.slice(0, numeroPagine).map((testo) => ({
    testo,
    illustrazione: `Scena della storia di ${nome}, stile illustrazione per l'infanzia.`,
  }));

  return {
    titolo: componiTitolo(capriccio, nome),
    pagine,
    fraseAncora: "È normale sentirsi così. Ci sono qui io.",
    guidaGenitori: [
      "Rileggete la storia sempre alla stessa ora: la ripetizione crea sicurezza.",
      "Riusate la frase-àncora nella vita reale, con le stesse parole del libro.",
      "Lodate il tentativo, non il risultato.",
    ],
  };
}
