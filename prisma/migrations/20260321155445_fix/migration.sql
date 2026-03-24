/*
  Warnings:

  - You are about to drop the column `category` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `examplesJson` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `lastUpdated` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `limitationsJson` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `pricingAmountPln` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `pricingAmountPlnPerMonth` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `pricingLabel` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `pricingType` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `runsCount` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `tagline` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the column `inputJson` on the `AgentRun` table. All the data in the column will be lost.
  - You are about to drop the column `outputText` on the `AgentRun` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `AgentRun` table. All the data in the column will be lost.
  - Added the required column `input` to the `AgentRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `output` to the `AgentRun` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creatorId" TEXT NOT NULL,
    CONSTRAINT "Agent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Agent" ("createdAt", "creatorId", "description", "id", "name", "slug") SELECT "createdAt", "creatorId", "description", "id", "name", "slug" FROM "Agent";
DROP TABLE "Agent";
ALTER TABLE "new_Agent" RENAME TO "Agent";
CREATE UNIQUE INDEX "Agent_slug_key" ON "Agent"("slug");
CREATE TABLE "new_AgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentRun_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_AgentRun" ("agentId", "createdAt", "id") SELECT "agentId", "createdAt", "id" FROM "AgentRun";
DROP TABLE "AgentRun";
ALTER TABLE "new_AgentRun" RENAME TO "AgentRun";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
