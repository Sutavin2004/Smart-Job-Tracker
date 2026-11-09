-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN "autoDiscover" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "AgentSession" ADD COLUMN "trigger" TEXT NOT NULL DEFAULT 'manual';

-- CreateIndex
CREATE INDEX "AgentSession_startedAt_idx" ON "AgentSession"("startedAt");
