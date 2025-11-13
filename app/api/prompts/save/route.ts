import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { topic, prompt, recommendedTools, tips, parentId, imageUrl, isPublic } = await req.json();

    if (!topic || !prompt) {
      return NextResponse.json(
        { error: "주제와 프롬프트는 필수입니다" },
        { status: 400 }
      );
    }

    // Save prompt to database
    const savedPrompt = await prisma.prompt.create({
      data: {
        userId: session.user.id,
        topic,
        prompt,
        recommendedTools: JSON.stringify(recommendedTools || []),
        tips: JSON.stringify(tips || []),
        imageUrl: imageUrl || null,
        parentId: parentId || null,
        isPublic: isPublic || false, // Default to private
      },
    });

    return NextResponse.json({
      success: true,
      prompt: {
        id: savedPrompt.id,
        topic: savedPrompt.topic,
        imageUrl: savedPrompt.imageUrl,
        createdAt: savedPrompt.createdAt,
      },
    });
  } catch (error) {
    console.error("Error saving prompt:", error);
    return NextResponse.json(
      { error: "프롬프트 저장 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
