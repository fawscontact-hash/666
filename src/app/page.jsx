/**
 * Homepage — Server Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches ALL homepage data directly from the database (no HTTP fetch, no
 * HomepageContext, no blank screen).  Pre-rendered HTML ships to the browser
 * with real content → FCP < 300 ms even on slow mobile connections.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getAllProducts }          from "@/lib/services/productService";
import { getHomepageCollections, getAllCollections } from "@/lib/services/collectionService";
import { getItems }                from "@/lib/services/contentService";
import { getSettings }             from "@/lib/services/settingsService";
// ── Critical above-fold — SSR'd with content ──────────────────────────────────
import Slider                from "@/components/Slider/Slider";
import ProductGrid           from "@/components/Product/ProductGrid";
import HomeCollectionSections from "@/components/Colleaction/HomeCollectionSections";
import SliderCollection      from "@/components/Colleaction/SliderCollection";
import HomeBelowFold         from "@/components/HomeBelowFold";
import HomeSectionRenderer   from "@/components/HomeBuilder/HomeSectionRenderer";

// ISR — page is rebuilt every 60 s in the background (no cold starts for users)
export const revalidate = 60;

export default async function Home() {
  // ONE parallel round-trip to the DB — no HTTP overhead, no network latency
  const [
    products,
    collections,
    allCollections,
    sliderImages,
    promoTexts,
    topOfferItems,
    homepageLayoutSettings,
  ] = await Promise.all([
    getAllProducts().catch(() => []),
    getHomepageCollections().catch(() => []),
    getAllCollections().catch(() => []),
    getItems("slider-image").catch(() => []),
    getItems("promo-text").catch(() => []),
    getItems("top-offer-banner").catch(() => []),
    getSettings("homepage_layout").catch(() => ({})),
  ]);

  // ── Shape the data (same logic as old HomepageContext) ─────────────────────
  const activeSlides = sliderImages
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .filter((s) => s.active !== false);

  const activePromos  = promoTexts.filter((t) => t.status === "Active");
  const topOfferBanner = topOfferItems[0] ?? null;
  const homepageLayout =
    Array.isArray(homepageLayoutSettings?.sections) &&
    homepageLayoutSettings.sections.length > 0
      ? homepageLayoutSettings.sections
      : null;

  // ── Custom homepage builder layout ─────────────────────────────────────────
  if (homepageLayout !== null) {
    return (
      <HomeSectionRenderer
        sections={homepageLayout}
        products={products}
        collections={collections}
        allCollections={allCollections}
        sliderImages={activeSlides}
        promoTexts={activePromos}
      />
    );
  }

  // ── Default layout ─────────────────────────────────────────────────────────
  return (
    <div className="pb-10 space-y-10 md:space-y-16">
      {topOfferBanner?.image && (
        <a href={topOfferBanner.url || "#"} className="block">
          <img
            className="w-full md:h-[80px]"
            src={topOfferBanner.image}
            alt={topOfferBanner.title || "Top Offer"}
          />
        </a>
      )}

      {/* Slider — client (Swiper), but data arrives as props from server */}
      <div className="px-2 sm:px-4">
        <Slider initialImages={activeSlides} initialPromos={activePromos} />
      </div>

      {/* Collection circles — still fetches independently (small payload) */}
      <SliderCollection collections={allCollections} />

      {/* Server Component — HTML with products pre-rendered */}
      <div className="px-4">
        <ProductGrid products={products} />
      </div>

      {/* Server Component — collections + products pre-rendered */}
      <HomeCollectionSections products={products} collections={collections} />

      <HomeBelowFold />
    </div>
  );
}
