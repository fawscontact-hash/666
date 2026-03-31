"use client";

/**
 * UIControlContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches all UI control settings from /api/ui-control once on mount.
 * Provides a flat settings object to the entire app via context.
 * Falls back to safe defaults while loading or on error.
 *
 * Usage:
 *   const ui = useUIControl();
 *   if (!ui.showWishlistButton) return null;
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { UI_DEFAULTS } from "@/lib/ui-defaults";

export { UI_DEFAULTS };

const UIControlContext = createContext({
  ...UI_DEFAULTS,
  _loaded: false,
  reload:  () => {},
});

export function UIControlProvider({ children, initialSettings = null }) {
  // If the server passed initialSettings (via layout.jsx), start _loaded: true → zero flicker.
  // Otherwise fall back to all-true defaults and let the client fetch real values.
  const [settings, setSettings] = useState(() =>
    initialSettings
      ? { ...UI_DEFAULTS, ...initialSettings, _loaded: true }
      : { ...UI_DEFAULTS, _loaded: false }
  );

  const reload = useCallback(() => {
    fetch("/api/ui-control")
      .then((r) => r.json())
      .then((data) => setSettings({ ...UI_DEFAULTS, ...data, _loaded: true }))
      .catch(() => setSettings((s) => ({ ...s, _loaded: true })));
  }, []);

  // Only fetch on the client when we didn't receive server-side initial settings
  useEffect(() => {
    if (!initialSettings) reload();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <UIControlContext.Provider value={{ ...settings, reload }}>
      {children}
    </UIControlContext.Provider>
  );
}

/** Hook — use anywhere in the app */
export const useUIControl = () => useContext(UIControlContext);
