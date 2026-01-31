"use client";

import { Suspense } from "react";
import ProductListing from "@/components/shop/ProductListing";

export default function MensCornerPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--ivory)]" />}>
            <ProductListing initialCategory="Men's Corner" />
        </Suspense>
    );
}
