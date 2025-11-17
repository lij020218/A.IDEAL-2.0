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

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const prompt = await prisma.prompt.findUnique({
      where: {
        id: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if the prompt belongs to the user or is public
    if (prompt.userId !== session.user.id && !prompt.isPublic) {
      return NextResponse.json(
        { error: "접근 권한이 없습니다" },
        { status: 403 }
      );
    }

    // Increment view count (async, don't await) - only if field exists
    try {
      await prisma.prompt.update({
        where: { id: params.id },
        data: { views: { increment: 1 } },
      }).catch(err => console.log("Views field may not exist yet:", err.message));
    } catch (e) {
      // Silently ignore if views field doesn't exist
    }

    // Get user's rating if exists - only if PromptRating model exists
    let userRating = null;
    try {
      userRating = await (prisma as any).promptRating?.findUnique({
        where: {
          promptId_userId: {
            promptId: params.id,
            userId: session.user.id,
          },
        },
      });
    } catch (e) {
      // Silently ignore if PromptRating model doesn't exist
    }

    return NextResponse.json({
      id: prompt.id,
      topic: prompt.topic,
      prompt: prompt.prompt,
      category: (prompt as any).category || null,
      recommendedTools: JSON.parse(prompt.recommendedTools),
      tips: JSON.parse(prompt.tips),
      imageUrl: prompt.imageUrl,
      aiProvider: prompt.aiProvider,
      aiModel: prompt.aiModel,
      isPublic: prompt.isPublic,
      views: (prompt as any).views ?? 0,
      averageRating: (prompt as any).averageRating ?? null,
      ratingCount: (prompt as any).ratingCount ?? 0,
      userRating: userRating?.rating || null,
      isOwner: prompt.userId === session.user.id,
      createdAt: prompt.createdAt.toISOString(),
      user: prompt.user,
    });
  } catch (error) {
    console.error("Error fetching prompt:", error);
    return NextResponse.json(
      { error: "프롬프트를 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}
