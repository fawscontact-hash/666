"use client";

/**
 * ProductCardClient — Interactive island
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the ONLY client-side JS for a product card.
 * It receives a serialised `product` object from the Server Component parent
 * and handles wishlist toggles + add-to-cart — nothing else.
 *
 * The full card HTML (image, title, price, labels) is pre-rendered on the
 * server inside ProductGrid.  This component wraps it and adds interactivity
 * via Hydration without fetching any data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useLanguage } from "@/context/LanguageContext";
import { useDiscountRules } from "@/hooks/useDiscountRules";
import ProductLabel from "@/components/ProductLabel";
import Link from "next/link";

export default function ProductCardClient({ product }) {
  const [inWishlist, setInWishlist] = useState(false);
  const { addToCart }  = useCart();
  const { t, formatPrice } = useLanguage();
  const { getDiscount }    = useDiscountRules();

  // Read wishlist from localStorage after hydration
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
    setInWishlist(saved.some((i) => i.productId === product._id));
  }, [product._id]);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const saved = JSON.parse(localStorage.getItem("wishlist") || "[]");
    let updated;
    if (inWishlist) {
      updated = saved.filter((i) => i.productId !== product._id);
    } else {
      updated = [...saved, {
        productId:    product._id,
        title:        product.title,
        image:        product.images?.[0]?.url || product.images?.[0] || "",
        price:        product.salePrice || product.regularPrice,
        regularPrice: product.regularPrice,
        salePrice:    product.salePrice,
        currency:     "MAD",
        rating:       product.rating,
        productLabel: product.productLabel,
        addedAt:      new Date().toISOString(),
      }];
    }
    localStorage.setItem("wishlist", JSON.stringify(updated));
    setInWishlist(!inWishlist);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      const el = Object.assign(document.createElement("div"), {
        textContent:  `${product.title} — ${t("product_added_to_cart")}`,
        className: "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 transition-opacity",
      });
      document.body.appendChild(el);
      setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 2000);
    } catch {
      /* silent */
    }
  };

  const href        = product.redirectMode === "landing" && product.redirectUrl?.trim()
    ? product.redirectUrl.trim()
    : `/products/${product._id}`;
  const imageUrl    = product.images?.[0]?.url || product.images?.[0] || "https://placehold.co/400x500?text=No+Image";
  const discountRule = getDiscount(product);
  const displayPrice = discountRule ? discountRule.effectivePrice : (product.salePrice || product.regularPrice || 0);
  const originalPrice = discountRule ? discountRule.originalPrice : product.regularPrice;
  const showStrike   = !!(discountRule || (product.salePrice && product.regularPrice));
  const rawCol = Array.isArray(product.collections) ? product.collections[0] : null;
  const colName = typeof rawCol === "string" && rawCol.length > 4 ? rawCol : rawCol?.title || rawCol?.name || null;

  return (
    <div className="bg-white rounded-3xl glass-card border !border-purple-50 p-2 flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
      {/* Image */}
      <a href={href}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 mb-3 aspect-square">
          <img
            src={imageUrl}
            alt={product.title}
            className="absolute inset-0 w-full h-full object-cover object-top"
            loading="lazy"
          />
          {!!product.productLabel && (
            <div className="absolute top-2 left-2">
              <ProductLabel label={product.productLabel} />
            </div>
          )}
          {product.rating > 0 && (
            <div className="absolute bottom-2 left-2 bg-green-600/90 px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="text-xs text-white font-medium">{product.rating}</span>
              <span className="text-xs text-white">★</span>
            </div>
          )}
          {discountRule && (
            <div className="absolute bottom-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              -{discountRule.percentage}%
            </div>
          )}
          {/* Wishlist button */}
          <button
            onClick={toggleWishlist}
            className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all duration-200 hover:scale-110 ${
              inWishlist ? "bg-red-500/90 text-white" : "bg-white/80 text-gray-600 hover:text-red-500"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${inWishlist ? "fill-current" : ""}`} />
          </button>
        </div>
      </a>

      {/* Info */}
      <div className="px-2 pb-2 flex flex-col flex-1">
        {colName && (
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 truncate">
            {colName}
          </p>
        )}
        <a href={href}>
          <h2 className="text-sm font-bold text-gray-900 line-clamp-1 leading-tight">
            {product.title}
          </h2>
        </a>
        {product.shortDescription && (
          <p className="text-xs text-gray-600 line-clamp-1 my-1 leading-normal">
            {product.shortDescription}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 mb-2 flex-wrap">
          <span className="text-lg font-bold text-gray-900">{formatPrice(displayPrice)}</span>
          {showStrike && (
            <span className="text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
