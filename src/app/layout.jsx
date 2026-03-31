import { Rubik } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import MainFooterWrapper from "@/components/template/FooterClientWrapper";
import MainHeaderWrapper from "@/components/template/MainHeaderWrapper";
import ScriptInjector from "@/components/ScriptInjector";
import UtmTracker from "@/components/UtmTracker";
import AffiliateRefCapture from "@/components/AffiliateRefCapture";
import TrackingCapture from "@/components/tracking/TrackingCapture";
import SpinWheelProvider from "@/components/SpinWheel/SpinWheelProvider";
import GiftSystemInit from "@/components/GiftSystem/GiftSystemInit";
import { getStoreSettings } from "@/lib/getStoreSettings";
import { Suspense, cache } from "react";
import prisma from "@/lib/prisma";
import { UI_DEFAULTS } from "@/lib/ui-defaults";

// React.cache() deduplicates the DB call so generateMetadata and RootLayout
// share ONE result per request — no double DB round-trip.
const getCachedStoreSettings = cache(getStoreSettings);

// Rubik supports both Latin and Arabic scripts — load both subsets
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "600", "700"],
});

// Generate metadata dynamically from store settings
export async function generateMetadata() {
  const settings = await getCachedStoreSettings();
  
  return {
    title: settings?.storeName || "Shop Gold - Online Shopping Experience",
    description: settings?.websiteDescription || "Shop Gold is a modern online shopping experience built with Next.js",
    icons: {
      icon: settings?.faviconImage || "/favicon.ico",
    },
  };
}

async function getUISettings() {
  try {
    const rows = await prisma.uIControlSetting.findMany();
    const result = { ...UI_DEFAULTS };
    for (const row of rows) {
      try { result[row.key] = JSON.parse(row.value); } catch { result[row.key] = row.value; }
    }
    return result;
  } catch {
    return UI_DEFAULTS;
  }
}

export default async function RootLayout({ children }) {
  // Both calls hit the cache — only ONE DB round-trip total
  const [initialUISettings, initialStoreSettings] = await Promise.all([
    getUISettings(),
    getCachedStoreSettings(),
  ]);
  return (
    // suppressHydrationWarning: LanguageProvider updates lang/dir client-side
    // Default to Arabic (RTL) — matches the default language setting
    <html lang="ar" dir="rtl" className={rubik.variable} suppressHydrationWarning>
      <head>
        {/*
          Blocking inline script — runs synchronously before the body renders.
          Reads the saved language from localStorage and writes it onto <html>
          as a data-lang attribute. LanguageContext reads this attribute in its
          lazy useState initializer, so the very first client render uses the
          correct language instead of the Arabic default.
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var l = localStorage.getItem('store_lang');
              if (l === 'fr' || l === 'ar') {
                var h = document.documentElement;
                h.setAttribute('data-lang', l);
                h.setAttribute('lang', l);
                h.setAttribute('dir', l === 'ar' ? 'rtl' : 'ltr');
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="antialiased">
        <Providers initialUISettings={initialUISettings}>
          <AffiliateRefCapture />
          <UtmTracker />
          <Suspense fallback={null}><TrackingCapture /></Suspense>
          <ScriptInjector />
          <MainHeaderWrapper storeSettings={initialStoreSettings} />
          {children}
          <MainFooterWrapper />
          <SpinWheelProvider />
          <GiftSystemInit />
        </Providers>
      </body>
    </html>
  );
}
