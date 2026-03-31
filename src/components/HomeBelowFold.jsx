"use client";

/**
 * HomeBelowFold — Client Component wrapper for below-fold sections
 * ─────────────────────────────────────────────────────────────────────────────
 * `ssr: false` is only allowed inside Client Components.
 * This wrapper is imported by page.jsx (Server Component) — Next.js will
 * render it on the server but lazy-load each section's JS on the client.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import dynamic from "next/dynamic";

const VideoReels          = dynamic(() => import("@/components/VideoReels"),          { ssr: false });
const SupportBenefits     = dynamic(() => import("@/components/SupportBenefits"),     { ssr: false });
const HomeFeedbackSection = dynamic(() => import("@/components/HomeFeedbackSection"), { ssr: false });

export default function HomeBelowFold() {
  return (
    <>
      <VideoReels />
      <SupportBenefits />
      <HomeFeedbackSection />
    </>
  );
}
