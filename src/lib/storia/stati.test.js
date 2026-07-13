import { describe, expect, it } from "vitest";

import { STATI, transizionePermessa } from "@/lib/storia/stati";

describe("transizioni di stato", () => {
  it("dalla generazione si va in revisione o si fallisce", () => {
    expect(transizionePermessa("in_generazione", "in_revisione")).toBe(true);
    expect(transizionePermessa("in_generazione", "fallita")).toBe(true);
  });

  it("non si approva una storia che non è stata rivista", () => {
    expect(transizionePermessa("in_generazione", "approvata")).toBe(false);
  });

  it("dalla revisione si approva o si rifiuta", () => {
    expect(transizionePermessa("in_revisione", "approvata")).toBe(true);
    expect(transizionePermessa("in_revisione", "rifiutata")).toBe(true);
  });

  it("approvata è irreversibile: il libro è già partito", () => {
    for (const stato of STATI) {
      expect(transizionePermessa("approvata", stato)).toBe(false);
    }
  });

  it("da fallita e da rifiutata si può rigenerare", () => {
    expect(transizionePermessa("fallita", "in_generazione")).toBe(true);
    expect(transizionePermessa("rifiutata", "in_generazione")).toBe(true);
  });

  it("uno stato inventato non porta da nessuna parte", () => {
    expect(transizionePermessa("inventato", "approvata")).toBe(false);
  });
});
