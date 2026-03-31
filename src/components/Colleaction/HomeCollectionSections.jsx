/**
 * HomeCollectionSections — Server Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Receives pre-fetched products + collections from page.jsx.
 * Renders full collection grids as static HTML on the server.
 * ZERO client JS for this file — no useEffect, no fetch, no context.
 *
 * BEFORE: fetch("/api/collection") + fetch("/api/product") on client → blank
 * AFTER:  props from server → HTML collections in initial response
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Link from "next/link";
import ProductCardClient from "@/components/Product/ProductCardClient";

// ── Product Card (server shell + client island) ───────────────────────────────

// For collection sections we reuse the same interactive card
function CollectionProductCard({ product }) {
  return <ProductCardClient product={product} />;
}

// ── Single collection section ─────────────────────────────────────────────────

function CollectionSection({ collection, allProducts }) {
  const limit    = collection.homepageProductLimit || 4;
  const products = allProducts
    .filter((p) =>
      Array.isArray(p.collections) &&
      p.collections.some((c) => c.toLowerCase() === collection.title.toLowerCase())
    )
    .slice(0, limit);

  return (
    <section className="md:mt-16 mt-10">
      <div className="max-w-7xl mx-auto px-4 mb-6 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{collection.title}</h2>
        {collection.description && (
          <p className="text-sm text-gray-500 mt-1">{collection.description}</p>
        )}
      </div>

      {products.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-sm text-gray-400 italic">
            No products assigned to &quot;{collection.title}&quot; yet.
          </p>
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
              {products.map((product) => (
                <CollectionProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          </div>
          <div className="flex justify-center mt-8">
            <Link
              href={`/products?collection=${encodeURIComponent(collection.title)}`}
              className="px-8 py-2 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors"
            >
              Voir plus
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

// ── Named export: used by HomeSectionRenderer for specific collection ─────────

export function SingleCollectionSection({
  collectionTitle,
  collectionId,
  productLimit = 8,
  customTitle = "",
  showViewMore = true,
  products = [],
  collections = [],
}) {
  const collection = collections.find((c) =>
    (collectionId && (c._id || c.id) === collectionId) ||
    (collectionTitle && c.title?.toLowerCase() === collectionTitle?.toLowerCase())
  );

  if (!collection) return null;

  const filtered = products
    .filter((p) =>
      Array.isArray(p.collections) &&
      p.collections.some((c) => c.toLowerCase() === collection.title.toLowerCase())
    )
    .slice(0, productLimit);

  const heading = customTitle || collection.title;

  return (
    <section>
      <div className="max-w-7xl mx-auto px-4 mb-6 text-center">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{heading}</h2>
        {collection.description && (
          <p className="text-sm text-gray-500 mt-1">{collection.description}</p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-sm text-gray-400 italic">
            No products assigned to &quot;{collection.title}&quot; yet.
          </p>
        </div>
      ) : (
        <>
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-4">
              {filtered.map((product) => (
                <CollectionProductCard key={product._id || product.id} product={product} />
              ))}
            </div>
          </div>
          {showViewMore && (
            <div className="flex justify-center mt-8">
              <Link
                href={`/products?collection=${encodeURIComponent(collection.title)}`}
                className="px-8 py-2 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-gray-700 transition-colors"
              >
                Voir plus
              </Link>
            </div>
          )}
        </>
      )}
    </section>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function HomeCollectionSections({ products = [], collections = [] }) {
  if (!collections.length) return null;

  return (
    <>
      {collections.map((col) => (
        <div key={col._id || col.id}>
          <CollectionSection
            collection={col}
            allProducts={products}
          />
        </div>
      ))}
    </>
  );
}
