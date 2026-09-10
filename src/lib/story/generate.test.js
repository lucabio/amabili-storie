import { beforeEach, describe, expect, it } from "vitest";

import { BRAND_DEFAULT } from "@/lib/brand/schema";
import { AiUnavailable, generateStory, PREVIEW_PAGES } from "@/lib/story/generate";

const PARAMS = {
  whim: "sonno",
  customWhim: "",
  family: "umani",
  animal: null,
  name: "Futura",
  gender: "bimba",
  age: 4,
  mother: "",
  father: "",
  detail: "",
  brand: "amabili",
};

describe("generateStory without AI configured", () => {
  beforeEach(() => {
    delete process.env.AI_GATEWAY_API_KEY;
    delete process.env.VERCEL_OIDC_TOKEN;
  });

  it("the free preview falls back on the templates: that is what makes the project developable bare-handed", async () => {
    const { story, source } = await generateStory({
      params: PARAMS,
      brand: BRAND_DEFAULT,
      pageCount: PREVIEW_PAGES,
    });

    expect(source).toBe("fallback");
    expect(story.pages).toHaveLength(PREVIEW_PAGES);
  });

  it("the purchased book fails instead: whoever paid cannot receive a template", async () => {
    await expect(
      generateStory({
        params: PARAMS,
        brand: BRAND_DEFAULT,
        pageCount: 22,
        allowFallback: false,
      }),
    ).rejects.toThrow(AiUnavailable);
  });
});
