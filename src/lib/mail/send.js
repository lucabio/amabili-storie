import { Resend } from "resend";

const FROM = process.env.MAIL_FROM ?? "Amabili Storie <onboarding@resend.dev>";

/**
 * Sends an email. If Resend is not configured nothing breaks: we log and carry
 * on. A lost email must not cost a book — the story stays in the queue anyway,
 * and the backoffice shows it.
 *
 * It only throws on real Resend errors, so the workflow step can retry.
 */
export async function sendMail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;

  if (!key) {
    console.warn(`RESEND_API_KEY assente: mail "${subject}" non spedita a ${to}.`);
    return;
  }

  const { error } = await new Resend(key).emails.send({
    from: FROM,
    to,
    subject,
    html,
  });

  if (error) throw new Error(`Resend: ${error.message}`);
}
