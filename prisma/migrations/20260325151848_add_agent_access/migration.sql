-- CreateTable
CREATE TABLE "AgentAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentAccess_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AgentAccess_userId_idx" ON "AgentAccess"("userId");

-- CreateIndex
CREATE INDEX "AgentAccess_agentId_idx" ON "AgentAccess"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "AgentAccess_userId_agentId_key" ON "AgentAccess"("userId", "agentId");
