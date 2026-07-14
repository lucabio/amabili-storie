import { Resend } from "resend";

const MITTENTE = process.env.MAIL_MITTENTE ?? "Amabili Storie <onboarding@resend.dev>";

/**
 * Manda una mail. Se Resend non è configurato non si rompe niente: si logga e si
 * tira dritto. Una mail persa non deve costare un libro — la storia resta
 * comunque in coda, e il backoffice la mostra.
 *
 * Alza solo sugli errori veri di Resend, così lo step del workflow può ritentare.
 */
export async function inviaMail({ a, oggetto, html }) {
  const chiave = process.env.RESEND_API_KEY;

  if (!chiave) {
    console.warn(`RESEND_API_KEY assente: mail "${oggetto}" non spedita a ${a}.`);
    return;
  }

  const { error } = await new Resend(chiave).emails.send({
    from: MITTENTE,
    to: a,
    subject: oggetto,
    html,
  });

  if (error) throw new Error(`Resend: ${error.message}`);
}
