import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch chat messages
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
        members: true,
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

    // Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: chatRoom.id,
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
        createdAt: "asc",
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "메시지를 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST - Send a chat message
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

    const { content, fileUrl, fileName, fileType } = await req.json();

    if ((!content || !content.trim()) && !fileUrl) {
      return NextResponse.json(
        { error: "메시지 내용 또는 파일을 입력해주세요" },
        { status: 400 }
      );
    }

    // Check if chat room exists
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { challengeId: params.id },
      include: {
        members: true,
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
        { error: "채팅방에 메시지를 보낼 수 없습니다" },
        { status: 403 }
      );
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId: chatRoom.id,
        userId: session.user.id,
        content: content?.trim() || "",
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
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
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "메시지 전송 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
