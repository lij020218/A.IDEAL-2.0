-- CreateTable
CREATE TABLE "PromptRating" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "promptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PromptRating_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Prompt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "recommendedTools" TEXT NOT NULL,
    "tips" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "parentId" TEXT,
    "aiProvider" TEXT,
    "aiModel" TEXT,
    "views" INTEGER NOT NULL DEFAULT 0,
    "averageRating" REAL,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Prompt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Prompt_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Prompt" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Prompt" ("aiModel", "aiProvider", "createdAt", "id", "imageUrl", "isPublic", "parentId", "prompt", "recommendedTools", "tips", "topic", "updatedAt", "userId") SELECT "aiModel", "aiProvider", "createdAt", "id", "imageUrl", "isPublic", "parentId", "prompt", "recommendedTools", "tips", "topic", "updatedAt", "userId" FROM "Prompt";
DROP TABLE "Prompt";
ALTER TABLE "new_Prompt" RENAME TO "Prompt";
CREATE INDEX "Prompt_userId_idx" ON "Prompt"("userId");
CREATE INDEX "Prompt_parentId_idx" ON "Prompt"("parentId");
CREATE INDEX "Prompt_isPublic_idx" ON "Prompt"("isPublic");
CREATE INDEX "Prompt_aiProvider_idx" ON "Prompt"("aiProvider");
CREATE INDEX "Prompt_views_idx" ON "Prompt"("views");
CREATE INDEX "Prompt_averageRating_idx" ON "Prompt"("averageRating");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PromptRating_promptId_idx" ON "PromptRating"("promptId");

-- CreateIndex
CREATE INDEX "PromptRating_userId_idx" ON "PromptRating"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PromptRating_promptId_userId_key" ON "PromptRating"("promptId", "userId");
