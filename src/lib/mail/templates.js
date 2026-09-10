/**
 * The parent's emails. HTML for mail clients: tables and inline styles, no
 * flexbox and no remote fonts. Ugly to read, but the only thing Outlook and
 * Gmail render the same way.
 *
 * They are branded: a guest of Hotel Famiglia Serena gets an email in the
 * hotel's teal with the hotel's name, not in Amabili's orange. The colors come
 * from `brands.tema`, which is already there.
 *
 * `name` and `url` come from the parent (from the wizard); `brand.name` and the
 * colors of `brand.theme` come from the backoffice (an admin, but via the DB):
 * in both cases they are external strings and must be escaped before ending up
 * in the HTML. The one exception is `subject`: it is a mail header, not HTML,
 * and there the text stays raw.
 */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function shell({ brand, title, body, button }) {
  const accent = escapeHtml(brand.theme.accento);
  const dark = escapeHtml(brand.theme.scuro);
  const brandName = escapeHtml(brand.name);

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#fff8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8f0">
      <tr>
        <td align="center" style="padding:40px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
            <tr>
              <td align="center" style="padding-bottom:24px">
                <span style="font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${accent}">${brandName}</span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;border:1px solid #f3e3d3;border-radius:20px;padding:40px 32px">
                <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:${dark}">${title}</h1>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.7;font-weight:500;color:#8c7268">${body}</p>
                ${button ? buttonHtml(button, accent) : ""}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:24px">
                <p style="margin:0;font-size:13px;line-height:1.6;font-weight:500;color:#b08f7e">${brandName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buttonHtml({ text, url }, accent) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px">
    <tr>
      <td align="center" style="background-color:${accent};border-radius:9999px">
        <a href="${escapeHtml(url)}" style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:700;color:#fff8f0;text-decoration:none">${text}</a>
      </td>
    </tr>
  </table>`;
}

export function storyInProgressMail({ name, brand }) {
  return {
    subject: `La storia di ${name} è nata`,
    html: shell({
      brand,
      title: `La storia di ${escapeHtml(name)} è nata`,
      body:
        "La stiamo rileggendo una per una, perché un libro che finisce nelle mani di un bambino merita un paio d'occhi umani. Ti scriviamo appena è pronta: di solito bastano poche ore.",
    }),
  };
}

export function storyReadyMail({ name, brand, url }) {
  return {
    subject: `Il libro di ${name} è pronto`,
    html: shell({
      brand,
      title: `Il libro di ${escapeHtml(name)} è pronto`,
      body: "L'abbiamo riletta, e ora è vostra. Buona lettura, stasera.",
      button: { text: "Leggi la storia", url },
    }),
  };
}
