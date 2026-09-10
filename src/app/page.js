import BrandTheme from "@/components/BrandTheme";
import Configurator from "@/components/Configurator";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Method from "@/components/Method";
import Pricing from "@/components/Pricing";
import { resolveBrand, slugFromSearchParams } from "@/lib/brand/resolve";
import { WHIMS } from "@/lib/domain/whims";

export default async function Home({ searchParams }) {
  // Next 16: searchParams is a Promise.
  const params = await searchParams;
  const brand = await resolveBrand(slugFromSearchParams(params));

  // A merchant can offer only a subset of whims.
  const whims = brand.whims ? WHIMS.filter((whim) => brand.whims.includes(whim.id)) : WHIMS;

  return (
    <BrandTheme brand={brand}>
      <Hero brand={brand} />
      <HowItWorks />
      <Configurator brand={brand} whims={whims} />
      <Method />
      {brand.showPrices && <Pricing />}
      <Footer brand={brand} />
    </BrandTheme>
  );
}
