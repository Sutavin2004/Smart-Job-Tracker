-- CreateIndex
CREATE INDEX "Job_archived_status_idx" ON "Job"("archived", "status");

-- CreateIndex
CREATE INDEX "Job_updatedAt_idx" ON "Job"("updatedAt");

-- CreateIndex
CREATE INDEX "Interview_jobId_idx" ON "Interview"("jobId");

-- CreateIndex
CREATE INDEX "Interview_scheduledAt_idx" ON "Interview"("scheduledAt");

-- CreateIndex
CREATE INDEX "Activity_jobId_idx" ON "Activity"("jobId");

-- CreateIndex
CREATE INDEX "Document_jobId_idx" ON "Document"("jobId");

-- CreateIndex
CREATE INDEX "Contact_jobId_idx" ON "Contact"("jobId");

-- CreateIndex
CREATE INDEX "Task_jobId_idx" ON "Task"("jobId");

-- CreateIndex
CREATE INDEX "Task_completed_dueDate_idx" ON "Task"("completed", "dueDate");

-- CreateIndex
CREATE INDEX "SalaryNegotiation_jobId_idx" ON "SalaryNegotiation"("jobId");

-- CreateIndex
CREATE INDEX "ApplicationQA_jobId_idx" ON "ApplicationQA"("jobId");
