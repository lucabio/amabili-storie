import { describe, expect, it } from "vitest";

import { formattaPrezzo, LISTINO, ordineSchema } from "@/lib/ordini/schema";

const PARAMETRI = {
  capriccio: "sonno",
  famiglia: "umani",
  nome: "Futura",
  genere: "bimba",
  eta: 4,
};

describe("ordine", () => {
  it("il prezzo lo decide il listino, non il client", () => {
    const ordine = ordineSchema.parse({
      email: "genitore@example.com",
      formato: "rilegato",
      parametri: PARAMETRI,
      // Un client malizioso prova a pagare un euro.
      prezzoCents: 100,
    });

    expect(ordine.prezzoCents).toBe(LISTINO.rilegato.prezzoCents);
  });

  it("accetta i tre formati del listino", () => {
    for (const formato of ["ebook", "brossura", "rilegato"]) {
      const ordine = ordineSchema.parse({
        email: "genitore@example.com",
        formato,
        parametri: PARAMETRI,
      });

      expect(ordine.prezzoCents).toBe(LISTINO[formato].prezzoCents);
    }
  });

  it("rifiuta un formato che non esiste", () => {
    expect(() =>
      ordineSchema.parse({
        email: "genitore@example.com",
        formato: "papiro",
        parametri: PARAMETRI,
      }),
    ).toThrow();
  });
});

describe("formattaPrezzo", () => {
  it("mostra sempre due cifre decimali, anche quando finiscono per zero", () => {
    expect(formattaPrezzo(990)).toBe("9,90 €");
    // I casi che troncherebbero, se troncassimo: mai "9,9 €", mai "10 €".
    expect(formattaPrezzo(1000)).toBe("10,00 €");
    expect(formattaPrezzo(0)).toBe("0,00 €");
  });

  it("regge anche sotto l'euro", () => {
    expect(formattaPrezzo(5)).toBe("0,05 €");
  });

  it("usa la virgola all'italiana", () => {
    expect(formattaPrezzo(2490)).toBe("24,90 €");
    expect(formattaPrezzo(3490)).toBe("34,90 €");
  });
});
