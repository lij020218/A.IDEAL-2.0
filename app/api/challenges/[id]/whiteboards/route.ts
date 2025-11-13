import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all whiteboards for a chat room
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

    // Get chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { challengeId: params.id },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { error: "채팅방을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if user is a member
    const member = await prisma.chatMember.findFirst({
      where: {
        chatRoomId: chatRoom.id,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "채팅방 멤버만 화이트보드를 볼 수 있습니다" },
        { status: 403 }
      );
    }

    // Fetch all whiteboards with items
    const whiteboards = await prisma.whiteboard.findMany({
      where: { chatRoomId: chatRoom.id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ whiteboards });
  } catch (error) {
    console.error("Error fetching whiteboards:", error);
    return NextResponse.json(
      { error: "화이트보드 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST - Create a new whiteboard
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

    const { title } = await req.json();

    if (!title) {
      return NextResponse.json(
        { error: "제목은 필수입니다" },
        { status: 400 }
      );
    }

    // Get chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { challengeId: params.id },
    });

    if (!chatRoom) {
      return NextResponse.json(
        { error: "채팅방을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if user is a member
    const member = await prisma.chatMember.findFirst({
      where: {
        chatRoomId: chatRoom.id,
        userId: session.user.id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "채팅방 멤버만 화이트보드를 생성할 수 있습니다" },
        { status: 403 }
      );
    }

    // Create whiteboard
    const whiteboard = await prisma.whiteboard.create({
      data: {
        chatRoomId: chatRoom.id,
        title,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json({ whiteboard });
  } catch (error) {
    console.error("Error creating whiteboard:", error);
    return NextResponse.json(
      { error: "화이트보드 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a whiteboard
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

    const { searchParams } = new URL(req.url);
    const whiteboardId = searchParams.get("whiteboardId");

    if (!whiteboardId) {
      return NextResponse.json(
        { error: "화이트보드 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // Check if whiteboard exists
    const whiteboard = await prisma.whiteboard.findUnique({
      where: { id: whiteboardId },
      include: {
        chatRoom: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!whiteboard) {
      return NextResponse.json(
        { error: "화이트보드를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if user is a member
    const isMember = whiteboard.chatRoom.members.some(
      (member) => member.userId === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "채팅방 멤버만 화이트보드를 삭제할 수 있습니다" },
        { status: 403 }
      );
    }

    // Delete whiteboard (items will be deleted automatically due to cascade)
    await prisma.whiteboard.delete({
      where: { id: whiteboardId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting whiteboard:", error);
    return NextResponse.json(
      { error: "화이트보드 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
