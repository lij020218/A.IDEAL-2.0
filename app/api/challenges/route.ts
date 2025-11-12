import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 모든 도전 목록 조회
export async function GET() {
  try {
    const challenges = await prisma.challenge.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const formattedChallenges = challenges.map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      codeSnippet: challenge.codeSnippet,
      ideaDetails: challenge.ideaDetails,
      resumeUrl: challenge.resumeUrl,
      tags: JSON.parse(challenge.tags),
      createdAt: challenge.createdAt.toISOString(),
      author: {
        name: challenge.user.name,
        email: challenge.user.email,
      },
    }));

    return NextResponse.json({ challenges: formattedChallenges });
  } catch (error) {
    console.error("Error fetching challenges:", error);
    return NextResponse.json(
      { error: "도전 목록을 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST: 새 도전 생성
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, description, codeSnippet, ideaDetails, resumeUrl, contactInfo, tags } = body;

    if (!title || !description || !contactInfo) {
      return NextResponse.json(
        { error: "필수 정보를 입력해주세요" },
        { status: 400 }
      );
    }

    const challenge = await prisma.challenge.create({
      data: {
        userId: session.user.id,
        title,
        description,
        codeSnippet,
        ideaDetails,
        resumeUrl,
        contactInfo,
        tags: JSON.stringify(tags || []),
      },
    });

    return NextResponse.json({ challenge }, { status: 201 });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json(
      { error: "도전을 생성하는데 실패했습니다" },
      { status: 500 }
    );
  }
}
