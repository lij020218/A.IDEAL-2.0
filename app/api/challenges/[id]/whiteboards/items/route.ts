import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Add an item to whiteboard
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

    const { whiteboardId, type, content, position, size, style } = await req.json();

    if (!whiteboardId || !type || !content) {
      return NextResponse.json(
        { error: "필수 항목이 누락되었습니다" },
        { status: 400 }
      );
    }

    // Check if whiteboard exists and user has access
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
        { error: "채팅방 멤버만 아이템을 추가할 수 있습니다" },
        { status: 403 }
      );
    }

    // Create whiteboard item
    const item = await prisma.whiteboardItem.create({
      data: {
        whiteboardId,
        type,
        content,
        position: JSON.stringify(position || { x: 100, y: 100 }),
        size: JSON.stringify(size || { width: 200, height: 100 }),
        style: style ? JSON.stringify(style) : null,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error adding whiteboard item:", error);
    return NextResponse.json(
      { error: "아이템 추가 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PUT - Update a whiteboard item
export async function PUT(
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

    const { itemId, content, position, size, style } = await req.json();

    if (!itemId) {
      return NextResponse.json(
        { error: "아이템 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // Check if item exists and user has access
    const existingItem = await prisma.whiteboardItem.findUnique({
      where: { id: itemId },
      include: {
        whiteboard: {
          include: {
            chatRoom: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "아이템을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if user is a member
    const isMember = existingItem.whiteboard.chatRoom.members.some(
      (member) => member.userId === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "채팅방 멤버만 아이템을 수정할 수 있습니다" },
        { status: 403 }
      );
    }

    // Update item
    const item = await prisma.whiteboardItem.update({
      where: { id: itemId },
      data: {
        ...(content !== undefined && { content }),
        ...(position !== undefined && { position: JSON.stringify(position) }),
        ...(size !== undefined && { size: JSON.stringify(size) }),
        ...(style !== undefined && { style: style ? JSON.stringify(style) : null }),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error updating whiteboard item:", error);
    return NextResponse.json(
      { error: "아이템 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a whiteboard item
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
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { error: "아이템 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // Check if item exists and user has access
    const existingItem = await prisma.whiteboardItem.findUnique({
      where: { id: itemId },
      include: {
        whiteboard: {
          include: {
            chatRoom: {
              include: {
                members: true,
              },
            },
          },
        },
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "아이템을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if user is a member
    const isMember = existingItem.whiteboard.chatRoom.members.some(
      (member) => member.userId === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { error: "채팅방 멤버만 아이템을 삭제할 수 있습니다" },
        { status: 403 }
      );
    }

    // Delete item
    await prisma.whiteboardItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting whiteboard item:", error);
    return NextResponse.json(
      { error: "아이템 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
