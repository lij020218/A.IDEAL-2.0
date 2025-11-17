import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: 시험 공부 주제에 추가 파일 업로드
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { files } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "최소 1개 이상의 파일이 필요합니다" },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: "최대 10개까지 업로드 가능합니다" },
        { status: 400 }
      );
    }

    // 기존 토픽 조회
    const topic = await prisma.growthTopic.findFirst({
      where: { id: params.id, userId: user.id },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "학습 주제를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 기존 파일 정보 가져오기
    let existingFiles: Array<{ url: string; filename: string; size: number }> = [];
    if (topic.description) {
      try {
        const parsed = JSON.parse(topic.description);
        if (Array.isArray(parsed)) {
          existingFiles = parsed;
        }
      } catch (e) {
        // JSON 파싱 실패 시 빈 배열로 시작
      }
    }

    // 새 파일 정보를 description에 JSON으로 저장
    const allFiles = files;
    const examFilesInfo = JSON.stringify(allFiles);

    // 토픽 업데이트
    const updatedTopic = await prisma.growthTopic.update({
      where: { id: params.id },
      data: {
        description: examFilesInfo,
      },
    });

    return NextResponse.json({
      topic: updatedTopic,
      message: "파일이 성공적으로 업데이트되었습니다",
    });
  } catch (error) {
    console.error("[Update Exam Files] Error:", error);
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "파일 업데이트에 실패했습니다",
          details: process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "파일 업데이트에 실패했습니다" },
      { status: 500 }
    );
  }
}

