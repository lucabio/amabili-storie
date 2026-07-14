"use client";

import { useState } from "react";

import AnteprimaStoria from "@/components/AnteprimaStoria";
import CopertinaLive from "@/components/CopertinaLive";
import { ANIMALI } from "@/lib/domain/animali";
import { componiTitolo } from "@/lib/domain/capricci";
import { formattaPrezzo, LISTINO } from "@/lib/ordini/schema";

const ETICHETTE_STEP = ["Capriccio", "Famiglia", "Protagonisti"];

const classiInput =
  "rounded-[14px] border border-bordo bg-crema px-4 py-3.5 font-semibold text-inchiostro outline-accento";

function Chip({ attivo, children, ...props }) {
  return (
    <button
      type="button"
      className={`lift flex min-h-[52px] items-center gap-2.5 rounded-[14px] border px-4 py-3.5 text-left text-sm font-semibold ${
        attivo
          ? "border-accento bg-accento text-crema"
          : "border-bordo bg-white text-inchiostro"
      }`}
      {...props}
    >
      {children}
    </button>
  );
}

function BottoneAvanti({ children, ...props }) {
  return (
    <button
      type="button"
      className="lift rounded-full bg-scuro px-7.5 py-3.5 font-bold text-crema disabled:opacity-40"
      {...props}
    >
      {children}
    </button>
  );
}

function BottoneIndietro(props) {
  return (
    <button
      type="button"
      className="lift rounded-full border border-bordo bg-white px-6 py-3.5 font-bold text-inchiostro-soft"
      {...props}
    >
      Indietro
    </button>
  );
}

export default function Configuratore({ brand, capricci }) {
  const [step, setStep] = useState(1);
  const [modulo, setModulo] = useState({
    capriccio: null,
    capriccioLibero: "",
    famiglia: null,
    animale: null,
    nome: "",
    genere: "bimbo",
    eta: "4",
    mamma: "",
    papa: "",
    dettaglio: "",
  });
  const [cartaceo, setCartaceo] = useState({ scelto: null, formato: "brossura" });
  const [caricamento, setCaricamento] = useState(false);
  const [errore, setErrore] = useState(null);
  const [storia, setStoria] = useState(null);

  const aggiorna = (campo) => (evento) =>
    setModulo((precedente) => ({ ...precedente, [campo]: evento.target.value }));

  const capriccioScelto = capricci.find((c) => c.id === modulo.capriccio);
  const nomePulito = modulo.nome.trim();

  const titoloCopertina = componiTitolo(capriccioScelto, nomePulito || "…");
  const iniziale = (nomePulito[0] || "A").toUpperCase();

  const step1Completo =
    Boolean(modulo.capriccio) &&
    (modulo.capriccio !== "altro" || modulo.capriccioLibero.trim().length > 0);
  const step2Completo =
    Boolean(modulo.famiglia) && (modulo.famiglia !== "animali" || Boolean(modulo.animale));
  const puoGenerare = step1Completo && step2Completo && nomePulito.length > 0;

  async function genera() {
    if (!puoGenerare || caricamento) return;

    setCaricamento(true);
    setErrore(null);
    setStoria(null);

    try {
      const risposta = await fetch("/api/storie/anteprima", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...modulo, brand: brand.slug }),
      });

      const dati = await risposta.json();
      if (!risposta.ok) {
        throw new Error(dati.errore ?? "Generazione fallita");
      }

      setStoria(dati.storia);
      // Lasciamo al browser il tempo di montare la sezione prima di scrollarci.
      requestAnimationFrame(() => {
        document.getElementById("anteprima")?.scrollIntoView({ behavior: "smooth" });
      });
    } catch (problema) {
      setErrore(problema.message);
    } finally {
      setCaricamento(false);
    }
  }

  return (
    <>
      <section
        id="configuratore"
        className="flex min-h-svh snap-start flex-col justify-center bg-sabbia bg-[url('/illustrazioni/doodle-cielo.svg')] bg-[length:min(180px,22vw)] bg-[right_4%_top_10%] bg-no-repeat px-4 py-[clamp(32px,4vw,56px)]"
      >
        <div className="mx-auto w-full max-w-[920px] rounded-pannello border border-bordo bg-white p-[clamp(24px,4.5vw,44px)] shadow-[0_24px_60px_-20px_rgba(67,48,42,0.14)]">
          <h2 className="text-center font-display text-[clamp(1.5rem,3vw,1.9rem)] font-semibold">
            Il libro si scrive mentre lo componi
          </h2>

          {/* Stepper */}
          <div className="my-7 flex justify-center" aria-hidden="true">
            {[1, 2, 3].map((numero, indice) => (
              <div key={numero} className="flex items-center">
                {indice > 0 && (
                  <span
                    className={`mx-1.5 h-0.5 w-8 ${step > indice ? "bg-accento" : "bg-bordo"}`}
                  />
                )}
                <span className="flex flex-col items-center gap-1.5">
                  <span
                    className={`flex h-8.5 w-8.5 items-center justify-center rounded-full font-display text-sm font-bold transition-colors ${
                      step >= numero
                        ? "bg-accento text-crema"
                        : "bg-crema-scura text-inchiostro-tenue"
                    }`}
                  >
                    {numero}
                  </span>
                  <span
                    className={`text-[11px] font-bold tracking-[0.06em] uppercase ${
                      step >= numero ? "text-inchiostro" : "text-inchiostro-lieve"
                    }`}
                  >
                    {ETICHETTE_STEP[indice]}
                  </span>
                </span>
              </div>
            ))}
          </div>

          <div className="grid items-start gap-9 md:grid-cols-[1fr_auto]">
            <div>
              {step === 1 && (
                <div className="anim-pop">
                  <p className="mb-4 text-[1.1rem] font-bold">Quale capriccio vuoi risolvere?</p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
                    {capricci.map((capriccio) => {
                      const attivo = modulo.capriccio === capriccio.id;
                      return (
                        <Chip
                          key={capriccio.id}
                          attivo={attivo}
                          onClick={() =>
                            setModulo((precedente) => ({
                              ...precedente,
                              capriccio: capriccio.id,
                            }))
                          }
                        >
                          <span
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              attivo ? "bg-crema" : "bg-accento-soft"
                            }`}
                          />
                          <span>{capriccio.label}</span>
                        </Chip>
                      );
                    })}
                  </div>

                  {modulo.capriccio === "altro" && (
                    <input
                      className={`${classiInput} mt-3.5 w-full`}
                      placeholder="Raccontacelo tu: es. non vuole lavarsi i denti…"
                      value={modulo.capriccioLibero}
                      onChange={aggiorna("capriccioLibero")}
                    />
                  )}

                  <div className="mt-6">
                    <BottoneAvanti disabled={!step1Completo} onClick={() => setStep(2)}>
                      Avanti
                    </BottoneAvanti>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="anim-pop">
                  <p className="mb-4 text-[1.1rem] font-bold">
                    Come vuoi rappresentare la famiglia?
                  </p>
                  <div className="mb-4 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5">
                    <Chip
                      attivo={modulo.famiglia === "umani"}
                      onClick={() =>
                        setModulo((p) => ({ ...p, famiglia: "umani", animale: null }))
                      }
                    >
                      <span className="block">
                        <span className="block font-display text-[1.05rem]">Come siamo noi</span>
                        <span className="opacity-75">Personaggi umani con i vostri nomi</span>
                      </span>
                    </Chip>
                    <Chip
                      attivo={modulo.famiglia === "animali"}
                      onClick={() => setModulo((p) => ({ ...p, famiglia: "animali" }))}
                    >
                      <span className="block">
                        <span className="block font-display text-[1.05rem]">
                          Famiglia di animali
                        </span>
                        <span className="opacity-75">Teneri animali del bosco</span>
                      </span>
                    </Chip>
                  </div>

                  {modulo.famiglia === "animali" && (
                    <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                      {ANIMALI.map((animale) => (
                        <Chip
                          key={animale.id}
                          attivo={modulo.animale === animale.id}
                          onClick={() => setModulo((p) => ({ ...p, animale: animale.id }))}
                        >
                          {animale.plurale}
                        </Chip>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex gap-3">
                    <BottoneIndietro onClick={() => setStep(1)} />
                    <BottoneAvanti disabled={!step2Completo} onClick={() => setStep(3)}>
                      Avanti
                    </BottoneAvanti>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="anim-pop">
                  <p className="mb-4 text-[1.1rem] font-bold">Presenta i protagonisti</p>
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                    <input
                      className={classiInput}
                      placeholder="Nome del bambino/a *"
                      value={modulo.nome}
                      onChange={aggiorna("nome")}
                    />
                    <div className="flex gap-2">
                      <select
                        className={`${classiInput} flex-1`}
                        value={modulo.genere}
                        onChange={aggiorna("genere")}
                        aria-label="Genere"
                      >
                        <option value="bimbo">Bimbo</option>
                        <option value="bimba">Bimba</option>
                      </select>
                      <select
                        className={`${classiInput} flex-1`}
                        value={modulo.eta}
                        onChange={aggiorna("eta")}
                        aria-label="Età"
                      >
                        {[2, 3, 4, 5, 6, 7].map((anni) => (
                          <option key={anni} value={anni}>
                            {anni} anni
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      className={classiInput}
                      placeholder="Nome della mamma"
                      value={modulo.mamma}
                      onChange={aggiorna("mamma")}
                    />
                    <input
                      className={classiInput}
                      placeholder="Nome del papà"
                      value={modulo.papa}
                      onChange={aggiorna("papa")}
                    />
                    <input
                      className={`${classiInput} col-span-full`}
                      placeholder="Cosa adora? (es. la pasta al pesto, i dinosauri…)"
                      value={modulo.dettaglio}
                      onChange={aggiorna("dettaglio")}
                    />
                  </div>

                  {brand.mostraPrezzi && (
                    <div className="mt-8 rounded-[18px] border border-dashed border-accento bg-accento/5 p-5.5">
                      <p className="mb-1.5 text-[1.05rem] font-bold text-accento">
                        Vuoi anche la copia cartacea?
                      </p>
                      <p className="mb-4 leading-relaxed font-medium text-inchiostro-soft">
                        Aggiungi un bellissimo libro illustrato{" "}
                        <strong>stampato e spedito a casa</strong> — perfetto come ricordo della
                        storia.
                      </p>
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[220px] flex-1">
                          <label
                            htmlFor="formato-cartaceo"
                            className="mb-2 block text-[0.9rem] font-semibold"
                          >
                            Scegli formato:
                          </label>
                          <select
                            id="formato-cartaceo"
                            className={`${classiInput} w-full bg-white py-2.5 text-sm`}
                            value={cartaceo.formato}
                            onChange={(evento) =>
                              setCartaceo((p) => ({ ...p, formato: evento.target.value }))
                            }
                          >
                            <option value="brossura">
                              {LISTINO.brossura.etichetta} (copertina morbida) —{" "}
                              {formattaPrezzo(LISTINO.brossura.prezzoCents)}
                            </option>
                            <option value="rilegato">
                              {LISTINO.rilegato.etichetta} (copertina rigida) —{" "}
                              {formattaPrezzo(LISTINO.rilegato.prezzoCents)}
                            </option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => setCartaceo((p) => ({ ...p, scelto: true }))}
                          className="lift rounded-full bg-accento px-5.5 py-2.5 text-sm font-bold text-crema"
                        >
                          Sì, aggiungi!
                        </button>
                        <button
                          type="button"
                          onClick={() => setCartaceo((p) => ({ ...p, scelto: false }))}
                          className="lift rounded-full border border-bordo bg-white px-5.5 py-2.5 text-sm font-bold text-inchiostro-soft"
                        >
                          Solo eBook
                        </button>
                      </div>

                      {cartaceo.scelto === true && (
                        <p className="anim-pop mt-4 rounded-[14px] bg-white p-4 text-sm font-semibold text-inchiostro-soft">
                          L&apos;indirizzo di spedizione te lo chiediamo al checkout, dopo che hai
                          visto l&apos;anteprima. Consegna in 5-8 giorni lavorativi.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <BottoneIndietro onClick={() => setStep(2)} />
                    <button
                      type="button"
                      onClick={genera}
                      disabled={!puoGenerare || caricamento}
                      className="lift rounded-full bg-accento px-8 py-4 text-[1.05rem] font-bold text-crema shadow-[0_10px_24px_rgba(233,109,79,0.3)] disabled:opacity-40"
                    >
                      {caricamento ? "Stiamo scrivendo…" : "Genera l'anteprima gratis"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="hidden md:block">
              <CopertinaLive
                titolo={titoloCopertina}
                iniziale={iniziale}
                nomeBrand={brand.nome}
              />
              <p className="mt-3 text-center text-xs font-bold text-inchiostro-tenue">
                Anteprima copertina dal vivo
              </p>
            </div>
          </div>

          {caricamento && (
            <div className="mt-8 flex items-center justify-center gap-3" role="status">
              <span className="anim-spinny inline-block h-5.5 w-5.5 rounded-full border-3 border-bordo border-t-accento" />
              <span className="font-semibold text-inchiostro-soft">
                Stiamo scrivendo la storia di {nomePulito || "tuo figlio"}…
              </span>
            </div>
          )}

          {errore && (
            <p className="mt-6 rounded-[14px] bg-accento/10 p-4 text-center font-semibold text-accento">
              {errore}
            </p>
          )}
        </div>
      </section>

      {storia && (
        <div id="anteprima">
          <AnteprimaStoria
            storia={storia}
            nome={nomePulito}
            mostraPrezzi={brand.mostraPrezzi}
          />
        </div>
      )}
    </>
  );
}
