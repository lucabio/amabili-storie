import { describe, expect, it } from "vitest";

import { LISTINO, ordineSchema } from "@/lib/ordini/schema";

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
      formato: "cartaceo",
      parametri: PARAMETRI,
      // Un client malizioso prova a pagare un euro.
      prezzoCents: 100,
    });

    expect(ordine.prezzoCents).toBe(LISTINO.cartaceo);
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
