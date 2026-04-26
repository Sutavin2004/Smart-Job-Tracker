-- AlterTable
ALTER TABLE "Job" ADD COLUMN "agentNotes" TEXT;
ALTER TABLE "Job" ADD COLUMN "agentSessionId" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiCultureFit" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiKeySkills" TEXT;
ALTER TABLE "Job" ADD COLUMN "aiLastAnalyzed" DATETIME;
ALTER TABLE "Job" ADD COLUMN "aiSalaryInsight" TEXT;
ALTER TABLE "Job" ADD COLUMN "color" TEXT;
ALTER TABLE "Job" ADD COLUMN "companyStage" TEXT;
ALTER TABLE "Job" ADD COLUMN "discoveredBy" TEXT;
ALTER TABLE "Job" ADD COLUMN "parsedKeywords" TEXT;
ALTER TABLE "Job" ADD COLUMN "parsedTechStack" TEXT;
ALTER TABLE "Job" ADD COLUMN "recruiterPhone" TEXT;
ALTER TABLE "Job" ADD COLUMN "salaryRaw" TEXT;

-- CreateTable
CREATE TABLE "ApplicationQA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationQA_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL DEFAULT 'running',
    "searchQueries" TEXT,
    "jobsFound" INTEGER NOT NULL DEFAULT 0,
    "jobsAdded" INTEGER NOT NULL DEFAULT 0,
    "jobsFiltered" INTEGER NOT NULL DEFAULT 0,
    "log" TEXT,
    "error" TEXT,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EmailTemplate" ("body", "createdAt", "id", "isDefault", "name", "subject", "type", "updatedAt", "useCount") SELECT "body", "createdAt", "id", "isDefault", "name", "subject", "type", "updatedAt", "useCount" FROM "EmailTemplate";
DROP TABLE "EmailTemplate";
ALTER TABLE "new_EmailTemplate" RENAME TO "EmailTemplate";
CREATE TABLE "new_Interview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "type" TEXT NOT NULL,
    "scheduledAt" DATETIME NOT NULL,
    "duration" INTEGER,
    "interviewers" TEXT,
    "platform" TEXT,
    "location" TEXT,
    "notes" TEXT,
    "prepNotes" TEXT,
    "questionsAsked" TEXT,
    "myQuestions" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'scheduled',
    "feedbackReceived" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Interview" ("createdAt", "duration", "feedbackReceived", "id", "interviewers", "jobId", "location", "notes", "outcome", "platform", "prepNotes", "questionsAsked", "round", "scheduledAt", "type", "updatedAt") SELECT "createdAt", "duration", "feedbackReceived", "id", "interviewers", "jobId", "location", "notes", "outcome", "platform", "prepNotes", "questionsAsked", "round", "scheduledAt", "type", "updatedAt" FROM "Interview";
DROP TABLE "Interview";
ALTER TABLE "new_Interview" RENAME TO "Interview";
CREATE TABLE "new_UserProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "github" TEXT NOT NULL DEFAULT '',
    "portfolio" TEXT NOT NULL DEFAULT '',
    "currentTitle" TEXT NOT NULL DEFAULT '',
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "targetRoles" TEXT NOT NULL DEFAULT '',
    "targetSalaryMin" INTEGER NOT NULL DEFAULT 0,
    "targetSalaryMax" INTEGER NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'CAD',
    "skills" TEXT NOT NULL DEFAULT '',
    "education" TEXT NOT NULL DEFAULT '',
    "bio" TEXT NOT NULL DEFAULT '',
    "masterResume" TEXT NOT NULL DEFAULT '',
    "jobSearchGoals" TEXT NOT NULL DEFAULT '',
    "preferRemote" BOOLEAN NOT NULL DEFAULT false,
    "preferHybrid" BOOLEAN NOT NULL DEFAULT true,
    "targetLocations" TEXT NOT NULL DEFAULT '',
    "excludeKeywords" TEXT NOT NULL DEFAULT '',
    "weeklyGoal" INTEGER NOT NULL DEFAULT 5,
    "defaultSource" TEXT NOT NULL DEFAULT 'LinkedIn',
    "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_UserProfile" ("bio", "createdAt", "currency", "currentTitle", "defaultSource", "email", "github", "id", "linkedin", "name", "phone", "portfolio", "skills", "targetRoles", "targetSalaryMax", "targetSalaryMin", "timezone", "updatedAt", "weeklyGoal", "yearsExperience") SELECT "bio", "createdAt", "currency", "currentTitle", "defaultSource", "email", "github", "id", "linkedin", "name", "phone", "portfolio", "skills", "targetRoles", "targetSalaryMax", "targetSalaryMin", "timezone", "updatedAt", "weeklyGoal", "yearsExperience" FROM "UserProfile";
DROP TABLE "UserProfile";
ALTER TABLE "new_UserProfile" RENAME TO "UserProfile";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
