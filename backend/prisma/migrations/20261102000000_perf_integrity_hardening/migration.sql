-- Performance indexes and integrity guards. Additive and idempotent; no data is dropped.

-- 1. Foreign-key lookup indexes (payments_orderId_idx already exists from init; IF NOT EXISTS keeps it a no-op).
CREATE INDEX IF NOT EXISTS "cart_items_variantId_idx" ON "cart_items"("variantId");
CREATE INDEX IF NOT EXISTS "payments_orderId_idx" ON "payments"("orderId");
CREATE INDEX IF NOT EXISTS "order_items_variantId_idx" ON "order_items"("variantId");
CREATE INDEX IF NOT EXISTS "coupon_redemptions_userId_idx" ON "coupon_redemptions"("userId");

-- 2. At most one default address per user. First demote duplicates, keeping the most recently updated default.
UPDATE "addresses" a
SET "isDefault" = false
WHERE a."isDefault"
  AND a.id <> (
    SELECT d.id FROM "addresses" d
    WHERE d."userId" = a."userId" AND d."isDefault"
    ORDER BY d."updatedAt" DESC, d.id DESC
    LIMIT 1
  );

-- Partial unique index (Prisma cannot express partial indexes; it is managed here only).
CREATE UNIQUE INDEX IF NOT EXISTS "addresses_userId_default_key" ON "addresses"("userId") WHERE "isDefault";

-- 3. CHECK constraints. Added NOT VALID (enforced for new/updated rows immediately), then validated
--    best-effort: if legacy rows violate a rule the constraint simply stays NOT VALID instead of failing the migration.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT * FROM (VALUES
      ('orders',    'orders_discountTotal_nonneg',    '"discountTotal" >= 0'),
      ('orders',    'orders_taxTotal_nonneg',         '"taxTotal" >= 0'),
      ('order_items','order_items_lineTotal_nonneg',  '"lineTotal" >= 0'),
      ('coupons',   'coupons_perUserLimit_positive',  '"perUserLimit" > 0'),
      ('coupons',   'coupons_usedCount_within_limit', '"usageLimit" IS NULL OR "usedCount" <= "usageLimit"')
    ) AS t(tbl, name, expr)
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = c.name) THEN
      EXECUTE format('ALTER TABLE %I ADD CONSTRAINT %I CHECK (%s) NOT VALID', c.tbl, c.name, c.expr);
    END IF;
    BEGIN
      EXECUTE format('ALTER TABLE %I VALIDATE CONSTRAINT %I', c.tbl, c.name);
    EXCEPTION WHEN check_violation THEN
      RAISE NOTICE 'constraint % left NOT VALID: existing rows violate it', c.name;
    END;
  END LOOP;
END $$;
