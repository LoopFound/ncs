"use client";

import { Suspense } from "react";
import ProductListing from "@/components/shop/ProductListing";

export default function DupattasPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--ivory)]" />}>
            <ProductListing initialCategory="Dupattas" />
        </Suspense>
    );
}
