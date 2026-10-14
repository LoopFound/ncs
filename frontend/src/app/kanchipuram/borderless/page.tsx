"use client";

import { Suspense } from "react";
import ProductListing from "@/components/shop/ProductListing";

export default function BorderlessKanchipuramPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--ivory)]" />}>
            <ProductListing initialCategory="Borderless" />
        </Suspense>
    );
}
