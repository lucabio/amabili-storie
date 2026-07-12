import { risolviBrand } from "@/lib/brand/resolve";
import { generaStoria, PAGINE_ANTEPRIMA } from "@/lib/storia/genera";
import { parametriStoriaSchema } from "@/lib/storia/schema";

/** Generare una storia costa: alziamo il limite oltre i 10s di default. */
export const maxDuration = 60;

/** POST /api/storie/anteprima — le 3 pagine gratuite del configuratore. */
export async function POST(request) {
  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ errore: "Corpo della richiesta non valido" }, { status: 400 });
  }

  const esito = parametriStoriaSchema.safeParse(corpo);
  if (!esito.success) {
    return Response.json(
      { errore: "Parametri non validi", dettagli: esito.error.flatten().fieldErrors },
      { status: 422 },
    );
  }

  const parametri = esito.data;
  const brand = await risolviBrand(parametri.brand);

  try {
    const { storia, fonte } = await generaStoria({
      parametri,
      brand,
      numeroPagine: PAGINE_ANTEPRIMA,
    });
    return Response.json({ storia, fonte, brand: brand.slug });
  } catch (errore) {
    console.error("Generazione storia fallita:", errore);
    return Response.json(
      { errore: "Non siamo riusciti a scrivere la storia. Riprova tra poco." },
      { status: 502 },
    );
  }
}
