-- AlterEnum
ALTER TYPE "PricingType" ADD VALUE 'PAY_PER_USE';

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "freeRuns" INTEGER,
ADD COLUMN     "pricePerUse" INTEGER;

-- CreateTable
CREATE TABLE "FakePayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FakePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecution" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FakePayment_userId_agentId_idx" ON "FakePayment"("userId", "agentId");

-- CreateIndex
CREATE INDEX "FakePayment_agentId_idx" ON "FakePayment"("agentId");

-- CreateIndex
CREATE INDEX "AgentExecution_agentId_idx" ON "AgentExecution"("agentId");

-- CreateIndex
CREATE INDEX "AgentExecution_type_idx" ON "AgentExecution"("type");

-- AddForeignKey
ALTER TABLE "FakePayment" ADD CONSTRAINT "FakePayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FakePayment" ADD CONSTRAINT "FakePayment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentExecution" ADD CONSTRAINT "AgentExecution_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
