-- AlterEnum
-- PAY_PER_USE already exists in the Neon DB (added via feat/results-enhanced branch).
-- IF NOT EXISTS ensures this migration is safe to apply on both fresh and already-migrated databases.
ALTER TYPE "PricingType" ADD VALUE IF NOT EXISTS 'PAY_PER_USE';
