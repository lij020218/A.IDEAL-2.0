import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function ensureFollowTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS Follow (
        id TEXT PRIMARY KEY,
        followerId TEXT NOT NULL,
        followingId TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS Follow_follower_following ON Follow(followerId, followingId);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS Follow_following_idx ON Follow(followingId);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS Follow_follower_idx ON Follow(followerId);
    `);
  } catch (error) {
    console.error("Error ensuring Follow table:", error);
  }
}

const hasFollowModel = () =>
  "follow" in prisma && typeof (prisma as any).follow?.create === "function";

async function findFollow(followerId: string, followingId: string) {
  if (hasFollowModel()) {
    return (prisma as any).follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });
  }

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM Follow WHERE followerId = ${followerId} AND followingId = ${followingId} LIMIT 1
  `;
  return rows.length ? rows[0] : null;
}

async function createFollowRecord(followerId: string, followingId: string) {
  if (hasFollowModel()) {
    return (prisma as any).follow.create({
      data: { followerId, followingId },
    });
  }

  const { randomUUID } = await import("crypto");
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO Follow (id, followerId, followingId, createdAt)
    VALUES (${id}, ${followerId}, ${followingId}, datetime('now'))
  `;
}

async function deleteFollowRecord(followerId: string, followingId: string) {
  if (hasFollowModel()) {
    return (prisma as any).follow.deleteMany({
      where: { followerId, followingId },
    });
  }

  await prisma.$executeRaw`
    DELETE FROM Follow WHERE followerId = ${followerId} AND followingId = ${followingId}
  `;
}

// POST - Follow a user
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFollowTable();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const targetUserId = params.id;

    // Cannot follow yourself
    if (session.user.id === targetUserId) {
      return NextResponse.json(
        { error: "자기 자신을 팔로우할 수 없습니다" },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await findFollow(session.user.id, targetUserId);

    if (existingFollow) {
      return NextResponse.json(
        { error: "이미 팔로우 중입니다" },
        { status: 400 }
      );
    }

    // Create follow relationship
    await createFollowRecord(session.user.id, targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "팔로우에 실패했습니다" },
      { status: 500 }
    );
  }
}

// DELETE - Unfollow a user
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFollowTable();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const targetUserId = params.id;

    // Delete follow relationship
    await deleteFollowRecord(session.user.id, targetUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "언팔로우에 실패했습니다" },
      { status: 500 }
    );
  }
}

// GET - Check if following
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await ensureFollowTable();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ isFollowing: false });
    }

    const targetUserId = params.id;

    const follow = await findFollow(session.user.id, targetUserId);

    return NextResponse.json({ isFollowing: !!follow });
  } catch (error) {
    console.error("Error checking follow status:", error);
    return NextResponse.json({ isFollowing: false });
  }
}

