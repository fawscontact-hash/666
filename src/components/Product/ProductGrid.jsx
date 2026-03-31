/**
 * ProductGrid — Server Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Receives pre-fetched `products` from page.jsx (Server Component).
 * Renders the full grid HTML on the server — ZERO client JS for this file.
 *
 * Interactive parts (wishlist, add-to-cart) live in ProductCardClient.jsx
 * which is a small "client island" hydrated independently.
 * ─────────────────────────────────────────────────────────────────────────────
 * BEFORE: fetch("/api/product") inside useEffect → blank grid until JS runs
 * AFTER:  products prop from server → HTML grid in initial response
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from "next/link";
import ProductCardClient from "./ProductCardClient";

export default function ProductGrid({ products = [] }) {
  if (!products.length) return null;

  const displayProducts = products.slice(0, 10);
  const hasMore         = products.length > 10;

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Section header */}
      <div className="text-center mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          Produits
        </h1>
        <p className="text-sm text-gray-500">
          Découvrez notre gamme complète de produits
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
        {displayProducts.map((product) => (
          // ProductCardClient = "use client" island inside this server component
          // Next.js SSRs it for initial HTML, then hydrates on client for interactivity
          <ProductCardClient key={product._id || product.id} product={product} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-10">
          <Link
            href="/products"
            className="bg-gray-900 text-white font-medium rounded-2xl px-10 py-2 text-sm inline-block"
          >
            Voir plus
          </Link>
        </div>
      )}
    </div>
  );
}
