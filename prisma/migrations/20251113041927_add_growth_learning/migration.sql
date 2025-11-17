-- CreateTable
CREATE TABLE "GrowthTopic" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "goal" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GrowthTopic_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Curriculum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "exercises" TEXT,
    "resources" TEXT,
    "estimatedTime" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Curriculum_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GrowthTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "timeSpent" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "chatHistory" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LearningProgress_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GrowthTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "GrowthTopic_userId_idx" ON "GrowthTopic"("userId");

-- CreateIndex
CREATE INDEX "GrowthTopic_status_idx" ON "GrowthTopic"("status");

-- CreateIndex
CREATE INDEX "Curriculum_topicId_idx" ON "Curriculum"("topicId");

-- CreateIndex
CREATE INDEX "Curriculum_date_idx" ON "Curriculum"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Curriculum_topicId_dayNumber_key" ON "Curriculum"("topicId", "dayNumber");

-- CreateIndex
CREATE INDEX "LearningProgress_userId_idx" ON "LearningProgress"("userId");

-- CreateIndex
CREATE INDEX "LearningProgress_topicId_idx" ON "LearningProgress"("topicId");

-- CreateIndex
CREATE INDEX "LearningProgress_status_idx" ON "LearningProgress"("status");

-- CreateIndex
CREATE UNIQUE INDEX "LearningProgress_userId_topicId_dayNumber_key" ON "LearningProgress"("userId", "topicId", "dayNumber");
