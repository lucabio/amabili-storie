import Link from "next/link";

export default function Footer({ brand }) {
  return (
    <footer className="snap-end bg-dark px-6 py-11 text-center">
      <p className="font-display text-[1.3rem] font-semibold text-cream">{brand.name}</p>
      <p className="mt-1.5 text-sm font-semibold text-ink-muted">
        Storie che risolvono, notte dopo notte
      </p>
      <Link
        href="/account"
        className="mt-4 inline-block text-sm font-semibold text-accent-soft hover:text-cream"
      >
        Hai già una storia? Entra nella tua area
      </Link>
    </footer>
  );
}
