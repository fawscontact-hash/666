/**
 * /api/homepage
 * ─────────────────────────────────────────────────────────────────────────────
 * Single aggregated endpoint for all homepage data.
 * Replaces 6+ separate client-side fetch calls with ONE cached request.
 *
 * Returns:
 *   {
 *     products        — active products (mapped, with currency)
 *     collections     — homepage collections (showOnHomepage=true)
 *     sliderImages    — slider slides (active)
 *     promoTexts      — promo bar texts (Active status)
 *     topOfferBanner  — top banner (first item or null)
 *     menuItems       — nav menu items (sorted by position)
 *     storeSettings   — store name, logo, currency, etc.
 *     homepageLayout  — custom homepage builder sections (or null)
 *   }
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse }            from 'next/server';
import { getAllProducts }           from '@/lib/services/productService';
import { getHomepageCollections }  from '@/lib/services/collectionService';
import { getItems }                from '@/lib/services/contentService';
import { getSettings }             from '@/lib/services/settingsService';

export const revalidate = 60; // ISR — rebuild every 60 seconds

export async function GET() {
  try {
    // All DB queries run in PARALLEL — single round-trip to the database
    const [
      products,
      collections,
      sliderImages,
      promoTexts,
      topOfferItems,
      menuItems,
      storeSettings,
      homepageLayoutSettings,
    ] = await Promise.all([
      getAllProducts(),                          // active products + currency
      getHomepageCollections(),                 // homepage collections
      getItems('slider-image'),                 // slider slides
      getItems('promo-text'),                   // promo bar
      getItems('top-offer-banner'),             // top banner
      getItems('menu-item'),                    // nav menu
      getSettings('store'),                     // store info
      getSettings('homepage_layout'),           // custom layout
    ]);

    // Filter & shape the data (same logic as individual components)
    const activeSlides = sliderImages
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((s) => s.active !== false);

    const activePromos = promoTexts.filter((t) => t.status === 'Active');

    const topOfferBanner = topOfferItems.length > 0 ? topOfferItems[0] : null;

    const sortedMenu = [...menuItems].sort(
      (a, b) => (a.position ?? 9999) - (b.position ?? 9999)
    );

    const homepageLayout =
      Array.isArray(homepageLayoutSettings?.sections) &&
      homepageLayoutSettings.sections.length > 0
        ? homepageLayoutSettings.sections
        : null;

    return NextResponse.json({
      products,
      collections,
      sliderImages:     activeSlides,
      promoTexts:       activePromos,
      topOfferBanner,
      menuItems:        sortedMenu,
      storeSettings,
      homepageLayout,
    });
  } catch (err) {
    console.error('[/api/homepage] error:', err);
    return NextResponse.json(
      { error: 'Failed to load homepage data' },
      { status: 500 }
    );
  }
}
