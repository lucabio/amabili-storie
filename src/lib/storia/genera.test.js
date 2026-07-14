import { beforeEach, describe, expect, it } from "vitest";

import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { AiNonDisponibile, generaStoria, PAGINE_ANTEPRIMA } from "@/lib/storia/genera";

const PARAMETRI = {
  capriccio: "sonno",
  capriccioLibero: "",
  famiglia: "umani",
  animale: null,
  nome: "Futura",
  genere: "bimba",
  eta: 4,
  mamma: "",
  papa: "",
  dettaglio: "",
  brand: "amabili",
};

describe("generaStoria senza AI configurata", () => {
  beforeEach(() => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
  });

  it("l'anteprima gratuita ripiega sui template: è ciò che rende il progetto sviluppabile a mani nude", async () => {
    const { storia, fonte } = await generaStoria({
      parametri: PARAMETRI,
      brand: BRAND_DEFAULT,
      numeroPagine: PAGINE_ANTEPRIMA,
    });

    expect(fonte).toBe("fallback");
    expect(storia.pagine).toHaveLength(PAGINE_ANTEPRIMA);
  });

  it("il libro acquistato invece fallisce: chi ha pagato non può ricevere un template", async () => {
    await expect(
      generaStoria({
        parametri: PARAMETRI,
        brand: BRAND_DEFAULT,
        numeroPagine: 22,
        consentiFallback: false,
      }),
    ).rejects.toThrow(AiNonDisponibile);
  });
});
