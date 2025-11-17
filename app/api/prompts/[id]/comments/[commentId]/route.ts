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

    // Prisma Client가 promptId를 인식하지 못하므로 raw SQL 사용
    console.log("[Delete Comment API] Using raw SQL");
    
    // 댓글 조회
    const rawComment = await prisma.$queryRaw<Array<{
      id: string;
      userId: string;
      promptId: string | null;
      challengeId: string | null;
    }>>`
      SELECT id, userId, promptId, challengeId
      FROM Comment
      WHERE id = ${params.commentId}
    `;
    
    if (rawComment.length === 0) {
      return NextResponse.json(
        { error: "댓글을 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    
    const comment = rawComment[0];
    
    // Verify this comment belongs to the prompt
    if (comment.promptId !== params.id) {
      return NextResponse.json(
        { error: "댓글이 이 프롬프트에 속하지 않습니다" },
        { status: 403 }
      );
    }

    // 프롬프트 소유자 조회
    let promptOwnerId: string | null = null;
    if (comment.promptId) {
      const prompt = await prisma.$queryRaw<Array<{ userId: string }>>`
        SELECT userId FROM Prompt WHERE id = ${comment.promptId}
      `;
      if (prompt.length > 0) {
        promptOwnerId = prompt[0].userId;
      }
    }

    // Check if user is the comment author or prompt owner
    const isCommentAuthor = comment.userId === session.user.id;
    const isPromptOwner = promptOwnerId === session.user.id;

    if (!isCommentAuthor && !isPromptOwner) {
      return NextResponse.json(
        { error: "댓글을 삭제할 권한이 없습니다" },
        { status: 403 }
      );
    }

    // Delete the comment (replies will be deleted due to cascade)
    await prisma.$executeRaw`
      DELETE FROM Comment WHERE id = ${params.commentId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { error: "댓글 삭제에 실패했습니다" },
      { status: 500 }
    );
  }
}

