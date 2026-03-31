"use client";

/**
 * HomepageContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches /api/homepage ONCE and distributes ALL homepage data to every
 * component that needs it — zero duplicate network requests.
 *
 * Before: 6+ separate fetch calls (products, collections, slider, promo,
 *         banner, menu, settings, layout) = ~16 total requests
 * After : 1 fetch to /api/homepage = 1 request, everything cached 60s
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";

const EMPTY = {
  products:       [],
  collections:    [],
  sliderImages:   [],
  promoTexts:     [],
  topOfferBanner: null,
  menuItems:      [],
  storeSettings:  {},
  homepageLayout: null,
  loading:        true,
  error:          null,
};

const HomepageContext = createContext(EMPTY);

export function HomepageProvider({ children }) {
  const [state, setState] = useState(EMPTY);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch("/api/homepage", { next: { revalidate: 60 } })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.statusText)))
      .then((data) =>
        setState({
          products:       data.products       ?? [],
          collections:    data.collections    ?? [],
          sliderImages:   data.sliderImages   ?? [],
          promoTexts:     data.promoTexts     ?? [],
          topOfferBanner: data.topOfferBanner ?? null,
          menuItems:      data.menuItems      ?? [],
          storeSettings:  data.storeSettings  ?? {},
          homepageLayout: data.homepageLayout ?? null,
          loading:        false,
          error:          null,
        })
      )
      .catch((err) => {
        console.error("[HomepageContext] fetch error:", err);
        setState((prev) => ({ ...prev, loading: false, error: String(err) }));
      });
  }, []);

  return (
    <HomepageContext.Provider value={state}>
      {children}
    </HomepageContext.Provider>
  );
}

export function useHomepage() {
  return useContext(HomepageContext);
}
