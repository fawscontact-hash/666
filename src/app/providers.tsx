// app/providers.tsx
"use client";

import { HeroUIProvider } from "@heroui/react";
import { CartProvider, useCartDrawer } from "@/hooks/useCart";
import CartDrawer from "@/components/CartDrawer";
import { UIControlProvider } from "@/context/UIControlContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { SettingsProvider } from "@/context/SettingsContext";
import { ProductsProvider } from "@/context/ProductsContext";
import { HomepageProvider } from "@/context/HomepageContext";

function CartDrawerWrapper() {
  const { cartDrawerOpen, setCartDrawerOpen } = useCartDrawer();

  return (
    <CartDrawer
      isOpen={cartDrawerOpen}
      onClose={() => setCartDrawerOpen(false)}
    />
  );
}

export function Providers({
  children,
  initialUISettings,
  initialLang,
}: {
  children: React.ReactNode;
  initialUISettings?: Record<string, unknown>;
  initialLang?: string;
}) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <HeroUIProvider>
        <SettingsProvider>
          <UIControlProvider initialSettings={initialUISettings ?? null}>
            <HomepageProvider>
              <ProductsProvider>
                <CartProvider>
                  {children}
                  <CartDrawerWrapper />
                </CartProvider>
              </ProductsProvider>
            </HomepageProvider>
          </UIControlProvider>
        </SettingsProvider>
      </HeroUIProvider>
    </LanguageProvider>
  );
}
