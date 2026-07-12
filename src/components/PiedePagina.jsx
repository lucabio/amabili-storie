export default function PiedePagina({ brand }) {
  return (
    <footer className="bg-scuro px-6 py-11 text-center">
      <p className="font-display text-[1.3rem] font-semibold text-crema">{brand.nome}</p>
      <p className="mt-1.5 text-sm font-semibold text-inchiostro-tenue">
        Storie che risolvono, notte dopo notte
      </p>
    </footer>
  );
}
