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

    const { id, topic, prompt, category, recommendedTools, tips, parentId, imageUrl, isPublic, aiProvider, aiModel } = await req.json();

    if (!topic || !prompt) {
      return NextResponse.json(
        { error: "주제와 프롬프트는 필수입니다" },
        { status: 400 }
      );
    }

    let savedPrompt;

    // If id is provided, update existing prompt
    if (id) {
      // Verify ownership
      const existingPrompt = await prisma.prompt.findUnique({
        where: { id },
      });

      if (!existingPrompt) {
        return NextResponse.json(
          { error: "프롬프트를 찾을 수 없습니다" },
          { status: 404 }
        );
      }

      if (existingPrompt.userId !== session.user.id) {
        return NextResponse.json(
          { error: "수정 권한이 없습니다" },
          { status: 403 }
        );
      }

      // Update the prompt
      savedPrompt = await prisma.prompt.update({
        where: { id },
        data: {
          topic,
          prompt,
          category: category || null,
          recommendedTools: JSON.stringify(recommendedTools || []),
          tips: JSON.stringify(tips || []),
          imageUrl: imageUrl || null,
          aiProvider: aiProvider || null,
          aiModel: aiModel || null,
        },
      });
    } else {
      // Create new prompt
      savedPrompt = await prisma.prompt.create({
        data: {
          userId: session.user.id,
          topic,
          prompt,
          category: category || null,
          recommendedTools: JSON.stringify(recommendedTools || []),
          tips: JSON.stringify(tips || []),
          imageUrl: imageUrl || null,
          parentId: parentId || null,
          isPublic: isPublic || false, // Default to private
          aiProvider: aiProvider || null,
          aiModel: aiModel || null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      id: savedPrompt.id,
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
