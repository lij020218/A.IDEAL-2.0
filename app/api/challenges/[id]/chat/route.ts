import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch chat room details and members
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

    // Check if chat room exists
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { challengeId: params.id },
      include: {
        challenge: {
          select: {
            id: true,
            title: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: [
            { isOwner: "desc" },
            { joinedAt: "asc" },
          ],
        },
      },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { error: "채팅방을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if user is a member
    const isMember = chatRoom.members.some((m) => m.userId === session.user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "채팅방에 접근할 수 없습니다" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      challenge: chatRoom.challenge,
      members: chatRoom.members,
    });
  } catch (error) {
    console.error("Error fetching chat room:", error);
    return NextResponse.json(
      { error: "채팅방 정보를 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
