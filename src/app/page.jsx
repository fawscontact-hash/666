"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";

// ── Critical above-fold (loaded immediately) ──────────────────────────────────
import Slider   from "@/components/Slider/Slider";
import ProductGrid from "@/components/Product/ProductGrid";

// ── Below-fold (lazy loaded — don't block initial render) ─────────────────────
const HomeSectionRenderer   = dynamic(() => import("@/components/HomeBuilder/HomeSectionRenderer"), { ssr: false });
const SliderCollection      = dynamic(() => import("@/components/Colleaction/SliderCollection"), { ssr: false });
const HomeCollectionSections = dynamic(() => import("@/components/Colleaction/HomeCollectionSections"), { ssr: false });
const VideoReels            = dynamic(() => import("@/components/VideoReels"), { ssr: false });
const SupportBenefits       = dynamic(() => import("@/components/SupportBenefits"), { ssr: false });
const HomeFeedbackSection   = dynamic(() => import("@/components/HomeFeedbackSection"), { ssr: false });

function DefaultHome({ topOfferBanner }) {
  return (
    <div className="pb-10 space-y-10 md:space-y-16">
      {topOfferBanner?.image && (
        <a href={topOfferBanner.url || "#"} className="block">
          <img className="w-full md:h-[80px]" src={topOfferBanner.image} alt={topOfferBanner.title || "Top Offer"} />
        </a>
      )}
      <div className="px-2 sm:px-4"><Slider /></div>
      <SliderCollection />
      <div className="px-4"><ProductGrid /></div>
      <HomeCollectionSections />
      <VideoReels />
      <SupportBenefits />
      <HomeFeedbackSection />
    </div>
  );
}

export default function Home() {
  const [topOfferBanner, setTopOfferBanner] = useState(null);
  const [layout, setLayout] = useState(undefined); // undefined=loading, null=none, array=custom

  useEffect(() => {
    // Both fetches in parallel — no waterfall
    Promise.all([
      fetch("/api/data?collection=top-offer-banner", { next: { revalidate: 300 } })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []),
      fetch("/api/setting?type=homepage_layout", { next: { revalidate: 60 } })
        .then(r => r.ok ? r.json() : {})
        .catch(() => {}),
    ]).then(([bannerData, layoutData]) => {
      if (bannerData.length > 0) setTopOfferBanner(bannerData[0]);
      setLayout(Array.isArray(layoutData?.sections) && layoutData.sections.length > 0 ? layoutData.sections : null);
    });
  }, []);

  // While fetching layout, show skeleton to avoid blank screen
  if (layout === undefined) return <div className="min-h-screen" />;

  // Custom layout saved → use it
  if (layout !== null) return <HomeSectionRenderer />;

  // No custom layout → fallback
  return <DefaultHome topOfferBanner={topOfferBanner} />;
}
