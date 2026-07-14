import { z } from "zod";

/**
 * Un lead: la mail di un genitore che ha generato l'anteprima gratuita e ha
 * provato a comprare, ma l'acquisto non è andato a buon fine (checkout non
 * ancora attivo, errore del server...). È la persona più preziosa da
 * ricontattare — chi arriva fin qui ha già scritto una storia, ha già visto
 * le prime pagine, e ha già lasciato la sua mail.
 *
 * Il brand arriva come slug, non come id: la verità sul brand — e quindi il
 * suo id, che decide anche il vincolo `unique (email, brand_id)` — la legge
 * `salvaLead` dal database via `risolviBrand`, mai da un id che il client
 * potrebbe dichiarare.
 */
export const leadSchema = z.object({
  email: z.email(),
  brand: z.string().trim().min(1).default("amabili"),
});
