import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // 사용자가 참여 중인 채팅방 목록 가져오기
    const chatMembers = await prisma.chatMember.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        chatRoom: {
          include: {
            challenge: {
              select: {
                id: true,
                title: true,
              },
            },
            messages: {
              take: 1,
              orderBy: {
                createdAt: "desc",
              },
              select: {
                content: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                members: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    const chatRooms = chatMembers
      .filter((member) => member.chatRoom.challenge) // challenge가 없는 경우 필터링
      .map((member) => ({
        id: member.chatRoom.id,
        challengeId: member.chatRoom.challenge?.id || null,
        challengeTitle: member.chatRoom.challenge?.title || "알 수 없음",
        memberCount: member.chatRoom._count.members,
        lastMessage: member.chatRoom.messages[0]?.content || null,
        lastMessageAt: member.chatRoom.messages[0]?.createdAt || member.chatRoom.createdAt,
        isOwner: member.isOwner,
      }));

    return NextResponse.json({ chatRooms });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { 
        error: "채팅방 목록을 가져오는 중 오류가 발생했습니다",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}
