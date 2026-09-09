import { beforeEach, describe, expect, it, vi } from "vitest";

import { sessioneAdmin, utenteAmministratore } from "./sessione";

vi.mock("@/lib/supabase/server", () => ({
  supabaseConfigurato: () => vero.configurato,
  creaClientServer: async () => ({
    auth: { getUser: async () => ({ data: { user: vero.utente } }) },
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: vero.rigaAmministratore }) }),
      }),
    }),
  }),
}));

/** Cosa risponde Supabase in questo test. */
const vero = { configurato: true, utente: null, rigaAmministratore: null };

const SILVIA = { id: "cfce152c", email: "amabilisilvia@hotmail.com" };

beforeEach(() => {
  Object.assign(vero, { configurato: true, utente: null, rigaAmministratore: null });
});

describe("sessioneAdmin", () => {
  it("distingue chi è entrato ma non è amministratore da chi non è entrato", async () => {
    vero.utente = SILVIA;

    // Il bug: questo caso e il prossimo davano lo stesso `null`, e la pagina di
    // login non poteva dire perché non si entrava.
    expect(await sessioneAdmin()).toEqual({ utente: SILVIA, amministratore: false });
    expect(await utenteAmministratore()).toBeNull();
  });

  it("senza sessione non c'è nessun utente", async () => {
    expect(await sessioneAdmin()).toEqual({ utente: null, amministratore: false });
    expect(await utenteAmministratore()).toBeNull();
  });

  it("chi è elencato fra gli amministratori entra", async () => {
    vero.utente = SILVIA;
    vero.rigaAmministratore = { utente_id: SILVIA.id };

    expect(await sessioneAdmin()).toEqual({ utente: SILVIA, amministratore: true });
    expect(await utenteAmministratore()).toBe(SILVIA);
  });

  it("senza Supabase configurato non entra nessuno", async () => {
    vero.configurato = false;
    vero.utente = SILVIA;
    vero.rigaAmministratore = { utente_id: SILVIA.id };

    expect(await sessioneAdmin()).toEqual({ utente: null, amministratore: false });
  });
});
