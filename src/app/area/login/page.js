import CustomerLoginForm from "@/components/customer/CustomerLoginForm";

export const metadata = {
  title: "La tua area — Amabili Storie",
};

const ERRORS = {
  link: "Quel link non ha funzionato. Chiedi un nuovo codice qui sotto.",
  scaduto: "Il link è scaduto. Chiedine uno nuovo qui sotto.",
};

export default async function CustomerLogin({ searchParams }) {
  // Next 16: searchParams is a Promise.
  const { errore } = await searchParams;

  return (
    <main className="mx-auto flex min-h-svh max-w-[520px] flex-col justify-center px-6 py-16">
      <CustomerLoginForm initialError={ERRORS[errore] ?? null} />
    </main>
  );
}
