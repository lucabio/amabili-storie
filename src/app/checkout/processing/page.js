import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "La storia sta nascendo — Amabili Storie",
};

// Stars scattered across the upper half of the sky. Fixed positions (no
// Math.random: it would break hydration, and real randomness is not needed).
const STARS = [
  { left: "12%", top: "14%", d: 3, delay: 0 },
  { left: "24%", top: "26%", d: 2, delay: 0.8 },
  { left: "38%", top: "10%", d: 4, delay: 1.6 },
  { left: "52%", top: "20%", d: 2, delay: 0.4 },
  { left: "63%", top: "12%", d: 3, delay: 2.1 },
  { left: "74%", top: "24%", d: 2, delay: 1.2 },
  { left: "86%", top: "16%", d: 3, delay: 0.6 },
  { left: "18%", top: "40%", d: 2, delay: 2.4 },
  { left: "82%", top: "42%", d: 2, delay: 1.9 },
  { left: "46%", top: "34%", d: 2, delay: 3 },
  { left: "9%", top: "58%", d: 2, delay: 1.1 },
  { left: "90%", top: "60%", d: 3, delay: 2.6 },
];

export default function Processing() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-dark px-6 py-16 text-center">
      <style>{`
        @keyframes as-twinkle { 0%,100% { opacity:.2; transform:scale(.7) } 50% { opacity:1; transform:scale(1) } }
        @keyframes as-breathe { 0%,100% { transform:scale(1); opacity:.5 } 50% { transform:scale(1.14); opacity:.8 } }
        @keyframes as-drift  { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-12px) } }
        .as-star { animation: as-twinkle 3.4s ease-in-out infinite; }
        .as-halo  { animation: as-breathe 6s ease-in-out infinite; }
        .as-scene  { animation: as-drift 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .as-star, .as-halo, .as-scene { animation: none; }
        }
      `}</style>

      {/* Close: back to the site */}
      <Link
        href="/"
        aria-label="Torna al sito"
        className="lift absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 bg-cream/10 text-xl font-bold text-cream/80 hover:text-cream"
      >
        ×
      </Link>

      {/* Starry sky */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {STARS.map((star, i) => (
          <span
            key={i}
            className="as-star absolute rounded-full bg-cream"
            style={{
              left: star.left,
              top: star.top,
              width: star.d,
              height: star.d,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Moon */}
      <div className="pointer-events-none absolute top-[10%] right-[14%]" aria-hidden="true">
        <div className="as-halo absolute -inset-6 rounded-full bg-accent-soft/25 blur-2xl" />
        <div className="relative h-16 w-16 rounded-full bg-accent-soft shadow-[inset_-10px_-6px_0_rgba(67,48,42,0.28)]" />
      </div>

      {/* The scene: a child sleeping peacefully */}
      <div className="as-scene relative">
        <div
          className="pointer-events-none absolute -inset-8 rounded-full bg-accent/20 blur-3xl"
          aria-hidden="true"
        />
        <Image
          src="/illustrations/cover-child-night.svg"
          alt=""
          width={220}
          height={220}
          aria-hidden="true"
          priority
          className="relative w-[min(220px,52vw)]"
        />
      </div>

      <p className="mt-10 text-[13px] font-extrabold tracking-[0.18em] text-accent-soft uppercase">
        Ci pensiamo noi
      </p>
      <h1 className="mt-3 max-w-[620px] font-display text-[clamp(2rem,5vw,3rem)] leading-tight font-semibold text-cream">
        La storia sta nascendo
      </h1>
      <p className="mt-5 max-w-[520px] text-lg leading-relaxed font-medium text-parchment">
        Ti abbiamo scritto una mail. Rileggiamo ogni pagina a mano, perché un libro
        che finisce tra le mani di un bambino merita un paio d&apos;occhi umani: ti
        avvisiamo appena è pronta.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="lift rounded-full bg-accent px-8 py-4 font-bold text-cream shadow-[0_10px_24px_rgba(233,109,79,0.3)]"
        >
          Torna al sito
        </Link>
        <Link href="/account" className="font-semibold text-cream/75 hover:text-cream">
          Segui la tua storia →
        </Link>
      </div>
    </main>
  );
}
