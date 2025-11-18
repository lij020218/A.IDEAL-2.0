import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generalLimiter } from "@/lib/rate-limiter";

// Follow 모델이 Prisma schema에 정의되어 있으므로 직접 사용
async function findFollow(followerId: string, followingId: string) {
  return prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId,
        followingId,
      },
    },
  });
}

async function createFollowRecord(followerId: string, followingId: string) {
  return prisma.follow.create({
    data: { followerId, followingId },
  });
}

async function deleteFollowRecord(followerId: string, followingId: string) {
  return prisma.follow.deleteMany({
    where: { followerId, followingId },
  });
}

// POST - Follow a user
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Rate limiting
    if (session?.user?.id) {
      const rateLimitResult = await generalLimiter.check(`follow:${session.user.id}`);
      if (!rateLimitResult.success) {
        return NextResponse.json(
          { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
          { status: 429 }
        );
      }
    }
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

