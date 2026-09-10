"use client";

import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";

import { PAGE_PT, PAGE_RATIO, fontById } from "@/lib/story/layout";

/**
 * The canvas of one page: image and text as draggable and resizable boxes
 * (react-rnd), at the same proportions as the A5 of the PDF. What you move here
 * is what ends up printed. Positions and sizes are exchanged with the parent as
 * FRACTIONS (0–1), independent of the canvas pixels.
 *
 * The boxes only mount after the canvas has been measured (canvasWidth > 0): so
 * in SSR no Rnd is rendered — react-rnd touches `window` — and there is no
 * mismatch.
 */
export default function PageCanvas({ page, layout, editable, onLayout }) {
  const ref = useRef(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const canvasHeight = canvasWidth / PAGE_RATIO;

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const measure = () => setCanvasWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const meta = fontById(layout.stile.font);
  const fontPx =
    canvasWidth > 0
      ? layout.stile.dimensione * (canvasWidth / PAGE_PT.width)
      : layout.stile.dimensione;

  return (
    <div
      ref={ref}
      className="relative w-full overflow-hidden rounded-[14px] border border-border bg-cream"
      style={{ aspectRatio: `${PAGE_PT.width} / ${PAGE_PT.height}` }}
    >
      {canvasWidth > 0 && (
        <>
          <Box
            box={layout.immagine}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            editable={editable}
            minW={0.1}
            minH={0.1}
            onCommit={(box) => onLayout({ immagine: box })}
          >
            {page.illustrazioneUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={page.illustrazioneUrl}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-cream-dark text-xs font-medium text-ink-muted">
                Nessuna illustrazione
              </div>
            )}
          </Box>

          <Box
            box={layout.testo}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            editable={editable}
            minW={0.15}
            minH={0.08}
            onCommit={(box) => onLayout({ testo: box })}
          >
            <div
              className="flex h-full w-full items-center overflow-hidden px-2"
              style={{ justifyContent: justify(layout.stile.allineamento) }}
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
                  fontStyle: layout.stile.corsivo && meta.italic ? "italic" : "normal",
                  lineHeight: 1.4,
                }}
              >
                {page.testo}
              </p>
            </div>
          </Box>
        </>
      )}
    </div>
  );
}

function justify(alignment) {
  if (alignment === "left") return "flex-start";
  if (alignment === "right") return "flex-end";
  return "center";
}

function Box({ box, canvasWidth, canvasHeight, editable, minW, minH, onCommit, children }) {
  return (
    <Rnd
      bounds="parent"
      size={{ width: box.w * canvasWidth, height: box.h * canvasHeight }}
      position={{ x: box.x * canvasWidth, y: box.y * canvasHeight }}
      minWidth={minW * canvasWidth}
      minHeight={minH * canvasHeight}
      disableDragging={!editable}
      enableResizing={editable}
      onDragStop={(event, data) =>
        onCommit({ ...box, x: data.x / canvasWidth, y: data.y / canvasHeight })
      }
      onResizeStop={(event, direction, element, delta, position) =>
        onCommit({
          x: position.x / canvasWidth,
          y: position.y / canvasHeight,
          w: element.offsetWidth / canvasWidth,
          h: element.offsetHeight / canvasHeight,
        })
      }
      className={editable ? "outline-2 outline-dashed outline-accent/50 hover:outline-accent" : ""}
    >
      {children}
    </Rnd>
  );
}
