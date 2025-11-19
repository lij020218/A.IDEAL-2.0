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

    // Fetch user's prompts with parent-child relationships
    const prompts = await prisma.prompt.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        topic: true,
        prompt: true,
        recommendedTools: true,
        tips: true,
        imageUrl: true,
        aiProvider: true,
        aiModel: true,
        isPublic: true,
        views: true,
        averageRating: true,
        ratingCount: true,
        createdAt: true,
        parentId: true,
        refinements: {
          select: {
            id: true,
            topic: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    // Parse JSON strings safely
    const parsedPrompts = prompts.map((p) => {
      try {
        return {
          ...p,
          recommendedTools: p.recommendedTools ? (typeof p.recommendedTools === 'string' ? JSON.parse(p.recommendedTools) : p.recommendedTools) : [],
          tips: p.tips ? (typeof p.tips === 'string' ? JSON.parse(p.tips) : p.tips) : [],
        };
      } catch (parseError) {
        console.error("Error parsing prompt data:", parseError, p);
        return {
          ...p,
          recommendedTools: [],
          tips: [],
        };
      }
    });

    return NextResponse.json({ prompts: parsedPrompts });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { 
        error: "프롬프트 목록을 가져오는 중 오류가 발생했습니다",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}
