import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all events for a chat room
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
        { error: "채팅방 멤버만 일정을 볼 수 있습니다" },
        { status: 403 }
      );
    }

    // Fetch all events
    const events = await prisma.event.findMany({
      where: { chatRoomId: chatRoom.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "일정 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST - Create a new event
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

    const { title, description, startDate, endDate, color } = await req.json();

    if (!title || !startDate) {
      return NextResponse.json(
        { error: "제목과 시작일은 필수입니다" },
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
        { error: "채팅방 멤버만 일정을 생성할 수 있습니다" },
        { status: 403 }
      );
    }

    // Create event
    const event = await prisma.event.create({
      data: {
        chatRoomId: chatRoom.id,
        userId: session.user.id,
        title,
        description: description || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        color: color || "#3b82f6",
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

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error creating event:", error);
    return NextResponse.json(
      { error: "일정 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PUT - Update an event
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

    const { eventId, title, description, startDate, endDate, color } = await req.json();

    if (!eventId) {
      return NextResponse.json(
        { error: "일정 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // Check if event exists and user is the creator
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (existingEvent.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인이 생성한 일정만 수정할 수 있습니다" },
        { status: 403 }
      );
    }

    // Update event
    const event = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(color && { color }),
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

    return NextResponse.json({ event });
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json(
      { error: "일정 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE - Delete an event
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
    const eventId = searchParams.get("eventId");

    if (!eventId) {
      return NextResponse.json(
        { error: "일정 ID가 필요합니다" },
        { status: 400 }
      );
    }

    // Check if event exists and user is the creator
    const existingEvent = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: "일정을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (existingEvent.userId !== session.user.id) {
      return NextResponse.json(
        { error: "본인이 생성한 일정만 삭제할 수 있습니다" },
        { status: 403 }
      );
    }

    // Delete event
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: "일정 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
