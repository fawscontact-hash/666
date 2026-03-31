"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useHomepage } from "@/context/HomepageContext";

// ── Critical above-fold (loaded immediately) ──────────────────────────────────
import Slider     from "@/components/Slider/Slider";
import ProductGrid from "@/components/Product/ProductGrid";

// ── Below-fold (lazy loaded) ──────────────────────────────────────────────────
const HomeSectionRenderer    = dynamic(() => import("@/components/HomeBuilder/HomeSectionRenderer"), { ssr: false });
const SliderCollection       = dynamic(() => import("@/components/Colleaction/SliderCollection"), { ssr: false });
const HomeCollectionSections = dynamic(() => import("@/components/Colleaction/HomeCollectionSections"), { ssr: false });
const VideoReels             = dynamic(() => import("@/components/VideoReels"), { ssr: false });
const SupportBenefits        = dynamic(() => import("@/components/SupportBenefits"), { ssr: false });
const HomeFeedbackSection    = dynamic(() => import("@/components/HomeFeedbackSection"), { ssr: false });

function DefaultHome({ topOfferBanner }) {
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
  // All data comes from a single /api/homepage fetch — no individual fetches here
  const { topOfferBanner, homepageLayout, loading } = useHomepage();

  // While loading, show empty shell (avoids blank screen flash)
  if (loading) return <div className="min-h-screen" />;

  // Custom layout saved → use homepage builder
  if (homepageLayout !== null) return <HomeSectionRenderer />;

  // Default layout
  return <DefaultHome topOfferBanner={topOfferBanner} />;
}
