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

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Get stats
    const [promptsCount, publicPrompts, challengesCount, learningTopicsCount, followersCount, followingCount] = await Promise.all([
      prisma.prompt.count({
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
          averageRating: true,
        },
      }),
      prisma.challenge.count({
        where: { userId },
      }),
      prisma.growthTopic.count({
        where: { userId },
      }),
      // Safely get follow counts (model might not be available yet)
      'follow' in prisma && typeof (prisma as any).follow?.count === 'function'
        ? (prisma as any).follow.count({ where: { followingId: userId } })
        : Promise.resolve(0),
      'follow' in prisma && typeof (prisma as any).follow?.count === 'function'
        ? (prisma as any).follow.count({ where: { followerId: userId } })
        : Promise.resolve(0),
    ]);

    const publicPromptsCount = publicPrompts.length;
    const totalViews = publicPrompts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalRatings = publicPrompts.reduce((sum, p) => sum + (p.ratingCount || 0), 0);
    const averageRating =
      publicPrompts.length > 0
        ? publicPrompts.reduce((sum, p) => sum + (p.averageRating || 0), 0) / publicPrompts.length
        : null;

    // Calculate badges
    const badges: string[] = [];
    if (publicPromptsCount >= 10) badges.push("creator");
    if (totalViews >= 1000) badges.push("popular");
    if (averageRating && averageRating >= 4.5 && totalRatings >= 10) badges.push("expert");
    if (followersCount >= 50) badges.push("influencer");
    if (promptsCount >= 50) badges.push("prolific");

    const userPrompts = await prisma.prompt.findMany({
      where: { userId, parentId: null },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        topic: true,
        prompt: true,
        recommendedTools: true,
        tips: true,
        imageUrl: true,
        createdAt: true,
        aiProvider: true,
        aiModel: true,
        isPublic: true,
      },
    });

    const parsedPrompts = userPrompts.map((prompt) => ({
      ...prompt,
      recommendedTools: safeParseArray(prompt.recommendedTools),
      tips: safeParseArray(prompt.tips),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }));

    // Get recent activity (for dashboard view)
    const [recentPrompts, recentChallenges, recentLearning] = await Promise.all([
      prisma.prompt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          topic: true,
          views: true,
          averageRating: true,
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
      user,
      stats: {
        promptsCount,
        publicPromptsCount,
        challengesCount,
        learningTopicsCount,
        totalViews,
        totalRatings,
        averageRating,
        followersCount,
        followingCount,
      },
      badges,
      prompts: parsedPrompts,
      recentActivity: {
        prompts: recentPrompts,
        challenges: recentChallenges,
        learning: recentLearning,
      },
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { 
        error: "프로필 데이터를 가져오는 중 오류가 발생했습니다",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}

function safeParseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

