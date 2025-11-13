import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Get all prompts for public display (including user info)
export async function GET() {
  try {
    const prompts = await prisma.prompt.findMany({
      where: {
        parentId: null, // Only get parent prompts, not refinements
        isPublic: true, // Only get public prompts
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limit to most recent 20 public prompts
    });

    // Parse JSON fields
    const parsedPrompts = prompts.map((prompt) => ({
      ...prompt,
      recommendedTools: JSON.parse(prompt.recommendedTools),
      tips: JSON.parse(prompt.tips),
    }));

    return NextResponse.json({ prompts: parsedPrompts });
  } catch (error) {
    console.error("Error fetching public prompts:", error);
    return NextResponse.json(
      { error: "프롬프트 목록을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
