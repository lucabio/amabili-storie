import { describe, expect, it } from "vitest";

import { formatPrice, PRICE_LIST, orderSchema } from "@/lib/orders/schema";

const PARAMS = {
  capriccio: "sonno",
  famiglia: "umani",
  nome: "Futura",
  genere: "bimba",
  eta: 4,
};

describe("order", () => {
  it("the price is decided by the price list, not by the client", () => {
    const order = orderSchema.parse({
      email: "genitore@example.com",
      format: "rilegato",
      params: PARAMS,
      // A malicious client tries to pay one euro.
      priceCents: 100,
    });

    expect(order.priceCents).toBe(PRICE_LIST.rilegato.priceCents);
  });

  it("accepts the three formats of the price list", () => {
    for (const format of ["ebook", "brossura", "rilegato"]) {
      const order = orderSchema.parse({
        email: "genitore@example.com",
        format,
        params: PARAMS,
      });

      expect(order.priceCents).toBe(PRICE_LIST[format].priceCents);
    }
  });

  it("rejects a format that does not exist", () => {
    expect(() =>
      orderSchema.parse({
        email: "genitore@example.com",
        format: "papiro",
        params: PARAMS,
      }),
    ).toThrow();
  });
});

describe("formatPrice", () => {
  it("always shows two decimals, even when they end in zero", () => {
    expect(formatPrice(990)).toBe("9,90 €");
    // I casi che troncherebbero, se troncassimo: mai "9,9 €", mai "10 €".
    expect(formatPrice(1000)).toBe("10,00 €");
    expect(formatPrice(0)).toBe("0,00 €");
  });

  it("holds up below one euro too", () => {
    expect(formatPrice(5)).toBe("0,05 €");
  });

  it("uses the Italian decimal comma", () => {
    expect(formatPrice(2490)).toBe("24,90 €");
    expect(formatPrice(3490)).toBe("34,90 €");
  });
});
