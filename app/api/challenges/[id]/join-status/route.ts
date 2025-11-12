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

    // Check if user has a join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: {
        challengeId_userId: {
          challengeId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (!joinRequest) {
      return NextResponse.json({ status: null });
    }

    return NextResponse.json({ status: joinRequest.status });
  } catch (error) {
    console.error("Error checking join status:", error);
    return NextResponse.json(
      { error: "상태 확인 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
