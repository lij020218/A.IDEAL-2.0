import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function normalizeStatus(status?: string | null) {
  if (!status) return "not_started";
  const lowered = status.toLowerCase();
  if (lowered === "completed") return "completed";
  if (lowered === "in-progress" || lowered === "in progress" || lowered === "in_progress") {
    return "in_progress";
  }
  if (lowered === "paused") return "paused";
  return "not_started";
}

// GET: 특정 학습 주제 상세 정보 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const topic = await prisma.growthTopic.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        curriculum: {
          orderBy: { dayNumber: "asc" },
        },
        progress: {
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Add progress status to each curriculum item
    // Prisma 클라이언트가 업데이트되지 않았을 수 있으므로 raw query로 content 필드 직접 조회
    const curriculumWithProgress = await Promise.all(
      topic.curriculum.map(async (item) => {
        const progress = topic.progress.find((p) => p.dayNumber === item.dayNumber);
        const itemWithContent = item as any;
        
        // content와 resources 필드를 raw query로 직접 조회 (Prisma가 반환하지 않을 수 있음)
        let contentValue = itemWithContent.content || null;
        let resourcesValue = itemWithContent.resources || null;
        
        // Prisma가 필드를 반환하지 않으면 raw query로 직접 조회
        if (!contentValue) {
          try {
            const result = await prisma.$queryRaw<Array<{ content: string | null; resources: string | null }>>`
              SELECT content, resources FROM Curriculum WHERE id = ${item.id}
            `;
            if (result && result.length > 0) {
              contentValue = result[0].content;
              resourcesValue = result[0].resources;
            }
          } catch (rawError) {
            console.error("[Topics API] Raw query error:", rawError);
            // Raw query 실패해도 계속 진행
          }
        }
        
        return {
          ...item,
          content: contentValue, // content 필드 명시적으로 포함
          resources: resourcesValue, // resources 필드도 명시적으로 포함
          progressStatus: normalizeStatus(progress?.status),
          progressId: progress?.id,
        };
      })
    );

    return NextResponse.json({
      topic: {
        ...topic,
        curriculum: curriculumWithProgress,
      },
    });
  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}

// PATCH: 학습 주제 상태 업데이트
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { status } = body;

    if (!status || !["active", "paused", "completed"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const topic = await prisma.growthTopic.updateMany({
      where: {
        id: params.id,
        userId: user.id,
      },
      data: { status },
    });

    if (topic.count === 0) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Topic updated successfully" });
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      { error: "Failed to update topic" },
      { status: 500 }
    );
  }
}

// DELETE: 학습 주제 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const topic = await prisma.growthTopic.deleteMany({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (topic.count === 0) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Topic deleted successfully" });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 }
    );
  }
}
