/*
  Warnings:

  - You are about to drop the column `content` on the `Curriculum` table. All the data in the column will be lost.
  - You are about to drop the column `resources` on the `Curriculum` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Prompt" ADD COLUMN "aiModel" TEXT;
ALTER TABLE "Prompt" ADD COLUMN "aiProvider" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Curriculum" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "topicId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "objectives" TEXT NOT NULL,
    "exercises" TEXT,
    "estimatedTime" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Curriculum_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "GrowthTopic" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Curriculum" ("createdAt", "date", "dayNumber", "description", "estimatedTime", "exercises", "id", "objectives", "title", "topicId", "updatedAt") SELECT "createdAt", "date", "dayNumber", "description", "estimatedTime", "exercises", "id", "objectives", "title", "topicId", "updatedAt" FROM "Curriculum";
DROP TABLE "Curriculum";
ALTER TABLE "new_Curriculum" RENAME TO "Curriculum";
CREATE INDEX "Curriculum_topicId_idx" ON "Curriculum"("topicId");
CREATE INDEX "Curriculum_date_idx" ON "Curriculum"("date");
CREATE UNIQUE INDEX "Curriculum_topicId_dayNumber_key" ON "Curriculum"("topicId", "dayNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Prompt_aiProvider_idx" ON "Prompt"("aiProvider");
