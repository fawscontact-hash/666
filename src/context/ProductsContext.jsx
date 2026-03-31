"use client";

/**
 * ProductsContext
 * ─────────────────────────────────────────────────────────────────────────────
 * Fetches /api/product ONCE for the whole app — no more 5x duplicate calls.
 * Any component that needs products just calls useProducts() instead of fetch.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createContext, useContext, useEffect, useRef, useState } from "react";

const ProductsContext = createContext([]);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetch("/api/product", { next: { revalidate: 60 } })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <ProductsContext.Provider value={products}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
