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

    return NextResponse.json({
      id: prompt.id,
      topic: prompt.topic,
      prompt: prompt.prompt,
      recommendedTools: JSON.parse(prompt.recommendedTools),
      tips: JSON.parse(prompt.tips),
      imageUrl: prompt.imageUrl,
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
