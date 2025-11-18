import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET - Get all prompts for public display with advanced search and filtering
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const aiProvider = searchParams.get("aiProvider") || "";
    const sortOrder = searchParams.get("sort") || "latest"; // latest, popular, rating
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    // Build where clause
    const where: any = {
      parentId: null,
      isPublic: true,
    };

    // Search query filter (SQLite doesn't support case-insensitive mode, so we'll filter in memory)
    // For SQLite, we'll use contains which is case-sensitive, but we can improve this later
    if (query) {
      where.OR = [
        { topic: { contains: query } },
        { prompt: { contains: query } },
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // AI Provider filter
    if (aiProvider) {
      where.aiProvider = aiProvider;
    }

    // Build orderBy clause
    let orderBy: any = { createdAt: "desc" };
    if (sortOrder === "popular") {
      orderBy = { views: "desc" };
    } else if (sortOrder === "rating") {
      orderBy = { averageRating: "desc" };
    } else if (sortOrder === "latest") {
      orderBy = { createdAt: "desc" };
    }

    // Fetch prompts
    const [prompts, totalCount] = await Promise.all([
      prisma.prompt.findMany({
        where,
        select: {
          id: true,
          topic: true,
          prompt: true,
          recommendedTools: true,
          tips: true,
          imageUrl: true,
          aiProvider: true,
          aiModel: true,
          views: true,
          averageRating: true,
          ratingCount: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.prompt.count({ where }),
    ]);

    // Parse JSON fields
    const parsedPrompts = prompts.map((prompt) => ({
      ...prompt,
      recommendedTools: JSON.parse(prompt.recommendedTools),
      tips: JSON.parse(prompt.tips),
    }));

    // Save search history if user is logged in (only if SearchHistory model exists)
    const session = await getServerSession(authOptions);
    if (session?.user?.id && query) {
      try {
        // Check if searchHistory model exists in Prisma Client
        if ('searchHistory' in prisma && typeof (prisma as any).searchHistory?.create === 'function') {
          await (prisma as any).searchHistory.create({
            data: {
              userId: session.user.id,
              query,
              filters: JSON.stringify({ category, aiProvider, sortOrder }),
            },
          });
        }
      } catch (historyError) {
        // Ignore history save errors (model might not be available yet)
        console.error("Error saving search history:", historyError);
      }
    }

    return NextResponse.json({
      prompts: parsedPrompts,
      total: totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching public prompts:", error);
    return NextResponse.json(
      { error: "프롬프트 목록을 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

