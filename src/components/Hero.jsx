"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

const SCIA = "AMABILI STORIE ";
const DISTANZA_MINIMA = 45; // px tra una lettera e la successiva

/**
 * La scia di lettere che segue il mouse nell'hero: è la firma visiva del demo.
 * Disattivata quando l'utente chiede meno animazioni.
 *
 * Il prefisso `use` è imposto da React: le regole degli hook lo richiedono.
 */
function useSciaDiLettere() {
  const [lettere, setLettere] = useState([]);
  const ultima = useRef(null);
  const indice = useRef(0);
  const contatore = useRef(0);

  const alMovimento = useCallback((evento) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const area = evento.currentTarget.getBoundingClientRect();
    const x = evento.clientX - area.left;
    const y = evento.clientY - area.top;

    if (ultima.current) {
      const dx = x - ultima.current.x;
      const dy = y - ultima.current.y;
      if (dx * dx + dy * dy < DISTANZA_MINIMA * DISTANZA_MINIMA) return;
    }
    ultima.current = { x, y };

    const carattere = SCIA[indice.current % SCIA.length];
    indice.current += 1;
    if (carattere === " ") return;

    const id = ++contatore.current;
    const lettera = {
      id,
      carattere,
      x,
      y,
      dimensione: 26 + Math.random() * 34,
      rotazione: `${(Math.random() * 30 - 15).toFixed(0)}deg`,
      chiara: Math.random() < 0.5,
    };

    setLettere((precedenti) => [...precedenti, lettera]);
    setTimeout(() => {
      setLettere((precedenti) => precedenti.filter((l) => l.id !== id));
    }, 1700);
  }, []);

  return { lettere, alMovimento };
}

export default function Hero({ brand }) {
  const { lettere, alMovimento } = useSciaDiLettere();

  return (
    <header
      onMouseMove={alMovimento}
      className="relative flex min-h-[calc(100svh-38px)] flex-col justify-center overflow-hidden bg-[url('/illustrazioni/doodle-cielo.svg')] bg-[length:min(190px,22vw)] bg-[center_bottom_3%] bg-no-repeat"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {lettere.map((lettera) => (
          <span
            key={lettera.id}
            className="absolute font-display font-semibold select-none"
            style={{
              left: lettera.x,
              top: lettera.y,
              fontSize: lettera.dimensione,
              color: lettera.chiara ? "var(--color-accento-soft)" : "var(--color-accento)",
              transform: `translate(-50%, -50%) rotate(${lettera.rotazione})`,
              animation: "popIn .35s ease both",
              opacity: 0.55,
            }}
          >
            {lettera.carattere}
          </span>
        ))}
      </div>

      {/* Bolle decorative */}
      <div
        className="pointer-events-none absolute -top-35 -right-30 h-105 w-105 rounded-full bg-accento-soft/30"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-45 -left-35 h-95 w-95 rounded-full bg-accento/10"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-[1080px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-12 px-6 py-[clamp(48px,7vw,88px)]">
        <div className="anim-rise">
          <p className="mb-4 text-[13px] font-extrabold tracking-[0.16em] text-accento uppercase">
            {brand.hero.occhiello}
          </p>
          <h1 className="max-w-[560px] font-display text-[clamp(2.2rem,5.4vw,3.8rem)] leading-[1.08] font-semibold">
            {brand.hero.titolo}{" "}
            <span className="text-accento">{brand.hero.titoloAccento}</span>
          </h1>
          <p className="mt-5 max-w-[480px] text-lg leading-relaxed font-medium text-inchiostro-soft">
            {brand.hero.sottotitolo}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#configuratore"
              className="lift rounded-full bg-accento px-8 py-4 text-[1.05rem] font-bold text-crema shadow-[0_10px_24px_rgba(233,109,79,0.3)]"
            >
              {brand.hero.cta}
            </a>
            {brand.mostraPrezzi && (
              <span className="text-sm font-semibold text-inchiostro-soft">
                Anteprima gratuita · eBook 9,90 € · Cartaceo 34,90 €
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="anim-floaty">
            <div className="relative aspect-3/4 w-[min(280px,70vw)] overflow-hidden rounded-[18px] bg-linear-165 from-accento to-accento-soft shadow-[0_30px_60px_-18px_rgba(67,48,42,0.35)]">
              <div
                className="pointer-events-none absolute inset-2.5 rounded-xl border border-crema/45"
                aria-hidden="true"
              />
              <div className="relative flex h-full flex-col items-center justify-between px-5 py-7 text-center">
                <p className="font-display text-[1.35rem] leading-tight font-semibold text-crema">
                  La notte stellata di Futura
                </p>
                <Image
                  src="/illustrazioni/copertina-bimba-notte.svg"
                  alt=""
                  width={240}
                  height={240}
                  className="my-3.5 min-h-0 w-full flex-1 rounded-[10px] object-cover"
                  aria-hidden="true"
                  priority
                />
                <p className="text-[11px] font-bold tracking-[0.22em] text-crema/85 uppercase">
                  {brand.nome}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
