import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
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

    // Check if prompt exists and belongs to user
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (prompt.userId !== session.user.id) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    // Delete the prompt (ratings will be cascade deleted)
    await prisma.prompt.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting prompt:", error);
    return NextResponse.json(
      { error: "프롬프트 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
