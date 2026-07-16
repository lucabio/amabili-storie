import Image from "next/image";
import Link from "next/link";

export const metadata = {
  title: "La storia sta nascendo — Amabili Storie",
};

// Stelle sparse nella metà alta del cielo. Posizioni fisse (niente Math.random:
// romperebbe l'idratazione e non serve la casualità vera).
const STELLE = [
  { left: "12%", top: "14%", d: 3, ritardo: 0 },
  { left: "24%", top: "26%", d: 2, ritardo: 0.8 },
  { left: "38%", top: "10%", d: 4, ritardo: 1.6 },
  { left: "52%", top: "20%", d: 2, ritardo: 0.4 },
  { left: "63%", top: "12%", d: 3, ritardo: 2.1 },
  { left: "74%", top: "24%", d: 2, ritardo: 1.2 },
  { left: "86%", top: "16%", d: 3, ritardo: 0.6 },
  { left: "18%", top: "40%", d: 2, ritardo: 2.4 },
  { left: "82%", top: "42%", d: 2, ritardo: 1.9 },
  { left: "46%", top: "34%", d: 2, ritardo: 3 },
  { left: "9%", top: "58%", d: 2, ritardo: 1.1 },
  { left: "90%", top: "60%", d: 3, ritardo: 2.6 },
];

export default function InLavorazione() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-scuro px-6 py-16 text-center">
      <style>{`
        @keyframes as-twinkle { 0%,100% { opacity:.2; transform:scale(.7) } 50% { opacity:1; transform:scale(1) } }
        @keyframes as-respira { 0%,100% { transform:scale(1); opacity:.5 } 50% { transform:scale(1.14); opacity:.8 } }
        @keyframes as-deriva  { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-12px) } }
        .as-stella { animation: as-twinkle 3.4s ease-in-out infinite; }
        .as-alone  { animation: as-respira 6s ease-in-out infinite; }
        .as-scena  { animation: as-deriva 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .as-stella, .as-alone, .as-scena { animation: none; }
        }
      `}</style>

      {/* Chiudi: torna al sito */}
      <Link
        href="/"
        aria-label="Torna al sito"
        className="lift absolute top-5 right-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-crema/20 bg-crema/10 text-xl font-bold text-crema/80 hover:text-crema"
      >
        ×
      </Link>

      {/* Cielo stellato */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {STELLE.map((stella, i) => (
          <span
            key={i}
            className="as-stella absolute rounded-full bg-crema"
            style={{
              left: stella.left,
              top: stella.top,
              width: stella.d,
              height: stella.d,
              animationDelay: `${stella.ritardo}s`,
            }}
          />
        ))}
      </div>

      {/* Luna */}
      <div className="pointer-events-none absolute top-[10%] right-[14%]" aria-hidden="true">
        <div className="as-alone absolute -inset-6 rounded-full bg-accento-soft/25 blur-2xl" />
        <div className="relative h-16 w-16 rounded-full bg-accento-soft shadow-[inset_-10px_-6px_0_rgba(67,48,42,0.28)]" />
      </div>

      {/* La scena: un bimbo che dorme sereno */}
      <div className="as-scena relative">
        <div
          className="pointer-events-none absolute -inset-8 rounded-full bg-accento/20 blur-3xl"
          aria-hidden="true"
        />
        <Image
          src="/illustrazioni/copertina-bimba-notte.svg"
          alt=""
          width={220}
          height={220}
          aria-hidden="true"
          priority
          className="relative w-[min(220px,52vw)]"
        />
      </div>

      <p className="mt-10 text-[13px] font-extrabold tracking-[0.18em] text-accento-soft uppercase">
        Ci pensiamo noi
      </p>
      <h1 className="mt-3 max-w-[620px] font-display text-[clamp(2rem,5vw,3rem)] leading-tight font-semibold text-crema">
        La storia sta nascendo
      </h1>
      <p className="mt-5 max-w-[520px] text-lg leading-relaxed font-medium text-pergamena">
        Ti abbiamo scritto una mail. Rileggiamo ogni pagina a mano, perché un libro
        che finisce tra le mani di un bambino merita un paio d&apos;occhi umani: ti
        avvisiamo appena è pronta.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="lift rounded-full bg-accento px-8 py-4 font-bold text-crema shadow-[0_10px_24px_rgba(233,109,79,0.3)]"
        >
          Torna al sito
        </Link>
        <Link href="/area" className="font-semibold text-crema/75 hover:text-crema">
          Segui la tua storia →
        </Link>
      </div>
    </main>
  );
}
