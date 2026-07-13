import ModuloLogin from "@/components/admin/ModuloLogin";

const ERRORI = {
  link: "Il link non è più valido. Chiedi un codice nuovo: funziona sempre.",
  scaduto: "Il link è scaduto. Chiedi un codice nuovo.",
};

export default async function Login({ searchParams }) {
  // Next 16: searchParams è una Promise.
  const parametri = await searchParams;

  return <ModuloLogin erroreIniziale={ERRORI[parametri?.errore] ?? null} />;
}
