import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get user's search history
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    const history = await prisma.searchHistory.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      distinct: ["query"], // 중복 제거
    });

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Error fetching search history:", error);
    return NextResponse.json(
      { error: "검색 기록을 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE - Clear search history
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    await prisma.searchHistory.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing search history:", error);
    return NextResponse.json(
      { error: "검색 기록 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}

