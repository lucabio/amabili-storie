import { describe, expect, it } from "vitest";

import { getCapriccio } from "@/lib/domain/capricci";
import { costruisciPrompt } from "@/lib/storia/prompt";
import { parametriStoriaSchema } from "@/lib/storia/schema";

const BASE = {
  capriccio: "sonno",
  famiglia: "umani",
  nome: "Futura",
  genere: "bimba",
  eta: 4,
};

/** Il prompt di oggi, costruito con gli stessi pezzi di dominio usati da costruisciPrompt. */
function promptDiOggi(numeroPagine) {
  const capriccio = getCapriccio("sonno");
  return [
    `Protagonista: una bimba di nome Futura. Ha 4 anni.`,
    `Genitori: la mamma e il papà.`,
    `Difficoltà da affrontare: ${capriccio.label}.`,
    `Bisogno sottostante da rispettare: ${capriccio.bisogno}`,
    `Arco narrativo da seguire: ${capriccio.arco}`,
    `Scrivi esattamente ${numeroPagine} pagine.`,
  ].join("\n");
}

describe("parametriStoriaSchema — tratti", () => {
  it("sono tutti opzionali: non compilarli non rompe la validazione", () => {
    const parametri = parametriStoriaSchema.parse(BASE);

    expect(parametri.tratti).toEqual({
      bambino: { capelli: "", coloreCapelli: "", coloreOcchi: "", corporatura: "", descrizione: "" },
      mamma: { capelli: "", coloreCapelli: "", coloreOcchi: "", corporatura: "", descrizione: "" },
      papa: { capelli: "", coloreCapelli: "", coloreOcchi: "", corporatura: "", descrizione: "" },
    });
  });

  it("i default nidificati si applicano davvero (la trappola di .default() in Zod 4)", () => {
    // Un client che manda un oggetto `tratti` vuoto o parziale deve comunque
    // ricevere le cinque chiavi di ciascun personaggio, non un oggetto a metà.
    const parametri = parametriStoriaSchema.parse({
      ...BASE,
      tratti: { bambino: { capelli: "ricci" } },
    });

    expect(parametri.tratti.bambino).toEqual({
      capelli: "ricci",
      coloreCapelli: "",
      coloreOcchi: "",
      corporatura: "",
      descrizione: "",
    });
    expect(parametri.tratti.mamma).toEqual({
      capelli: "",
      coloreCapelli: "",
      coloreOcchi: "",
      corporatura: "",
      descrizione: "",
    });
  });

  it("accetta la descrizione libera fino a 200 caratteri", () => {
    const descrizione = "a".repeat(200);
    const parametri = parametriStoriaSchema.parse({
      ...BASE,
      tratti: { bambino: { descrizione } },
    });

    expect(parametri.tratti.bambino.descrizione).toBe(descrizione);
  });
});

describe("costruisciPrompt — i tratti", () => {
  it("senza tratti compilati, il prompt è identico a quello di prima dell'introduzione dei tratti", () => {
    const parametri = parametriStoriaSchema.parse(BASE);

    expect(costruisciPrompt(parametri, 3)).toBe(promptDiOggi(3));
  });

  it("un oggetto tratti presente ma con tutti i campi vuoti non cambia il prompt", () => {
    const senzaTratti = parametriStoriaSchema.parse(BASE);
    const conTrattiVuoti = parametriStoriaSchema.parse({
      ...BASE,
      tratti: { bambino: {}, mamma: {}, papa: {} },
    });

    expect(costruisciPrompt(conTrattiVuoti, 3)).toBe(costruisciPrompt(senzaTratti, 3));
  });

  it("un tratto compilato compare nel prompt, con l'etichetta giusta", () => {
    const parametri = parametriStoriaSchema.parse({
      ...BASE,
      tratti: {
        bambino: {
          capelli: "ricci",
          coloreOcchi: "verdi",
          descrizione: "ha sempre in mano un dinosauro di gomma",
        },
      },
    });

    const prompt = costruisciPrompt(parametri, 3);

    expect(prompt).toContain("Aspetto di Futura:");
    expect(prompt).toContain("capelli: ricci");
    expect(prompt).toContain("colore occhi: verdi");
    expect(prompt).toContain("dettaglio: ha sempre in mano un dinosauro di gomma");
  });

  it("i campi vuoti di un personaggio parzialmente compilato non finiscono nel prompt", () => {
    const parametri = parametriStoriaSchema.parse({
      ...BASE,
      tratti: { bambino: { capelli: "lisci" } },
    });

    const prompt = costruisciPrompt(parametri, 3);

    expect(prompt).toContain("Aspetto di Futura: capelli: lisci.");
    expect(prompt).not.toContain("colore capelli:");
    expect(prompt).not.toContain("colore occhi:");
    expect(prompt).not.toContain("corporatura:");
  });

  it("i tratti di mamma e papà usano il nome se compilato, altrimenti il ruolo", () => {
    const conNomi = parametriStoriaSchema.parse({
      ...BASE,
      mamma: "Silvia",
      papa: "Luca",
      tratti: { mamma: { capelli: "corti" }, papa: { capelli: "lunghi" } },
    });
    expect(costruisciPrompt(conNomi, 3)).toContain("Aspetto di Silvia: capelli: corti.");
    expect(costruisciPrompt(conNomi, 3)).toContain("Aspetto di Luca: capelli: lunghi.");

    const senzaNomi = parametriStoriaSchema.parse({
      ...BASE,
      tratti: { mamma: { capelli: "corti" }, papa: { capelli: "lunghi" } },
    });
    expect(costruisciPrompt(senzaNomi, 3)).toContain("Aspetto della mamma: capelli: corti.");
    expect(costruisciPrompt(senzaNomi, 3)).toContain("Aspetto del papà: capelli: lunghi.");
  });
});
