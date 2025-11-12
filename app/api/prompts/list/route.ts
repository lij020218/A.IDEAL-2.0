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

    // Parse JSON strings
    const parsedPrompts = prompts.map((p) => ({
      ...p,
      recommendedTools: JSON.parse(p.recommendedTools),
      tips: JSON.parse(p.tips),
    }));

    return NextResponse.json({ prompts: parsedPrompts });
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json(
      { error: "프롬프트 목록을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
