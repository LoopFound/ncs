// Money helpers shared by client and server. All amounts are integer paise.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** 4550000 → "₹45,500" (paise are shown only when non-zero). */
export function formatINR(paise: number): string {
  return inr.format(paise / 100);
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** GST contained in a GST-inclusive amount. rateBps: 500 = 5%. */
export function includedGst(grossPaise: number, rateBps: number): number {
  if (rateBps <= 0) return 0;
  return Math.round((grossPaise * rateBps) / (10_000 + rateBps));
}

export function formatGstRate(rateBps: number): string {
  return `${(rateBps / 100).toFixed(rateBps % 100 === 0 ? 0 : 2)}%`;
}
