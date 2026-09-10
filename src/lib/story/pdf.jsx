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

import { fontById, pageLayout } from "@/lib/story/layout";

/**
 * The book as a PDF, laid out like in the editor: image and text at the
 * positions and sizes chosen by hand (fractions of the page), with the text
 * style chosen by hand — real WYSIWYG. The dark cover and the closing page stay
 * fixed.
 *
 * The fonts are the same files from `public/fonts` used by the editor
 * (registered below). `next.config.js` includes them in the serverless bundle of
 * the PDF route. It lives in a `.jsx` (it uses JSX) but it is NOT React DOM:
 * `renderToBuffer` → PDF Buffer.
 */

const fontDir = path.join(process.cwd(), "public", "fonts");
const fontFile = (name) => path.join(fontDir, name);

Font.register({
  family: "Baloo2",
  fonts: [
    { src: fontFile("baloo2-regular.ttf"), fontWeight: "normal" },
    { src: fontFile("baloo2-bold.ttf"), fontWeight: "bold" },
  ],
});
Font.register({
  family: "Fraunces",
  fonts: [
    { src: fontFile("fraunces-regular.ttf"), fontWeight: "normal" },
    { src: fontFile("fraunces-bold.ttf"), fontWeight: "bold" },
    { src: fontFile("fraunces-italic.ttf"), fontWeight: "normal", fontStyle: "italic" },
    { src: fontFile("fraunces-bolditalic.ttf"), fontWeight: "bold", fontStyle: "italic" },
  ],
});
Font.register({
  family: "Nunito",
  fonts: [
    { src: fontFile("nunito-regular.ttf"), fontWeight: "normal" },
    { src: fontFile("nunito-bold.ttf"), fontWeight: "bold" },
    { src: fontFile("nunito-italic.ttf"), fontWeight: "normal", fontStyle: "italic" },
    { src: fontFile("nunito-bolditalic.ttf"), fontWeight: "bold", fontStyle: "italic" },
  ],
});

/** Fraction 0–1 → percentage, clamped. */
const pct = (n) => `${Math.max(0, Math.min(1, n)) * 100}%`;

const styles = StyleSheet.create({
  cover: {
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: 56,
    backgroundColor: "#43302a",
  },
  eyebrow: {
    fontFamily: "Nunito",
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: "#f6b27c",
    marginBottom: 16,
  },
  title: {
    fontFamily: "Fraunces",
    fontWeight: "bold",
    fontSize: 32,
    textAlign: "center",
    color: "#ffffff",
    lineHeight: 1.3,
  },
  page: { position: "relative" },
  pageNumber: {
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
  closing: {
    flexDirection: "column",
    justifyContent: "center",
    padding: 56,
    backgroundColor: "#f7efe6",
  },
  anchor: {
    fontFamily: "Fraunces",
    fontStyle: "italic",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 32,
  },
  guideTitle: { fontFamily: "Nunito", fontWeight: "bold", fontSize: 14, marginBottom: 12 },
  tip: {
    fontFamily: "Nunito",
    fontSize: 12,
    lineHeight: 1.6,
    color: "#4a3f39",
    marginBottom: 8,
  },
});

function BookPage({ page, index, accentSoft }) {
  const { image, text, style } = pageLayout(page);
  const meta = fontById(style.font);
  const italic = style.italic && meta.italic;

  return (
    <Page size="A5" orientation="landscape" style={styles.page}>
      <View
        style={{
          position: "absolute",
          left: pct(image.x),
          top: pct(image.y),
          width: pct(image.w),
          height: pct(image.h),
        }}
      >
        {page.illustrationUrl ? (
          // @react-pdf Image, not an HTML <img>: the alt-text rule does not apply.
          // eslint-disable-next-line jsx-a11y/alt-text
          <Image
            src={page.illustrationUrl}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <View style={{ width: "100%", height: "100%", backgroundColor: accentSoft }} />
        )}
      </View>

      <View
        style={{
          position: "absolute",
          left: pct(text.x),
          top: pct(text.y),
          width: pct(text.w),
          height: pct(text.h),
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: meta.pdfFamily,
            fontSize: style.size,
            color: style.color,
            textAlign: style.align,
            fontWeight: style.bold ? "bold" : "normal",
            fontStyle: italic ? "italic" : "normal",
            lineHeight: 1.4,
          }}
        >
          {page.text}
        </Text>
      </View>

      <Text style={styles.pageNumber}>{index + 1}</Text>
    </Page>
  );
}

function BookPdf({ content, brand }) {
  const accent = brand?.theme?.accent ?? "#e96d4f";
  const accentSoft = brand?.theme?.accentSoft ?? "#f6b27c";

  return (
    <Document title={content.title} author={brand?.name ?? "Amabili Storie"}>
      <Page size="A5" orientation="landscape" style={styles.cover}>
        <Text style={styles.eyebrow}>{brand?.name ?? "Amabili Storie"}</Text>
        <Text style={styles.title}>«{content.title}»</Text>
      </Page>

      {content.pages.map((page, index) => (
        <BookPage key={index} page={page} index={index} accentSoft={accentSoft} />
      ))}

      <Page size="A5" orientation="landscape" style={styles.closing}>
        {content.anchorPhrase ? (
          <Text style={[styles.anchor, { color: accent }]}>«{content.anchorPhrase}»</Text>
        ) : null}
        {content.parentGuide?.length > 0 ? (
          <View>
            <Text style={styles.guideTitle}>Guida per i genitori</Text>
            {content.parentGuide.map((tip, index) => (
              <Text key={index} style={styles.tip}>
                •  {tip}
              </Text>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

/** Renders the book into a PDF Buffer. */
export function generateBookPdf({ content, brand }) {
  return renderToBuffer(<BookPdf content={content} brand={brand} />);
}
