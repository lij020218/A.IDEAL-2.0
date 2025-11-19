import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const topics = await prisma.growthTopic.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        title: true,
        description: true,
        level: true,
        duration: true,
        goal: true,
        createdAt: true,
        progress: {
          select: {
            status: true,
          },
        },
      },
    });

    // Calculate progress percentage for each topic
    const topicsWithProgress = topics.map((topic) => {
      const totalDays = topic.duration;
      const completedDays = topic.progress.filter(
        (p) => p.status === "completed"
      ).length;
      const progressPercentage = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      return {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        level: topic.level,
        duration: topic.duration,
        goal: topic.goal,
        createdAt: topic.createdAt,
        progress: progressPercentage,
      };
    });

    return NextResponse.json({ topics: topicsWithProgress });
  } catch (error) {
    console.error("Error fetching public growth topics:", error);
    return NextResponse.json(
      { error: "성장하기 목록을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
