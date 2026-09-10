import { describe, expect, it } from "vitest";

import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { storyInProgressMail, storyReadyMail } from "@/lib/mail/templates";

const HOTEL = {
  ...BRAND_DEFAULT,
  slug: "famiglia_serena",
  name: "Hotel Famiglia Serena",
  theme: { accento: "#2e8b8b", accentoSoft: "#7fc9c0", scuro: "#1f3a3a" },
};

describe("story in progress mail", () => {
  it("calls the child by name", () => {
    const { subject, html } = storyInProgressMail({
      name: "Futura",
      brand: BRAND_DEFAULT,
    });

    expect(subject).toContain("Futura");
    expect(html).toContain("Futura");
  });

  it("wears the merchant colors, not Amabili's", () => {
    const { html } = storyInProgressMail({ name: "Futura", brand: HOTEL });

    expect(html).toContain("#2e8b8b");
    expect(html).toContain("Hotel Famiglia Serena");
    expect(html).not.toContain("#e96d4f");
  });
});

describe("story ready mail", () => {
  it("contains the link to the book", () => {
    const { html } = storyReadyMail({
      name: "Futura",
      brand: BRAND_DEFAULT,
      url: "https://amabilistorie.com/stories/abc",
    });

    expect(html).toContain("https://amabilistorie.com/stories/abc");
  });
});

describe("HTML escaping of the name", () => {
  it("does not let markup injected in the name through", () => {
    const name = "Futura<script>alert(1)</script>";
    const { subject, html } = storyInProgressMail({
      name,
      brand: BRAND_DEFAULT,
    });

    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("Futura&lt;script&gt;alert(1)&lt;/script&gt;");

    // The subject is not HTML: it stays raw text, not escaped.
    expect(subject).toContain("Futura");
  });
});
