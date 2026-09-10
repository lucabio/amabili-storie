import { resolveBrand } from "@/lib/brand/resolve";
import { generateStory, PREVIEW_PAGES } from "@/lib/story/generate";
import { storyParamsSchema } from "@/lib/story/schema";

/** Generating a story costs: raise the limit past the 10s default. */
export const maxDuration = 60;

/** POST /api/storie/anteprima — the 3 free pages of the configurator. */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corpo della richiesta non valido" }, { status: 400 });
  }

  const parsed = storyParamsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Parametri non validi", details: parsed.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const params = parsed.data;
  const brand = await resolveBrand(params.brand);

  try {
    const { story, source } = await generateStory({
      params,
      brand,
      pageCount: PREVIEW_PAGES,
    });
    return Response.json({ story, source, brand: brand.slug });
  } catch (problem) {
    console.error("Generazione storia fallita:", problem);
    return Response.json(
      { error: "Non siamo riusciti a scrivere la storia. Riprova tra poco." },
      { status: 502 },
    );
  }
}
