import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const topics = await prisma.growthTopic.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        title: true,
        description: true,
        level: true,
        duration: true,
        goal: true,
        progress: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ topics });
  } catch (error) {
    console.error("Error fetching public growth topics:", error);
    return NextResponse.json(
      { error: "성장하기 목록을 가져오는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
