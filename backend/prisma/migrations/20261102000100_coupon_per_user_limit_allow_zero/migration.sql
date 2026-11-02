-- perUserLimit = 0 means "no per-user limit" (admin form allows 0; coupons.ts treats 0 as unlimited).
ALTER TABLE "coupons" DROP CONSTRAINT IF EXISTS "coupons_perUserLimit_positive";
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_perUserLimit_positive" CHECK ("perUserLimit" >= 0);
