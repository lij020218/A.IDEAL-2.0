import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const { rating } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "별점은 1-5 사이여야 합니다" },
        { status: 400 }
      );
    }

    // Check if prompt exists
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Upsert rating (create or update)
    await prisma.promptRating.upsert({
      where: {
        promptId_userId: {
          promptId: params.id,
          userId: session.user.id,
        },
      },
      update: {
        rating,
      },
      create: {
        promptId: params.id,
        userId: session.user.id,
        rating,
      },
    });

    // Recalculate average rating
    const ratings = await prisma.promptRating.findMany({
      where: { promptId: params.id },
    });

    const averageRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
    const ratingCount = ratings.length;

    // Update prompt with new average
    await prisma.prompt.update({
      where: { id: params.id },
      data: {
        averageRating,
        ratingCount,
      },
    });

    return NextResponse.json({
      success: true,
      averageRating,
      ratingCount,
    });
  } catch (error) {
    console.error("Error rating prompt:", error);
    return NextResponse.json(
      { error: "별점 등록에 실패했습니다" },
      { status: 500 }
    );
  }
}
