/*
  Warnings:

  - Added the required column `updatedAt` to the `Interview` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" ADD COLUMN "metadata" TEXT;

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "linkedin" TEXT,
    "relationship" TEXT NOT NULL DEFAULT 'other',
    "notes" TEXT,
    "lastContact" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Contact_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" DATETIME,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Task_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalaryNegotiation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "round" INTEGER NOT NULL DEFAULT 1,
    "theirOffer" TEXT,
    "myCounter" TEXT,
    "notes" TEXT,
    "outcome" TEXT,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SalaryNegotiation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserProfile" (
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
    "bio" TEXT NOT NULL DEFAULT '',
    "weeklyGoal" INTEGER NOT NULL DEFAULT 5,
    "defaultSource" TEXT NOT NULL DEFAULT 'LinkedIn',
    "timezone" TEXT NOT NULL DEFAULT 'America/Toronto',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Document" ("content", "createdAt", "id", "jobId", "name", "type") SELECT "content", "createdAt", "id", "jobId", "name", "type" FROM "Document";
DROP TABLE "Document";
ALTER TABLE "new_Document" RENAME TO "Document";
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
    "outcome" TEXT NOT NULL DEFAULT 'pending',
    "feedbackReceived" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Interview_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Interview" ("createdAt", "updatedAt", "id", "jobId", "notes", "outcome", "scheduledAt", "type") SELECT "createdAt", "createdAt", "id", "jobId", "notes", coalesce("outcome", 'pending') AS "outcome", "scheduledAt", "type" FROM "Interview";
DROP TABLE "Interview";
ALTER TABLE "new_Interview" RENAME TO "Interview";
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "company" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'saved',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "excitement" INTEGER,
    "jobUrl" TEXT,
    "jobDescription" TEXT,
    "salary" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "currency" TEXT DEFAULT 'CAD',
    "location" TEXT,
    "remote" BOOLEAN NOT NULL DEFAULT false,
    "hybrid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "aiSuggestion" TEXT,
    "aiScore" INTEGER,
    "aiStrengths" TEXT,
    "aiRisks" TEXT,
    "aiNextSteps" TEXT,
    "coverLetter" TEXT,
    "resumeVersion" TEXT,
    "source" TEXT,
    "referralContact" TEXT,
    "recruiterName" TEXT,
    "recruiterEmail" TEXT,
    "companySize" TEXT,
    "industry" TEXT,
    "techStack" TEXT,
    "benefits" TEXT,
    "visaSponsorship" BOOLEAN NOT NULL DEFAULT false,
    "dateApplied" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" DATETIME,
    "followUpDate" DATETIME,
    "lastContactDate" DATETIME,
    "offerDeadline" DATETIME,
    "offerAmount" TEXT,
    "rejectionReason" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Job" ("aiSuggestion", "company", "coverLetter", "createdAt", "dateApplied", "deadline", "id", "jobUrl", "location", "notes", "priority", "role", "salary", "status", "updatedAt") SELECT "aiSuggestion", "company", "coverLetter", "createdAt", "dateApplied", "deadline", "id", "jobUrl", "location", "notes", "priority", "role", "salary", "status", "updatedAt" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
