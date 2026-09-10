"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

import { formatPrice, PRICE_LIST } from "@/lib/orders/schema";

const TRAIL_TEXT = "AMABILI STORIE ";
const MIN_DISTANCE = 45; // px between one letter and the next

/**
 * The trail of letters that follows the mouse in the hero: it is the visual
 * signature of the demo. Disabled when the user asks for less motion.
 *
 * The `use` prefix is imposed by React: the hook rules require it.
 */
function useLetterTrail() {
  const [letters, setLetters] = useState([]);
  const last = useRef(null);
  const index = useRef(0);
  const counter = useRef(0);

  const onMove = useCallback((event) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const area = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - area.left;
    const y = event.clientY - area.top;

    if (last.current) {
      const dx = x - last.current.x;
      const dy = y - last.current.y;
      if (dx * dx + dy * dy < MIN_DISTANCE * MIN_DISTANCE) return;
    }
    last.current = { x, y };

    const character = TRAIL_TEXT[index.current % TRAIL_TEXT.length];
    index.current += 1;
    if (character === " ") return;

    const id = ++counter.current;
    const letter = {
      id,
      character,
      x,
      y,
      size: 26 + Math.random() * 34,
      rotation: `${(Math.random() * 30 - 15).toFixed(0)}deg`,
      light: Math.random() < 0.5,
    };

    setLetters((previous) => [...previous, letter]);
    setTimeout(() => {
      setLetters((previous) => previous.filter((l) => l.id !== id));
    }, 1700);
  }, []);

  return { letters, onMove };
}

export default function Hero({ brand }) {
  const { letters, onMove } = useLetterTrail();

  return (
    <header
      onMouseMove={onMove}
      className="relative flex min-h-svh snap-start flex-col justify-center overflow-hidden bg-[url('/illustrations/doodle-sky.svg')] bg-[length:min(190px,22vw)] bg-[center_bottom_3%] bg-no-repeat"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {letters.map((letter) => (
          <span
            key={letter.id}
            className="anim-letter absolute font-display font-semibold opacity-0 select-none"
            style={{
              left: letter.x,
              top: letter.y,
              fontSize: letter.size,
              color: letter.light ? "var(--color-accent-soft)" : "var(--color-accent)",
              "--rot": letter.rotation,
            }}
          >
            {letter.character}
          </span>
        ))}
      </div>

      {/* Decorative bubbles */}
      <div
        className="pointer-events-none absolute -top-35 -right-30 h-105 w-105 rounded-full bg-accent-soft/30"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-45 -left-35 h-95 w-95 rounded-full bg-accent/10"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid w-full max-w-[1080px] grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-center gap-12 px-6 py-[clamp(48px,7vw,88px)]">
        <div className="anim-rise">
          <p className="mb-4 text-[13px] font-extrabold tracking-[0.16em] text-accent uppercase">
            {brand.hero.occhiello}
          </p>
          <h1 className="max-w-[560px] font-display text-[clamp(2.2rem,5.4vw,3.8rem)] leading-[1.08] font-semibold">
            {brand.hero.titolo}{" "}
            <span className="text-accent">{brand.hero.titoloAccento}</span>
          </h1>
          <p className="mt-5 max-w-[480px] text-lg leading-relaxed font-medium text-ink-soft">
            {brand.hero.sottotitolo}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#configurator"
              className="lift rounded-full bg-accent px-8 py-4 text-[1.05rem] font-bold text-cream shadow-[0_10px_24px_rgba(233,109,79,0.3)]"
            >
              {brand.hero.cta}
            </a>
            {brand.showPrices && (
              <span className="text-sm font-semibold text-ink-soft">
                Anteprima gratuita · eBook {formatPrice(PRICE_LIST.ebook.priceCents)} · Cartaceo{" "}
                {formatPrice(PRICE_LIST.rilegato.priceCents)}
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="anim-floaty">
            <div className="relative aspect-3/4 w-[min(280px,70vw)] overflow-hidden rounded-[18px] bg-linear-165 from-accent to-accent-soft shadow-[0_30px_60px_-18px_rgba(67,48,42,0.35)]">
              <div
                className="pointer-events-none absolute inset-2.5 rounded-xl border border-cream/45"
                aria-hidden="true"
              />
              <div className="relative flex h-full flex-col items-center justify-between px-5 py-7 text-center">
                <p className="font-display text-[1.35rem] leading-tight font-semibold text-cream">
                  La notte stellata di Futura
                </p>
                <Image
                  src="/illustrations/cover-child-night.svg"
                  alt=""
                  width={240}
                  height={240}
                  className="my-3.5 min-h-0 w-full flex-1 rounded-[10px] object-cover"
                  aria-hidden="true"
                  priority
                />
                <p className="text-[11px] font-bold tracking-[0.22em] text-cream/85 uppercase">
                  {brand.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
