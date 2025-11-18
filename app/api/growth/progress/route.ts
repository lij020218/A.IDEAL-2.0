import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

let columnsEnsured = false;

function normalizeStatusValue(value?: string | null) {
  const lowered = (value || "").toLowerCase().trim();
  if (lowered === "completed") return "completed";
  if (lowered === "in-progress" || lowered === "in progress" || lowered === "in_progress") {
    return "in_progress";
  }
  if (lowered === "not-started" || lowered === "not started" || lowered === "not_started") {
    return "not_started";
  }
  if (lowered === "paused") return "paused";
  if (lowered === "active") return "in_progress";
  return "in_progress";
}

async function ensureLearningProgressColumns() {
  if (columnsEnsured) return;

  const addColumn = async (sql: TemplateStringsArray, ...values: any[]) => {
    try {
      await prisma.$executeRaw(sql, ...values);
    } catch (error) {
      // ignore (likely column already exists)
    }
  };

  await addColumn`ALTER TABLE "LearningProgress" ADD COLUMN "date" TIMESTAMP;`;
  await addColumn`ALTER TABLE "LearningProgress" ADD COLUMN "notes" TEXT;`;
  await addColumn`ALTER TABLE "LearningProgress" ADD COLUMN "chatHistory" TEXT;`;

  columnsEnsured = true;
}

// POST: 학습 진도 생성 또는 업데이트
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { topicId, dayNumber, status, timeSpent, notes, chatHistory } = body;

    if (!topicId || !dayNumber) {
      return NextResponse.json(
        { error: "Topic ID and day number are required" },
        { status: 400 }
      );
    }

    // Verify topic belongs to user
    const topic = await prisma.growthTopic.findFirst({
      where: {
        id: topicId,
        userId: user.id,
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Verify curriculum exists
    const curriculum = await prisma.curriculum.findFirst({
      where: {
        topicId,
        dayNumber,
      },
    });

    if (!curriculum) {
      return NextResponse.json(
        { error: "Curriculum not found" },
        { status: 404 }
      );
    }

    await ensureLearningProgressColumns();

    const normalizedStatus = normalizeStatusValue(status);
    const normalizedTime = Number.isFinite(timeSpent) ? Number(timeSpent) : 0;
    const normalizedNotes = notes ? String(notes) : null;
    const normalizedChatHistory = chatHistory ? JSON.stringify(chatHistory) : null;
    const completedAt = normalizedStatus === "completed" ? new Date() : null;
    const now = new Date();

    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "LearningProgress"
      WHERE "userId" = ${user.id} AND "topicId" = ${topicId} AND "dayNumber" = ${dayNumber}
      LIMIT 1
    `;

    if (existing.length > 0) {
      await prisma.$executeRaw`
        UPDATE "LearningProgress"
        SET status = ${normalizedStatus},
            "timeSpent" = ${normalizedTime},
            notes = ${normalizedNotes},
            "chatHistory" = ${normalizedChatHistory},
            "completedAt" = ${completedAt},
            "updatedAt" = ${now}
        WHERE id = ${existing[0].id}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO "LearningProgress" (
          id,
          "userId",
          "topicId",
          "dayNumber",
          date,
          status,
          "timeSpent",
          notes,
          "chatHistory",
          "completedAt",
          "createdAt",
          "updatedAt"
        ) VALUES (
          ${randomUUID()},
          ${user.id},
          ${topicId},
          ${dayNumber},
          ${curriculum.date},
          ${normalizedStatus},
          ${normalizedTime},
          ${normalizedNotes},
          ${normalizedChatHistory},
          ${completedAt},
          ${now},
          ${now}
        )
      `;
    }

    const progress = await prisma.$queryRaw<Array<any>>`
      SELECT id, "topicId", "dayNumber", status, "timeSpent", "completedAt", date, "updatedAt"
      FROM "LearningProgress"
      WHERE "userId" = ${user.id} AND "topicId" = ${topicId} AND "dayNumber" = ${dayNumber}
      LIMIT 1
    `;

    return NextResponse.json({ progress: progress[0] });
  } catch (error) {
    console.error("Error updating progress:", error);
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    );
  }
}

// GET: 특정 주제의 진도 조회
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const topicId = searchParams.get("topicId");

    if (!topicId) {
      return NextResponse.json(
        { error: "Topic ID is required" },
        { status: 400 }
      );
    }

    // Verify topic belongs to user
    const topic = await prisma.growthTopic.findFirst({
      where: {
        id: topicId,
        userId: user.id,
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    await ensureLearningProgressColumns();

    const progress = await prisma.$queryRaw<Array<any>>`
      SELECT id, "dayNumber", status, "timeSpent", "completedAt", date
      FROM "LearningProgress"
      WHERE "topicId" = ${topicId} AND "userId" = ${user.id}
      ORDER BY "dayNumber" ASC
    `;

    const normalized = progress.map((p) => ({
      ...p,
      status: normalizeStatusValue(p.status),
    }));

    return NextResponse.json({ progress: normalized });
  } catch (error) {
    console.error("Error fetching progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    );
  }
}
