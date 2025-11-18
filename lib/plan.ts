import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export type PlanType = "free" | "pro";

interface PlanLimits {
  promptCopiesPerDay: number | null;
  growthContentPerDay: number | null;
}

export function getPlanLimits(plan: PlanType): PlanLimits {
  if (plan === "pro") {
    return {
      promptCopiesPerDay: null,
      growthContentPerDay: null,
    };
  }
  return {
    promptCopiesPerDay: 10,
    growthContentPerDay: 3,
  };
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

let planColumnsEnsured = false;
let usageTableEnsured = false;

async function ensurePlanColumns() {
  if (planColumnsEnsured) return;
  try {
    // PostgreSQL: information_schema를 사용하여 컬럼 존재 여부 확인
    const columns = await prisma.$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'User'
    `;
    const names = new Set(columns.map((col) => col.column_name.toLowerCase()));

    const addColumn = async (sql: string) => {
      try {
        await prisma.$executeRawUnsafe(sql);
      } catch (error) {
        // 컬럼이 이미 존재하는 경우 무시
      }
    };

    if (!names.has("plan")) {
      await addColumn(`ALTER TABLE "User" ADD COLUMN plan TEXT DEFAULT 'free'`);
    }
    if (!names.has("promptcopiestoday")) {
      await addColumn(`ALTER TABLE "User" ADD COLUMN "promptCopiesToday" INTEGER DEFAULT 0`);
    }
    if (!names.has("promptcopiesresetat")) {
      await addColumn(`ALTER TABLE "User" ADD COLUMN "promptCopiesResetAt" TIMESTAMP`);
    }
    if (!names.has("growthcontenttoday")) {
      await addColumn(`ALTER TABLE "User" ADD COLUMN "growthContentToday" INTEGER DEFAULT 0`);
    }
    if (!names.has("growthcontentresetat")) {
      await addColumn(`ALTER TABLE "User" ADD COLUMN "growthContentResetAt" TIMESTAMP`);
    }

    planColumnsEnsured = true;
  } catch (error) {
    console.error("[Plan] Failed to ensure plan columns:", error);
  }
}

async function ensureUsageTable() {
  if (usageTableEnsured) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UsageLog" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        type TEXT NOT NULL,
        metadata TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_usage_user ON "UsageLog"("userId", "createdAt" DESC)
    `);
    usageTableEnsured = true;
  } catch (error) {
    console.error("[Plan] Failed to ensure usage log table:", error);
  }
}

type UsageType = "prompt_copy" | "growth_content";

async function logUsage(
  userId: string,
  type: UsageType,
  metadata?: Record<string, unknown>
) {
  await ensureUsageTable();
  const id = randomUUID();
  const metaJson = metadata ? JSON.stringify(metadata) : null;
  await prisma.$executeRaw`
    INSERT INTO "UsageLog"(id, "userId", type, metadata, "createdAt")
    VALUES (${id}, ${userId}, ${type}, ${metaJson}, NOW())
  `;
}

type PlanRow = {
  plan: string | null;
  promptCopiesToday: number | null;
  promptCopiesResetAt: string | null;
  growthContentToday: number | null;
  growthContentResetAt: string | null;
};

async function getPlanRow(userId: string): Promise<PlanRow> {
  await ensurePlanColumns();
  const rows = await prisma.$queryRaw<Array<PlanRow>>`
    SELECT plan,
           "promptCopiesToday",
           "promptCopiesResetAt",
           "growthContentToday",
           "growthContentResetAt"
    FROM "User"
    WHERE id = ${userId}
  `;
  if (!rows.length) {
    throw new Error("사용자를 찾을 수 없습니다");
  }
  return rows[0];
}

async function updatePlanRow(userId: string, data: PlanRow) {
  await prisma.$executeRaw`
    UPDATE "User"
    SET plan = ${data.plan},
        "promptCopiesToday" = ${data.promptCopiesToday},
        "promptCopiesResetAt" = ${data.promptCopiesResetAt},
        "growthContentToday" = ${data.growthContentToday},
        "growthContentResetAt" = ${data.growthContentResetAt}
    WHERE id = ${userId}
  `;
}

async function resetCountersIfNeeded(userId: string) {
  const row = await getPlanRow(userId);
  const today = startOfToday();
  const todayISO = today.toISOString();

  let updated = false;
  let promptCopiesToday = row.promptCopiesToday ?? 0;
  let promptCopiesResetAt = row.promptCopiesResetAt;
  let growthContentToday = row.growthContentToday ?? 0;
  let growthContentResetAt = row.growthContentResetAt;

  if (!promptCopiesResetAt || new Date(promptCopiesResetAt) < today) {
    promptCopiesToday = 0;
    promptCopiesResetAt = todayISO;
    updated = true;
  }

  if (!growthContentResetAt || new Date(growthContentResetAt) < today) {
    growthContentToday = 0;
    growthContentResetAt = todayISO;
    updated = true;
  }

  if (updated) {
    await updatePlanRow(userId, {
      plan: row.plan || "free",
      promptCopiesToday,
      promptCopiesResetAt,
      growthContentToday,
      growthContentResetAt,
    });
  }
}

export async function ensurePromptCopyAllowed(userId: string) {
  await resetCountersIfNeeded(userId);

  const row = await getPlanRow(userId);
  const plan = (row.plan as PlanType) || "free";
  const limits = getPlanLimits(plan);

  const promptCopiesToday = row.promptCopiesToday ?? 0;

  if (
    limits.promptCopiesPerDay !== null &&
    promptCopiesToday >= limits.promptCopiesPerDay
  ) {
    throw new Error("무료 플랜은 하루 최대 10개의 프롬프트만 복사할 수 있습니다");
  }

  const newCount = promptCopiesToday + 1;
  await prisma.$executeRaw`
    UPDATE "User"
    SET "promptCopiesToday" = ${newCount},
        "promptCopiesResetAt" = COALESCE("promptCopiesResetAt", ${startOfToday().toISOString()})
    WHERE id = ${userId}
  `;
  await logUsage(userId, "prompt_copy", { total: newCount });
}

export async function ensureGrowthContentAllowed(userId: string) {
  await resetCountersIfNeeded(userId);

  const row = await getPlanRow(userId);
  const plan = (row.plan as PlanType) || "free";
  const limits = getPlanLimits(plan);

  const growthContentToday = row.growthContentToday ?? 0;

  if (
    limits.growthContentPerDay !== null &&
    growthContentToday >= limits.growthContentPerDay
  ) {
    throw new Error("무료 플랜은 하루 최대 3개의 성장하기 콘텐츠를 생성할 수 있습니다");
  }

  const newCount = growthContentToday + 1;
  await prisma.$executeRaw`
    UPDATE "User"
    SET "growthContentToday" = ${newCount},
        "growthContentResetAt" = COALESCE("growthContentResetAt", ${startOfToday().toISOString()})
    WHERE id = ${userId}
  `;
  await logUsage(userId, "growth_content", { total: newCount });
}

export async function getPlanStatus(userId: string) {
  await resetCountersIfNeeded(userId);

  const row = await getPlanRow(userId);
  const plan = (row.plan as PlanType) || "free";
  const limits = getPlanLimits(plan);

  return {
    plan,
    promptCopiesToday: row.promptCopiesToday ?? 0,
    promptCopyLimit: limits.promptCopiesPerDay,
    growthContentToday: row.growthContentToday ?? 0,
    growthContentLimit: limits.growthContentPerDay,
  };
}

export async function setUserPlan(userId: string, plan: PlanType) {
  await ensurePlanColumns();
  const todayISO = startOfToday().toISOString();
  await prisma.$executeRaw`
    UPDATE "User"
    SET plan = ${plan},
        "promptCopiesToday" = 0,
        "growthContentToday" = 0,
        "promptCopiesResetAt" = ${todayISO},
        "growthContentResetAt" = ${todayISO}
    WHERE id = ${userId}
  `;
}

export async function getUsageLogs(userId: string, limit = 20) {
  await ensureUsageTable();
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    type: UsageType;
    metadata: string | null;
    createdAt: string;
  }>>`
    SELECT id, type, metadata, "createdAt"
    FROM "UsageLog"
    WHERE "userId" = ${userId}
    ORDER BY "createdAt" DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => ({
    ...row,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }));
}




