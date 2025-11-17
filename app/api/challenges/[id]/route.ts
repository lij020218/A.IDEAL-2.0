import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: {
        id: params.id,
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

    if (!challenge) {
      return NextResponse.json(
        { error: "도전을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: challenge.id,
      userId: challenge.userId,
      title: challenge.title,
      description: challenge.description,
      codeSnippet: challenge.codeSnippet,
      ideaDetails: challenge.ideaDetails,
      resumeUrl: challenge.resumeUrl,
      contactInfo: challenge.contactInfo,
      tags: JSON.parse(challenge.tags),
      createdAt: challenge.createdAt.toISOString(),
      author: {
        id: challenge.user.id,
        name: challenge.user.name,
        email: challenge.user.email,
      },
    });
  } catch (error) {
    console.error("Error fetching challenge:", error);
    return NextResponse.json(
      { error: "도전을 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

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

    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "도전을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (challenge.userId !== session.user.id) {
      return NextResponse.json(
        { error: "삭제 권한이 없습니다" },
        { status: 403 }
      );
    }

    await prisma.challenge.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "도전이 삭제되었습니다" });
  } catch (error) {
    console.error("Error deleting challenge:", error);
    return NextResponse.json(
      { error: "도전 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}
