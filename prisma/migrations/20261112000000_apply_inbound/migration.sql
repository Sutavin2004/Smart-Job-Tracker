-- Application kits and inbound application-email tracking
ALTER TABLE "Job" ADD COLUMN "applicationPreparedAt" TIMESTAMP(3);
ALTER TABLE "UserProfile" ADD COLUMN "autoPrepare" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "inboundToken" TEXT;
CREATE UNIQUE INDEX "User_inboundToken_key" ON "User"("inboundToken");

CREATE TABLE "InboundEmail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromAddr" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "link" TEXT,
    "providerId" TEXT,
    "jobId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InboundEmail_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InboundEmail_providerId_key" ON "InboundEmail"("providerId");
CREATE INDEX "InboundEmail_userId_receivedAt_idx" ON "InboundEmail"("userId", "receivedAt");
ALTER TABLE "InboundEmail" ADD CONSTRAINT "InboundEmail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
