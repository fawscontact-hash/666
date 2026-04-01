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
import { cookies } from "next/headers";

const SUPPORTED_LANGS = ["ar", "fr"];
const DEFAULT_LANG    = "ar";

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
  // Read the language cookie so the server renders in the correct language.
  // This eliminates the Arabic→French flicker: the HTML response already
  // contains French text, so React's first client render matches exactly.
  const cookieStore    = await cookies();
  const cookieLang     = cookieStore.get("store_lang")?.value;
  const initialLang    = SUPPORTED_LANGS.includes(cookieLang) ? cookieLang : DEFAULT_LANG;
  const initialDir     = initialLang === "ar" ? "rtl" : "ltr";

  // Both calls hit the cache — only ONE DB round-trip total
  const [initialUISettings, initialStoreSettings] = await Promise.all([
    getUISettings(),
    getCachedStoreSettings(),
  ]);
  return (
    // suppressHydrationWarning: kept as safety net for the one-time case where
    // cookie doesn't exist yet and the inline script corrects lang/dir client-side.
    <html lang={initialLang} dir={initialDir} className={rubik.variable} suppressHydrationWarning>
      <head>
        {/*
          Blocking inline script — runs synchronously before any paint.
          PRIMARY JOB: sync localStorage → cookie so the NEXT server request
          renders in the correct language (handles the first-visit gap when
          no cookie exists yet but localStorage has the user's preference).
          SECONDARY JOB: keep data-lang / lang / dir correct for the current
          request as a safety net.
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
                // Sync to cookie — server reads this on the NEXT request
                document.cookie = 'store_lang=' + l + '; path=/; max-age=31536000; SameSite=Lax';
              }
            } catch(e) {}
          })();
        `}} />
      </head>
      <body className="antialiased">
        <Providers initialUISettings={initialUISettings} initialLang={initialLang}>
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
