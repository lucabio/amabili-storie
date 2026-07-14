/**
 * Le mail del genitore. HTML da client di posta: tabelle e stili inline, niente
 * flexbox e niente font remoti. Brutto da leggere, ma è l'unico che Outlook e
 * Gmail rendono uguale.
 *
 * Sono brandizzate: un ospite dell'Hotel Famiglia Serena riceve una mail col
 * teal dell'hotel e il suo nome, non con l'arancione di Amabili. I colori
 * arrivano da `brands.tema`, che è già lì.
 */

function scheletro({ brand, titolo, corpo, bottone }) {
  const { accento, scuro } = brand.tema;

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8" />
    <meta name="color-scheme" content="light" />
    <title>${titolo}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#fff8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8f0">
      <tr>
        <td align="center" style="padding:40px 16px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
            <tr>
              <td align="center" style="padding-bottom:24px">
                <span style="font-size:12px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${accento}">${brand.nome}</span>
              </td>
            </tr>
            <tr>
              <td style="background-color:#ffffff;border:1px solid #f3e3d3;border-radius:20px;padding:40px 32px">
                <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:700;color:${scuro}">${titolo}</h1>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.7;font-weight:500;color:#8c7268">${corpo}</p>
                ${bottone ? bottoneHtml(bottone, accento) : ""}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-top:24px">
                <p style="margin:0;font-size:13px;line-height:1.6;font-weight:500;color:#b08f7e">${brand.nome}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function bottoneHtml({ testo, url }, accento) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px">
    <tr>
      <td align="center" style="background-color:${accento};border-radius:9999px">
        <a href="${url}" style="display:inline-block;padding:15px 32px;font-size:15px;font-weight:700;color:#fff8f0;text-decoration:none">${testo}</a>
      </td>
    </tr>
  </table>`;
}

export function mailStoriaInLavorazione({ nome, brand }) {
  return {
    oggetto: `La storia di ${nome} è nata`,
    html: scheletro({
      brand,
      titolo: `La storia di ${nome} è nata`,
      corpo:
        "La stiamo rileggendo una per una, perché un libro che finisce nelle mani di un bambino merita un paio d'occhi umani. Ti scriviamo appena è pronta: di solito bastano poche ore.",
    }),
  };
}

export function mailStoriaPronta({ nome, brand, url }) {
  return {
    oggetto: `Il libro di ${nome} è pronto`,
    html: scheletro({
      brand,
      titolo: `Il libro di ${nome} è pronto`,
      corpo: "L'abbiamo riletta, e ora è vostra. Buona lettura, stasera.",
      bottone: { testo: "Leggi la storia", url },
    }),
  };
}
