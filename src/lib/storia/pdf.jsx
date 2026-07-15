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
 * Il libro in PDF, layout da albo illustrato: ogni pagina è l'illustrazione a
 * tutta pagina, col testo in sovrimpressione su una fascia semitrasparente in
 * basso — non testo e immagine separati. Copertina scura col titolo, pagina di
 * chiusura con frase-àncora e guida genitori.
 *
 * Font built-in del PDF (Helvetica): coprono accenti e virgolette basse «».
 * Le immagini sono URL pubblici di Supabase Storage, scaricati al render.
 * Sta in un `.jsx` (usa JSX) ma NON è React DOM: `renderToBuffer` → Buffer PDF.
 */

const stili = StyleSheet.create({
  copertina: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 56,
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
  paginaLibro: {
    position: "relative",
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  sfondoPieno: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  immagine: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  numero: {
    position: "absolute",
    top: 20,
    right: 24,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    backgroundColor: "rgba(67,48,42,0.55)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  fascia: {
    backgroundColor: "rgba(253,250,246,0.86)",
    paddingVertical: 22,
    paddingHorizontal: 32,
    margin: 20,
    borderRadius: 14,
  },
  testo: {
    fontSize: 15,
    lineHeight: 1.7,
    color: "#2b211d",
    textAlign: "center",
  },
  chiusura: {
    flexDirection: "column",
    justifyContent: "center",
    padding: 56,
    backgroundColor: "#f7efe6",
  },
  ancora: {
    fontSize: 18,
    fontFamily: "Helvetica-Oblique",
    textAlign: "center",
    marginBottom: 32,
  },
  guidaTitolo: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
  },
  consiglio: {
    fontSize: 12,
    lineHeight: 1.6,
    color: "#4a3f39",
    marginBottom: 8,
  },
});

function PaginaLibro({ pagina, indice, accento, accentoSoft }) {
  return (
    <Page size="A5" orientation="landscape" style={stili.paginaLibro}>
      {pagina.illustrazioneUrl ? (
        // @react-pdf Image, non <img> HTML: la regola alt-text non si applica.
        // eslint-disable-next-line jsx-a11y/alt-text
        <Image src={pagina.illustrazioneUrl} style={stili.immagine} />
      ) : (
        <View style={[stili.sfondoPieno, { backgroundColor: accentoSoft }]} />
      )}
      <Text style={stili.numero}>{indice + 1}</Text>
      <View style={stili.fascia}>
        <Text style={[stili.testo, pagina.illustrazioneUrl ? null : { color: accento }]}>
          {pagina.testo}
        </Text>
      </View>
    </Page>
  );
}

function LibroPDF({ contenuto, brand }) {
  const accento = brand?.tema?.accento ?? "#e96d4f";
  const accentoSoft = brand?.tema?.accentoSoft ?? "#f6b27c";

  return (
    <Document title={contenuto.titolo} author={brand?.nome ?? "Amabili Storie"}>
      <Page size="A5" orientation="landscape" style={stili.copertina}>
        <Text style={stili.occhiello}>{brand?.nome ?? "Amabili Storie"}</Text>
        <Text style={stili.titolo}>«{contenuto.titolo}»</Text>
      </Page>

      {contenuto.pagine.map((pagina, indice) => (
        <PaginaLibro
          key={indice}
          pagina={pagina}
          indice={indice}
          accento={accento}
          accentoSoft={accentoSoft}
        />
      ))}

      <Page size="A5" orientation="landscape" style={stili.chiusura}>
        {contenuto.fraseAncora ? (
          <Text style={[stili.ancora, { color: accento }]}>«{contenuto.fraseAncora}»</Text>
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
