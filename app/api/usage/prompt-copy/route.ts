import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ensurePromptCopyAllowed } from "@/lib/plan";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    await ensurePromptCopyAllowed(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking prompt copy:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "프롬프트 복사 한도를 초과했습니다" },
      { status: 429 }
    );
  }
}


