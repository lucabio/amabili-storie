"use client";

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";

import { PAGINA_PT, PAGINA_RATIO, fontById } from "@/lib/storia/layout";

/**
 * La tela di una pagina: immagine e testo come riquadri trascinabili e
 * ridimensionabili (react-rnd), alle stesse proporzioni dell'A5 del PDF. Ciò che
 * si sposta qui è ciò che finisce stampato. Posizioni e dimensioni si scambiano
 * col genitore in FRAZIONI (0–1), indipendenti dai pixel della tela.
 *
 * I riquadri si montano solo dopo aver misurato la tela (cw > 0): così in SSR
 * non si rende nessun Rnd — react-rnd tocca `window` — e non c'è mismatch.
 */
export default function TelaPagina({ pagina, layout, attivo, onLayout }) {
  const ref = useRef(null);
  const [cw, setCw] = useState(0);
  const ch = cw / PAGINA_RATIO;

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const misura = () => setCw(el.clientWidth);
    misura();
    const osservatore = new ResizeObserver(misura);
    osservatore.observe(el);
    return () => osservatore.disconnect();
  }, []);

  const meta = fontById(layout.stile.font);
  const fontPx =
    cw > 0 ? layout.stile.dimensione * (cw / PAGINA_PT.larghezza) : layout.stile.dimensione;

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-[14px] border border-bordo bg-crema"
      style={{ aspectRatio: `${PAGINA_PT.larghezza} / ${PAGINA_PT.altezza}` }}
    >
      {cw > 0 && (
        <>
          <Riquadro
            box={layout.immagine}
            cw={cw}
            ch={ch}
            attivo={attivo}
            minW={0.1}
            minH={0.1}
            onCommit={(box) => onLayout({ immagine: box })}
          >
            {pagina.illustrazioneUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={pagina.illustrazioneUrl}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-crema-scura text-xs font-medium text-inchiostro-tenue">
                Nessuna illustrazione
              </div>
            )}
          </Riquadro>

          <Riquadro
            box={layout.testo}
            cw={cw}
            ch={ch}
            attivo={attivo}
            minW={0.15}
            minH={0.08}
            onCommit={(box) => onLayout({ testo: box })}
          >
            <div
              className="flex h-full w-full items-center overflow-hidden px-2"
              style={{ justifyContent: giustifica(layout.stile.allineamento) }}
            >
              <p
                style={{
                  width: "100%",
                  margin: 0,
                  fontFamily: meta.editorFamily,
                  fontSize: fontPx,
                  color: layout.stile.colore,
                  textAlign: layout.stile.allineamento,
                  fontWeight: layout.stile.grassetto ? 700 : 400,
                  fontStyle: layout.stile.corsivo && meta.corsivo ? "italic" : "normal",
                  lineHeight: 1.4,
                }}
              >
                {pagina.testo}
              </p>
            </div>
          </Riquadro>
        </>
      )}
    </div>
  );
}

function giustifica(allineamento) {
  if (allineamento === "left") return "flex-start";
  if (allineamento === "right") return "flex-end";
  return "center";
}

function Riquadro({ box, cw, ch, attivo, minW, minH, onCommit, children }) {
  return (
    <Rnd
      bounds="parent"
      size={{ width: box.w * cw, height: box.h * ch }}
      position={{ x: box.x * cw, y: box.y * ch }}
      minWidth={minW * cw}
      minHeight={minH * ch}
      disableDragging={!attivo}
      enableResizing={attivo}
      onDragStop={(evento, d) => onCommit({ ...box, x: d.x / cw, y: d.y / ch })}
      onResizeStop={(evento, direzione, elemento, delta, posizione) =>
        onCommit({
          x: posizione.x / cw,
          y: posizione.y / ch,
          w: elemento.offsetWidth / cw,
          h: elemento.offsetHeight / ch,
        })
      }
      className={attivo ? "outline-2 outline-dashed outline-accento/50 hover:outline-accento" : ""}
    >
      {children}
    </Rnd>
  );
}
