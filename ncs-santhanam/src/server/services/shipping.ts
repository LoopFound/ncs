import { db } from "../db";
import { cached, CacheTags } from "../cache";

export interface ShippingQuote {
  ruleId: string;
  ruleName: string;
  rate: number;
  freeAbove: number | null;
  codAvailable: boolean;
  codFee: number;
  codMaxOrderValue: number;
  etaMinDays: number;
  etaMaxDays: number;
}

export const isValidPincode = (pin: string) => /^[1-9]\d{5}$/.test(pin);

interface RuleRow extends ShippingQuote {
  prefixes: string[];
  priority: number;
}

function activeRules(): Promise<RuleRow[]> {
  return cached("shipping:rules", { ttlSeconds: 300, tags: [CacheTags.settings] }, async () =>
    (await db.shippingRule.findMany({ where: { isActive: true } })).map((r) => ({
      ruleId: r.id,
      ruleName: r.name,
      rate: r.rate,
      freeAbove: r.freeAbove,
      codAvailable: r.codAvailable,
      codFee: r.codFee,
      codMaxOrderValue: r.codMaxOrderValue,
      etaMinDays: r.etaMinDays,
      etaMaxDays: r.etaMaxDays,
      prefixes: r.pincodePrefixes,
      priority: r.priority,
    })),
  );
}

/** Picks the most specific matching rule (longest PIN prefix, then priority). Null = not serviceable. */
export function pickRule<T extends { prefixes: string[]; priority: number }>(rules: T[], pincode: string): T | null {
  let best: { rule: T; specificity: number } | null = null;
  for (const rule of rules) {
    const specificity = rule.prefixes.length === 0 ? 0 : Math.max(-1, ...rule.prefixes.filter((p) => pincode.startsWith(p)).map((p) => p.length));
    if (specificity < 0) continue;
    if (!best || specificity > best.specificity || (specificity === best.specificity && rule.priority > best.rule.priority)) {
      best = { rule, specificity };
    }
  }
  return best?.rule ?? null;
}

export async function quoteShipping(pincode: string): Promise<ShippingQuote | null> {
  if (!isValidPincode(pincode)) return null;
  const rule = pickRule(await activeRules(), pincode);
  if (!rule) return null;
  const { prefixes: _p, priority: _pr, ...quote } = rule;
  return quote;
}
