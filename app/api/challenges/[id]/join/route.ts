import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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

    const { role, experience } = await req.json();

    if (!role || !experience) {
      return NextResponse.json(
        { error: "역할과 경력 사항을 모두 입력해주세요" },
        { status: 400 }
      );
    }

    // Check if challenge exists
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "도전을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if user is the challenge owner
    if (challenge.userId === session.user.id) {
      return NextResponse.json(
        { error: "본인이 생성한 도전에는 참가 신청할 수 없습니다" },
        { status: 400 }
      );
    }

    // Check if user already has a join request
    const existingRequest = await prisma.joinRequest.findUnique({
      where: {
        challengeId_userId: {
          challengeId: params.id,
          userId: session.user.id,
        },
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: "이미 참가 신청을 하셨습니다" },
        { status: 400 }
      );
    }

    // Create join request
    const joinRequest = await prisma.joinRequest.create({
      data: {
        challengeId: params.id,
        userId: session.user.id,
        role,
        experience,
        status: "pending",
      },
    });

    // Create notification for challenge owner
    await prisma.notification.create({
      data: {
        userId: challenge.userId,
        type: "join_request",
        title: "새로운 참가 신청",
        message: `${session.user.name || session.user.email}님이 "${challenge.title}" 프로젝트에 A.IDEAL SPACE 참가를 신청했습니다.`,
        link: `/challengers/${params.id}/requests`,
      },
    });

    return NextResponse.json({ success: true, joinRequest });
  } catch (error) {
    console.error("Error creating join request:", error);
    return NextResponse.json(
      { error: "참가 신청 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
