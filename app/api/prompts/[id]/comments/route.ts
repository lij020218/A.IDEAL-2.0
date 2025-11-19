import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all comments for a prompt
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Prisma Client가 promptId를 인식하지 못하므로 raw SQL 사용
    console.log("[Comments API] Fetching comments using raw SQL for prompt:", params.id);
    
    // PostgreSQL용 raw query - 모든 댓글 가져오기
    const allComments = await prisma.$queryRaw<Array<{
      id: string;
      content: string;
      userId: string;
      createdAt: Date;
      parentId: string | null;
      userName: string | null;
      userEmail: string;
    }>>`
      SELECT
        c.id,
        c.content,
        c."userId",
        c."createdAt",
        c."parentId",
        u.name as "userName",
        u.email as "userEmail"
      FROM "Comment" c
      INNER JOIN "User" u ON c."userId" = u.id
      WHERE c."promptId" = ${params.id}
      ORDER BY c."createdAt" ASC
    `;

    // 부모-자식 관계 구성
    const commentMap = new Map<string, any>();
    const topLevelComments: any[] = [];

    allComments.forEach((comment) => {
      const formattedComment = {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt instanceof Date
          ? comment.createdAt.toISOString()
          : new Date(comment.createdAt).toISOString(),
        user: {
          id: comment.userId,
          name: comment.userName,
          email: comment.userEmail,
        },
        replies: [],
      };
      commentMap.set(comment.id, formattedComment);

      if (!comment.parentId) {
        topLevelComments.push(formattedComment);
      } else {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies.push(formattedComment);
        }
      }
    });

    // 최상위 댓글을 생성 시간 역순으로 정렬
    topLevelComments.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    console.log("[Comments API] Found", topLevelComments.length, "top-level comments");
    return NextResponse.json({ comments: topLevelComments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "댓글을 불러오는데 실패했습니다", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Create a new comment or reply
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
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

    // Check if prompt exists and get author info
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        userId: true,
        topic: true,
      },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // If parentId is provided, verify it exists and belongs to this prompt
    if (parentId) {
      // Prisma Client가 promptId를 인식하지 못하므로 raw SQL 사용
      const rawParent = await prisma.$queryRaw<Array<{
        id: string;
        promptId: string | null;
      }>>`
        SELECT id, "promptId"
        FROM "Comment"
        WHERE id = ${parentId} AND "promptId" = ${params.id}
      `;
      
      if (rawParent.length === 0) {
        return NextResponse.json(
          { error: "부모 댓글을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
    }

    // Prisma Client가 promptId를 인식하지 못하므로 raw SQL 사용
    console.log("[Comments API] Creating comment using raw SQL");
    
    // SQLite용 ID 생성 (cuid 형식 - 25자)
    const { randomBytes } = await import('crypto');
    const timestamp = Date.now().toString(36);
    const random = randomBytes(12).toString('hex');
    const commentId = `c${timestamp}${random}`.substring(0, 25);
    
    await prisma.$executeRaw`
      INSERT INTO "Comment" (id, "promptId", "userId", content, "parentId", "createdAt", "updatedAt")
      VALUES (${commentId}, ${params.id}, ${session.user.id}, ${content.trim()}, ${parentId || null}, NOW(), NOW())
    `;
    
    // 생성된 댓글 조회
    const createdComment = await prisma.$queryRaw<Array<{
      id: string;
      content: string;
      userId: string;
      createdAt: Date;
      parentId: string | null;
      userName: string | null;
      userEmail: string;
    }>>`
      SELECT
        c.id,
        c.content,
        c."userId",
        c."createdAt",
        c."parentId",
        u.name as "userName",
        u.email as "userEmail"
      FROM "Comment" c
      INNER JOIN "User" u ON c."userId" = u.id
      WHERE c.id = ${commentId}
    `;

    if (createdComment.length === 0) {
      throw new Error("댓글 생성 후 조회에 실패했습니다");
    }

    const comment = {
      id: createdComment[0].id,
      content: createdComment[0].content,
      createdAt: createdComment[0].createdAt instanceof Date
        ? createdComment[0].createdAt.toISOString()
        : new Date(createdComment[0].createdAt).toISOString(),
      user: {
        id: createdComment[0].userId,
        name: createdComment[0].userName,
        email: createdComment[0].userEmail,
      },
      replies: [],
    };

    // Create notification for the prompt author (if not commenting on own prompt)
    if (prompt.userId && prompt.userId !== session.user.id) {
      try {
        await prisma.notification.create({
          data: {
            userId: prompt.userId,
            type: "COMMENT",
            title: "새 댓글",
            message: `${session.user.name || session.user.email}님이 "${prompt.topic}" 프롬프트에 댓글을 남겼습니다.`,
            link: `/prompt/${params.id}`,
          },
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
        // Don't fail the comment creation if notification fails
      }
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error("Error creating comment:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "댓글 작성에 실패했습니다", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

