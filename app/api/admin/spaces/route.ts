import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const chatRooms = await prisma.chatRoom.findMany({
      select: {
        id: true,
        createdAt: true,
        challenge: {
          select: {
            id: true,
            title: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            messages: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ chatRooms });
  } catch (error) {
    console.error("Error fetching chat rooms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
