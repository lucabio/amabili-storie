import ComeFunziona from "@/components/ComeFunziona";
import Configuratore from "@/components/Configuratore";
import Hero from "@/components/Hero";
import Metodo from "@/components/Metodo";
import PiedePagina from "@/components/PiedePagina";
import Prezzi from "@/components/Prezzi";
import TemaBrand from "@/components/TemaBrand";
import { risolviBrand, slugDaSearchParams } from "@/lib/brand/resolve";
import { CAPRICCI } from "@/lib/domain/capricci";

export default async function Home({ searchParams }) {
  // Next 16: searchParams è una Promise.
  const parametri = await searchParams;
  const brand = await risolviBrand(slugDaSearchParams(parametri));

  // Un ente può offrire solo un sottoinsieme di capricci.
  const capricci = brand.capricci
    ? CAPRICCI.filter((c) => brand.capricci.includes(c.id))
    : CAPRICCI;

  return (
    <TemaBrand brand={brand}>
      <Hero brand={brand} />
      <ComeFunziona />
      <Configuratore brand={brand} capricci={capricci} />
      <Metodo />
      {brand.mostraPrezzi && <Prezzi />}
      <PiedePagina brand={brand} />
    </TemaBrand>
  );
}
