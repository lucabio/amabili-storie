import { describe, expect, it } from "vitest";

import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { generateBookPdf } from "@/lib/story/pdf";
import { storyContentSchema } from "@/lib/story/schema";

// A page shaped like the migrated rows: English keys, Italian text, and an
// explicit layout so pdf.jsx has to read image/text/style, not immagine/testo/stile.
const CONTENT = {
  title: "Futura e il sasso del cuore",
  pages: [
    { text: "C'era una volta una bimba di nome Futura.", illustration: "Una bimba in montagna." },
    {
      text: "Il buio non spegne l'amore.",
      illustration: "Futura stringe il sasso.",
      layout: {
        image: { x: 0, y: 0, w: 1, h: 0.6 },
        text: { x: 0.1, y: 0.7, w: 0.8, h: 0.2 },
        style: { font: "fraunces", size: 20, color: "#2b211d", align: "left", bold: true, italic: true },
      },
    },
  ],
  anchorPhrase: "Il buio non spegne l'amore.",
  parentGuide: ["Nomina l'emozione.", "Riusa la frase-àncora."],
};

describe("PDF against the migrated schema", () => {
  it("the content validates with the English keys", () => {
    expect(storyContentSchema.parse(CONTENT).pages[1].layout.style.size).toBe(20);
  });

  it("renders a real PDF, honouring the per-page layout", async () => {
    const buffer = await generateBookPdf({ content: CONTENT, brand: BRAND_DEFAULT });
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    // cover + 2 pages + closing
    expect(buffer.toString("latin1").match(/\/Type\s*\/Page[^s]/g)).toHaveLength(4);
  });
});
