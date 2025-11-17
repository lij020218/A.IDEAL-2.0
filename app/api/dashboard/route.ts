import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    if (!userId) {
      console.error("Session user ID is missing:", session);
      return NextResponse.json(
        { error: "사용자 정보를 가져올 수 없습니다" },
        { status: 401 }
      );
    }

    // Get counts
    const [promptsCount, challengesCount, learningTopicsCount, publicPrompts] = await Promise.all([
      prisma.prompt.count({
        where: { userId },
      }),
      prisma.challenge.count({
        where: { userId },
      }),
      prisma.growthTopic.count({
        where: { userId },
      }),
      prisma.prompt.findMany({
        where: {
          userId,
          isPublic: true,
        },
        select: {
          views: true,
          ratingCount: true,
        },
      }),
    ]);

    // Calculate total views and ratings
    const totalViews = publicPrompts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalRatings = publicPrompts.reduce((sum, p) => sum + (p.ratingCount || 0), 0);

    // Get recent items
    const [recentPrompts, recentChallenges, recentLearning] = await Promise.all([
      prisma.prompt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          topic: true,
          createdAt: true,
        },
      }),
      prisma.challenge.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
      prisma.growthTopic.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      promptsCount,
      challengesCount,
      learningTopicsCount,
      publicPromptsCount: publicPrompts.length,
      totalViews,
      totalRatings,
      recentPrompts,
      recentChallenges,
      recentLearning,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { 
        error: "대시보드 데이터를 가져오는 중 오류가 발생했습니다",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}

