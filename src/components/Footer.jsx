import Link from "next/link";

export default function Footer({ brand }) {
  return (
    <footer className="snap-end bg-scuro px-6 py-11 text-center">
      <p className="font-display text-[1.3rem] font-semibold text-crema">{brand.name}</p>
      <p className="mt-1.5 text-sm font-semibold text-inchiostro-tenue">
        Storie che risolvono, notte dopo notte
      </p>
      <Link
        href="/area"
        className="mt-4 inline-block text-sm font-semibold text-accento-soft hover:text-crema"
      >
        Hai già una storia? Entra nella tua area
      </Link>
    </footer>
  );
}
