import ModuloLoginCliente from "@/components/cliente/ModuloLoginCliente";

export const metadata = {
  title: "La tua area — Amabili Storie",
};

const ERRORI = {
  link: "Quel link non ha funzionato. Chiedi un nuovo codice qui sotto.",
  scaduto: "Il link è scaduto. Chiedine uno nuovo qui sotto.",
};

export default async function AreaLogin({ searchParams }) {
  // Next 16: searchParams è una Promise.
  const { errore } = await searchParams;

  return (
    <main className="mx-auto flex min-h-svh max-w-[520px] flex-col justify-center px-6 py-16">
      <ModuloLoginCliente erroreIniziale={ERRORI[errore] ?? null} />
    </main>
  );
}
