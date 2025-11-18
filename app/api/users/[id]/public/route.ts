import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const viewerId = session?.user?.id;

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const isOwnProfile = viewerId === user.id;

    // Load prompts (public only unless viewer is the owner)
    const prompts = await prisma.prompt.findMany({
      where: {
        userId: user.id,
        ...(isOwnProfile ? {} : { isPublic: true }),
        parentId: null,
      },
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
        views: true,
        averageRating: true,
        ratingCount: true,
      },
    });

    const parsedPrompts = prompts.map((prompt) => ({
      ...prompt,
      recommendedTools: safeParseArray(prompt.recommendedTools),
      tips: safeParseArray(prompt.tips),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }));

    const followersCount =
      "follow" in prisma && (prisma as any).follow?.count
        ? await (prisma as any).follow.count({
            where: { followingId: user.id },
          })
        : 0;

    const followingCount =
      "follow" in prisma && (prisma as any).follow?.count
        ? await (prisma as any).follow.count({
            where: { followerId: user.id },
          })
        : 0;

    let isFollowing = false;
    if (
      viewerId &&
      viewerId !== user.id &&
      "follow" in prisma &&
      (prisma as any).follow?.findUnique
    ) {
      const follow = await (prisma as any).follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: viewerId,
            followingId: user.id,
          },
        },
      });
      isFollowing = Boolean(follow);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
      stats: {
        promptsCount: prompts.length,
        followersCount,
        followingCount,
      },
      isOwnProfile,
      isFollowing,
      prompts: parsedPrompts,
    });
  } catch (error) {
    console.error("Error fetching public user profile:", error);
    return NextResponse.json(
      { error: "사용자 정보를 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

function safeParseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}


