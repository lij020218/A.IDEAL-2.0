import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch join requests for a challenge
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

    // Check if user is the challenge owner
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "도전을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (challenge.userId !== session.user.id) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    // Fetch join requests
    const requests = await prisma.joinRequest.findMany({
      where: {
        challengeId: params.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching join requests:", error);
    return NextResponse.json(
      { error: "요청 목록을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST - Approve or reject a join request
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

    const { requestId, action } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다" },
        { status: 400 }
      );
    }

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "올바른 액션을 선택해주세요" },
        { status: 400 }
      );
    }

    // Fetch join request
    const joinRequest = await prisma.joinRequest.findUnique({
      where: { id: requestId },
      include: {
        challenge: true,
        user: true,
      },
    });

    if (!joinRequest) {
      return NextResponse.json(
        { error: "요청을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if user is the challenge owner
    if (joinRequest.challenge.userId !== session.user.id) {
      return NextResponse.json(
        { error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    if (action === "approve") {
      // Update join request status
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "approved" },
      });

      // Create or get chat room
      let chatRoom = await prisma.chatRoom.findUnique({
        where: { challengeId: params.id },
      });

      if (!chatRoom) {
        chatRoom = await prisma.chatRoom.create({
          data: {
            challengeId: params.id,
          },
        });

        // Add challenge owner as a member
        await prisma.chatMember.create({
          data: {
            chatRoomId: chatRoom.id,
            userId: joinRequest.challenge.userId,
            role: "owner",
            experience: "프로젝트 생성자",
            isOwner: true,
          },
        });
      }

      // Add approved user as a member
      await prisma.chatMember.create({
        data: {
          chatRoomId: chatRoom.id,
          userId: joinRequest.userId,
          role: joinRequest.role,
          experience: joinRequest.experience,
          isOwner: false,
        },
      });

      // Create notification for the applicant
      await prisma.notification.create({
        data: {
          userId: joinRequest.userId,
          type: "request_approved",
          title: "참가 신청이 승인되었습니다",
          message: `"${joinRequest.challenge.title}" 프로젝트 참가가 승인되었습니다. A.IDEAL SPACE에서 팀원들과 소통해보세요!`,
          link: `/challengers/${params.id}`,
        },
      });
    } else {
      // Reject the request
      await prisma.joinRequest.update({
        where: { id: requestId },
        data: { status: "rejected" },
      });

      // Create notification for the applicant
      await prisma.notification.create({
        data: {
          userId: joinRequest.userId,
          type: "request_rejected",
          title: "참가 신청이 거절되었습니다",
          message: `"${joinRequest.challenge.title}" 프로젝트 참가 신청이 거절되었습니다.`,
          link: `/challengers/${params.id}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing join request:", error);
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
