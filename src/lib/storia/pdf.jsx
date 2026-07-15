import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

/**
 * Il libro in PDF: la copertina, una pagina per pagina (illustrazione + testo),
 * e in chiusura la frase-àncora con la guida per i genitori. I font sono quelli
 * built-in del PDF (Helvetica): coprono gli accenti italiani e le virgolette
 * basse «», quindi niente font da caricare. Le immagini sono URL pubblici di
 * Supabase Storage: `@react-pdf` le scarica al momento del render.
 *
 * Sta in un `.jsx` perché usa JSX, ma NON è React DOM: `renderToBuffer` lo
 * trasforma in un Buffer PDF lato server.
 */

const stili = StyleSheet.create({
  copertina: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 64,
    backgroundColor: "#43302a",
  },
  occhiello: {
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#f6b27c",
    marginBottom: 16,
  },
  titolo: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    color: "#ffffff",
    lineHeight: 1.3,
  },
  pagina: {
    flexDirection: "column",
    padding: 56,
  },
  numero: {
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  illustrazione: {
    width: "100%",
    height: 320,
    objectFit: "cover",
    borderRadius: 12,
    marginBottom: 20,
  },
  testo: {
    fontSize: 15,
    lineHeight: 1.8,
    color: "#2b211d",
  },
  ancora: {
    fontSize: 16,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
    marginTop: 24,
    marginBottom: 28,
  },
  guidaTitolo: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 10,
  },
  consiglio: {
    fontSize: 12,
    lineHeight: 1.6,
    color: "#4a3f39",
    marginBottom: 6,
  },
});

function LibroPDF({ contenuto, brand }) {
  const accento = brand?.tema?.accento ?? "#e96d4f";

  return (
    <Document title={contenuto.titolo} author={brand?.nome ?? "Amabili Storie"}>
      <Page size="A5" style={stili.copertina}>
        <Text style={stili.occhiello}>{brand?.nome ?? "Amabili Storie"}</Text>
        <Text style={stili.titolo}>«{contenuto.titolo}»</Text>
      </Page>

      {contenuto.pagine.map((pagina, indice) => (
        <Page key={indice} size="A5" style={stili.pagina}>
          {pagina.illustrazioneUrl ? (
            // @react-pdf Image, non <img> HTML: la regola alt-text non si applica.
            // eslint-disable-next-line jsx-a11y/alt-text
            <Image src={pagina.illustrazioneUrl} style={stili.illustrazione} />
          ) : null}
          <Text style={[stili.numero, { color: accento }]}>Pagina {indice + 1}</Text>
          <Text style={stili.testo}>{pagina.testo}</Text>
        </Page>
      ))}

      <Page size="A5" style={stili.pagina}>
        {contenuto.fraseAncora ? (
          <Text style={[stili.ancora, { color: accento }]}>
            «{contenuto.fraseAncora}»
          </Text>
        ) : null}
        {contenuto.guidaGenitori?.length > 0 ? (
          <View>
            <Text style={stili.guidaTitolo}>Guida per i genitori</Text>
            {contenuto.guidaGenitori.map((consiglio, indice) => (
              <Text key={indice} style={stili.consiglio}>
                •  {consiglio}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

/** Renderizza il libro in un Buffer PDF. */
export function generaPdfLibro({ contenuto, brand }) {
  return renderToBuffer(<LibroPDF contenuto={contenuto} brand={brand} />);
}
