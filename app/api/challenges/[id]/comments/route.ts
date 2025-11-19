import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: 특정 도전의 댓글 목록 조회 (답글 포함)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const comments = await prisma.comment.findMany({
      where: {
        challengeId: params.id,
        parentId: null, // 최상위 댓글만
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "댓글을 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

// POST: 댓글 또는 답글 작성
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

    const body = await req.json();
    const { content, parentId } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "댓글 내용을 입력해주세요" },
        { status: 400 }
      );
    }

    // If parentId is provided, verify it exists and belongs to this challenge
    if (parentId) {
      const parentComment = await prisma.comment.findFirst({
        where: {
          id: parentId,
          challengeId: params.id,
        },
      });

      if (!parentComment) {
        return NextResponse.json(
          { error: "부모 댓글을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
    }

    // Get challenge author to send notification
    const challenge = await prisma.challenge.findUnique({
      where: { id: params.id },
      select: {
        userId: true,
        title: true,
      },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: "게시글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        challengeId: params.id,
        userId: session.user.id,
        content: content.trim(),
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Create notification for the challenge author (if not commenting on own post)
    if (challenge.userId !== session.user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: challenge.userId,
            type: "COMMENT",
            title: "새 댓글",
            message: `${session.user.name || session.user.email}님이 "${challenge.title}" 게시글에 댓글을 남겼습니다.`,
            link: `/challengers/${params.id}`,
          },
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
        // Don't fail the comment creation if notification fails
      }
    }

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "댓글 작성에 실패했습니다" },
      { status: 500 }
    );
  }
}

