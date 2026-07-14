import { describe, expect, it } from "vitest";

import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { mailStoriaInLavorazione, mailStoriaPronta } from "@/lib/mail/modelli";

const HOTEL = {
  ...BRAND_DEFAULT,
  slug: "famiglia_serena",
  nome: "Hotel Famiglia Serena",
  tema: { accento: "#2e8b8b", accentoSoft: "#7fc9c0", scuro: "#1f3a3a" },
};

describe("mail in lavorazione", () => {
  it("parla del bambino per nome", () => {
    const { oggetto, html } = mailStoriaInLavorazione({
      nome: "Futura",
      brand: BRAND_DEFAULT,
    });

    expect(oggetto).toContain("Futura");
    expect(html).toContain("Futura");
  });

  it("veste i colori dell'ente, non quelli di Amabili", () => {
    const { html } = mailStoriaInLavorazione({ nome: "Futura", brand: HOTEL });

    expect(html).toContain("#2e8b8b");
    expect(html).toContain("Hotel Famiglia Serena");
    expect(html).not.toContain("#e96d4f");
  });
});

describe("mail pronta", () => {
  it("contiene il link al libro", () => {
    const { html } = mailStoriaPronta({
      nome: "Futura",
      brand: BRAND_DEFAULT,
      url: "https://amabilistorie.com/storie/abc",
    });

    expect(html).toContain("https://amabilistorie.com/storie/abc");
  });
});
