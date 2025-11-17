import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE - Delete a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // Get the comment
    const comment = await prisma.comment.findUnique({
      where: { id: params.commentId },
      include: {
        challenge: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!comment) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Verify this comment belongs to the challenge
    if (comment.challengeId !== params.id) {
      return NextResponse.json(
        { error: "댓글이 이 도전에 속하지 않습니다" },
        { status: 403 }
      );
    }

    // Check if user is the comment author or challenge owner
    const isCommentAuthor = comment.userId === session.user.id;
    const isChallengeOwner = comment.challenge?.userId === session.user.id;

    if (!isCommentAuthor && !isChallengeOwner) {
      return NextResponse.json(
        { error: "댓글을 삭제할 권한이 없습니다" },
        { status: 403 }
      );
    }

    // Delete the comment (replies will be deleted due to cascade)
    await prisma.comment.delete({
      where: { id: params.commentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "댓글 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}

