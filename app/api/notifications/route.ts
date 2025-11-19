import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch user notifications
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    if (!userId) {
      console.error("Session user ID is missing:", session);
      return NextResponse.json(
        { error: "사용자 정보를 가져올 수 없습니다" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: any = {
      userId: userId,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    let notifications = [];
    let unreadCount = 0;

    try {
      notifications = await prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
      });

      unreadCount = await prisma.notification.count({
        where: {
          userId: userId,
          isRead: false,
        },
      });
    } catch (dbError) {
      console.error("Database error in notifications GET:", dbError);
      // 테이블이 없거나 스키마가 맞지 않는 경우 빈 배열 반환
      if (dbError instanceof Error && dbError.message.includes("does not exist")) {
        return NextResponse.json({
          notifications: [],
          unreadCount: 0,
        });
      }
      throw dbError;
    }

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { 
        error: "알림을 가져오는 중 오류가 발생했습니다",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// PATCH - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    if (!userId) {
      console.error("Session user ID is missing:", session);
      return NextResponse.json(
        { error: "사용자 정보를 가져올 수 없습니다" },
        { status: 401 }
      );
    }

    const { notificationIds, markAllAsRead } = await req.json();

    if (markAllAsRead) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: userId,
        },
        data: {
          isRead: true,
        },
      });
    } else {
      return NextResponse.json(
        { error: "올바른 요청 형식이 아닙니다" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notifications:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { 
        error: "알림 업데이트 중 오류가 발생했습니다",
        details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}

