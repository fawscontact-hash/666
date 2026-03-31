"use client";
import React from "react";
import Header from "./Header";
import { usePathname } from "next/navigation";

// storeSettings is passed from layout.jsx (Server Component) so the Header
// can render the logo on the very first paint — no context fetch needed.
const MainHeader = ({ storeSettings = null }) => {
  const pathname = usePathname();

  if (pathname === "/admin" || pathname === "/login" || pathname.startsWith("/admin/")) {
    return null;
  }

  return <Header initialStoreSettings={storeSettings} />;
};

export default MainHeader;
