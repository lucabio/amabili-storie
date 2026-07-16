import path from "node:path";

import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

import { fontById, layoutPagina } from "@/lib/storia/layout";

/**
 * Il libro in PDF, impaginato come nell'editor: immagine e testo alle posizioni
 * e dimensioni scelte a mano (frazioni della pagina), con lo stile del testo
 * scelto a mano — WYSIWYG vero. Copertina scura e pagina di chiusura restano
 * fisse.
 *
 * I font sono gli stessi file di `public/fonts` usati dall'editor (registrati
 * qui sotto). `next.config.js` li include nel bundle serverless della route PDF.
 * Sta in un `.jsx` (usa JSX) ma NON è React DOM: `renderToBuffer` → Buffer PDF.
 */

const dirFont = path.join(process.cwd(), "public", "fonts");
const f = (nome) => path.join(dirFont, nome);

Font.register({
  family: "Baloo2",
  fonts: [
    { src: f("baloo2-regular.ttf"), fontWeight: "normal" },
    { src: f("baloo2-bold.ttf"), fontWeight: "bold" },
  ],
});
Font.register({
  family: "Fraunces",
  fonts: [
    { src: f("fraunces-regular.ttf"), fontWeight: "normal" },
    { src: f("fraunces-bold.ttf"), fontWeight: "bold" },
    { src: f("fraunces-italic.ttf"), fontWeight: "normal", fontStyle: "italic" },
    { src: f("fraunces-bolditalic.ttf"), fontWeight: "bold", fontStyle: "italic" },
  ],
});
Font.register({
  family: "Nunito",
  fonts: [
    { src: f("nunito-regular.ttf"), fontWeight: "normal" },
    { src: f("nunito-bold.ttf"), fontWeight: "bold" },
    { src: f("nunito-italic.ttf"), fontWeight: "normal", fontStyle: "italic" },
    { src: f("nunito-bolditalic.ttf"), fontWeight: "bold", fontStyle: "italic" },
  ],
});

/** Frazione 0–1 → percentuale, con clamp. */
const pct = (n) => `${Math.max(0, Math.min(1, n)) * 100}%`;

const stili = StyleSheet.create({
  copertina: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 56,
    backgroundColor: "#43302a",
  },
  occhiello: {
    fontFamily: "Nunito",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#f6b27c",
    marginBottom: 16,
  },
  titolo: {
    fontFamily: "Fraunces",
    fontWeight: "bold",
    fontSize: 32,
    textAlign: "center",
    color: "#ffffff",
    lineHeight: 1.3,
  },
  pagina: { position: "relative" },
  numero: {
    position: "absolute",
    top: 18,
    right: 20,
    fontFamily: "Nunito",
    fontSize: 10,
    fontWeight: "bold",
    color: "#ffffff",
    backgroundColor: "rgba(67,48,42,0.55)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  chiusura: {
    flexDirection: "column",
    justifyContent: "center",
    padding: 56,
    backgroundColor: "#f7efe6",
  },
  ancora: {
    fontFamily: "Fraunces",
    fontStyle: "italic",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 32,
  },
  guidaTitolo: { fontFamily: "Nunito", fontWeight: "bold", fontSize: 14, marginBottom: 12 },
  consiglio: {
    fontFamily: "Nunito",
    fontSize: 12,
    lineHeight: 1.6,
    color: "#4a3f39",
    marginBottom: 8,
  },
});

function PaginaLibro({ pagina, indice, accentoSoft }) {
  const { immagine, testo, stile } = layoutPagina(pagina);
  const meta = fontById(stile.font);
  const corsivo = stile.corsivo && meta.corsivo;

  return (
    <Page size="A5" orientation="landscape" style={stili.pagina}>
      <View
        style={{
          position: "absolute",
          left: pct(immagine.x),
          top: pct(immagine.y),
          width: pct(immagine.w),
          height: pct(immagine.h),
        }}
      >
        {pagina.illustrazioneUrl ? (
          // @react-pdf Image, non <img> HTML: la regola alt-text non si applica.
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image
            src={pagina.illustrazioneUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: accentoSoft }} />
        )}
      </View>

      <View
        style={{
          position: "absolute",
          left: pct(testo.x),
          top: pct(testo.y),
          width: pct(testo.w),
          height: pct(testo.h),
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: meta.pdfFamily,
            fontSize: stile.dimensione,
            color: stile.colore,
            textAlign: stile.allineamento,
            fontWeight: stile.grassetto ? "bold" : "normal",
            fontStyle: corsivo ? "italic" : "normal",
            lineHeight: 1.4,
          }}
        >
          {pagina.testo}
        </Text>
      </View>

      <Text style={stili.numero}>{indice + 1}</Text>
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
        <PaginaLibro key={indice} pagina={pagina} indice={indice} accentoSoft={accentoSoft} />
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
