import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPlanStatus, setUserPlan, PlanType, getUsageLogs } from "@/lib/plan";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const [status, logs] = await Promise.all([
      getPlanStatus(session.user.id),
      getUsageLogs(session.user.id, 20),
    ]);
    return NextResponse.json({ ...status, logs });
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "플랜 정보를 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const plan = (body.plan as PlanType) || "free";
    if (!["free", "pro"].includes(plan)) {
      return NextResponse.json(
        { error: "잘못된 플랜입니다" },
        { status: 400 }
      );
    }

    await setUserPlan(session.user.id, plan);
    const [status, logs] = await Promise.all([
      getPlanStatus(session.user.id),
      getUsageLogs(session.user.id, 20),
    ]);
    return NextResponse.json({ ...status, logs });
  } catch (error) {
    console.error("Error updating plan:", error);
    return NextResponse.json(
      { error: "플랜을 변경하는 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}


