-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "pricingType" TEXT NOT NULL DEFAULT 'FREE',
    "pricingLabel" TEXT NOT NULL,
    "pricingAmountPln" INTEGER,
    "pricingAmountPlnPerMonth" INTEGER,
    "description" TEXT NOT NULL,
    "limitationsJson" TEXT NOT NULL,
    "examplesJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "lastUpdated" TEXT NOT NULL,
    "runsCount" INTEGER NOT NULL DEFAULT 0,
    "creatorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Agent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Agent" ("category", "createdAt", "creatorId", "description", "examplesJson", "id", "lastUpdated", "limitationsJson", "name", "pricingAmountPln", "pricingAmountPlnPerMonth", "pricingLabel", "pricingType", "slug", "status", "tagline", "updatedAt") SELECT "category", "createdAt", "creatorId", "description", "examplesJson", "id", "lastUpdated", "limitationsJson", "name", "pricingAmountPln", "pricingAmountPlnPerMonth", "pricingLabel", "pricingType", "slug", "status", "tagline", "updatedAt" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
CREATE UNIQUE INDEX "Agent_slug_key" ON "Agent"("slug");
CREATE INDEX "Agent_status_idx" ON "Agent"("status");
CREATE INDEX "Agent_category_idx" ON "Agent"("category");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
