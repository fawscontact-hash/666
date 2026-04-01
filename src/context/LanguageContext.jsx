"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import ar from "@/locales/ar.json";
import fr from "@/locales/fr.json";

const translations = { ar, fr };

const SUPPORTED_LANGS = ["ar", "fr"];
const DEFAULT_LANG = "ar";
const STORAGE_KEY = "store_lang";

const LanguageContext = createContext(null);

export function LanguageProvider({ children, initialLang = DEFAULT_LANG }) {
  /**
   * Lazy initializer — runs once per render environment:
   *   Server: window is undefined → return initialLang (from cookie via layout.jsx)
   *   Client: the blocking inline script in <head> has already written data-lang
   *           onto <html>, so we read the correct language synchronously here.
   *           This means the very first client render uses the correct language.
   *
   * initialLang comes from the server reading the `store_lang` cookie, so the
   * server-rendered HTML and the first client render both use the same language
   * — React finds no mismatch and never re-renders the text.
   */
  const [lang, setLangState] = useState(() => {
    if (typeof window === "undefined") return initialLang; // server: use cookie value
    const fromDom = document.documentElement.getAttribute("data-lang");
    if (fromDom && SUPPORTED_LANGS.includes(fromDom)) return fromDom;
    // Fallback: read localStorage directly (handles missing inline script)
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch {}
    return initialLang; // fallback to server-provided value
  });

  // mounted: false on server, true immediately after first client render.
  // useEffect (not layout) is fine here — we only need it for downstream
  // consumers that want to know "are we on the client yet".
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Sync HTML attributes and persist whenever lang changes
  useEffect(() => {
    if (!mounted) return;
    const dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.setAttribute("data-lang", lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang, mounted]);

  const setLang = useCallback((newLang) => {
    if (SUPPORTED_LANGS.includes(newLang)) {
      setLangState(newLang);
      // Persist to cookie so the SERVER can read it on the next request and
      // render the correct language from the very first byte — no flicker.
      try {
        document.cookie = `store_lang=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
    }
  }, []);

  /**
   * Translate a key. Falls back to the key itself if not found.
   * Usage: t("add_to_cart")  →  "أضف إلى السلة" (ar) or "Ajouter au panier" (fr)
   *
   * WHY initialLang instead of DEFAULT_LANG in the mounted guard:
   *   Before this fix, the guard was `mounted ? lang : DEFAULT_LANG`.
   *   DEFAULT_LANG is always "ar", so the server rendered Arabic and the first
   *   client render also returned Arabic — they matched but were wrong for French
   *   users.  After useEffect set mounted=true, t() switched to French → FLICKER.
   *
   *   Now initialLang = the language from the cookie (e.g. "fr").
   *   Server renders French.  First client render also uses initialLang="fr".
   *   They match.  After useEffect, mounted=true and lang="fr" → still French.
   *   Zero flicker.
   */
  const t = useCallback(
    (key) => {
      const effectiveLang = mounted ? lang : initialLang;
      return translations[effectiveLang]?.[key] ?? translations[DEFAULT_LANG]?.[key] ?? key;
    },
    [lang, mounted, initialLang]
  );

  /**
   * Format a price in Moroccan Dirham.
   * Arabic → "120 درهم"   French → "120 DH"
   */
  const formatPrice = useCallback(
    (amount) => {
      const num = Number(amount) ?? 0;
      const formatted = Number.isInteger(num) ? num : num.toFixed(2);
      const effectiveLang = mounted ? lang : initialLang;
      if (effectiveLang === "ar") return `${formatted} درهم`;
      return `${formatted} DH`;
    },
    [lang, mounted, initialLang]
  );

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir, formatPrice, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access the language context.
 * Safe to call outside the provider — returns sensible Arabic defaults.
 */
export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: DEFAULT_LANG,
      dir: "rtl",
      t: (key) => translations[DEFAULT_LANG]?.[key] ?? key,
      formatPrice: (amount) => `${Number(amount) ?? 0} درهم`,
      setLang: () => {},
      mounted: false,
    };
  }
  return ctx;
}
