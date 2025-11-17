"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Crown, Loader2 } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

type PlanType = "free" | "pro";

interface UsageLog {
  id: string;
  type: "prompt_copy" | "growth_content";
  metadata?: Record<string, any> | null;
  createdAt: string;
}

interface PlanStatus {
  plan: PlanType;
  promptCopiesToday: number;
  promptCopyLimit: number | null;
  growthContentToday: number;
  growthContentLimit: number | null;
}

interface PlanResponse extends PlanStatus {
  logs: UsageLog[];
}

const planConfigs = [
  {
    id: "free",
    name: "Free",
    price: { ko: "무료", en: "Free" },
    usd: { ko: "$0", en: "$0" },
    description: {
      ko: "시작하기 좋은 기본 플랜",
      en: "Perfect for getting started",
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: { ko: "₩4,900 / 월", en: "₩4,900 / month" },
    usd: { ko: "$3.99 / mo", en: "$3.99 / mo" },
    description: {
      ko: "창작/학습을 무제한으로 즐기고 싶은 분들께 추천",
      en: "Unlimited copies and learning for power users",
    },
  },
];

export default function BillingPage() {
  const { translate, language } = useLanguage();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [data, setData] = useState<PlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchPlan();
  }, []);

  const fetchPlan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/billing/plan");
      if (response.ok) {
        const json: PlanResponse = await response.json();
        setData(json);
      } else {
        const err = await response.json().catch(() => ({}));
        console.error("Failed to load plan:", err);
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlan = async (plan: PlanType) => {
    setIsUpdating(true);
    try {
      const response = await fetch("/api/billing/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (response.ok) {
        const json: PlanResponse = await response.json();
        setData(json);
      } else {
        const err = await response.json().catch(() => ({}));
      alert(err.error || translate("플랜 변경에 실패했습니다"));
      }
    } catch (error) {
      console.error("Error updating plan:", error);
    alert(translate("플랜 변경에 실패했습니다"));
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md px-3 py-1 text-xs font-semibold text-foreground dark:text-white shadow-lg shadow-black/5 dark:shadow-black/15">
            <Crown className="h-4 w-4" />
            {translate("플랜 선택")}
          </div>
          <h1 className="mt-4 text-4xl font-bold text-foreground dark:text-white/90">A.IDEAL {translate("플랜")}</h1>
          <p className="mt-2 text-muted-foreground dark:text-white/80">
            {translate("사용량이 늘어날수록 Pro 플랜으로 더 많은 AI 기능을 이용해 보세요.")}
          </p>
        </div>

        {isLoading || !data ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-foreground dark:text-white/90" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              {planConfigs.map((plan) => {
                const isCurrent = data.plan === plan.id;
                const buttonLabel = isCurrent
                  ? translate("현재 이용 중")
                  : plan.id === "pro"
                  ? translate("업그레이드하기")
                  : translate("무료 플랜으로 전환");
                return (
                  <div
                    key={plan.id}
                    className={`card-aurora rounded-2xl p-6 border-2 ${
                      isCurrent ? "border-white/60 dark:border-white/40 shadow-xl shadow-white/20 dark:shadow-white/30" : "border-white/40 dark:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-foreground dark:text-white/90">{plan.name}</h2>
                        <p className="text-sm text-muted-foreground dark:text-white/80">
                          {plan.description[language]}
                        </p>
                      </div>
                      {plan.id === "pro" && (
                        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/20 text-foreground dark:text-white shadow-lg shadow-black/5 dark:shadow-black/15">
                          {translate("인기")}
                        </span>
                      )}
                    </div>
                    <div className="mt-4">
                      <p className="text-3xl font-bold text-foreground dark:text-white/90">{plan.price[language]}</p>
                      <p className="text-sm text-muted-foreground dark:text-white/80">{plan.usd[language]}</p>
                    </div>
                    <button
                      disabled={isCurrent || isUpdating}
                      onClick={() => updatePlan(plan.id as PlanType)}
                      className={`mt-6 w-full rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                        isCurrent
                          ? "bg-white/50 dark:bg-white/5 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-muted-foreground dark:text-white/60 cursor-default shadow-lg shadow-black/5 dark:shadow-black/15"
                          : "border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground dark:text-white hover:bg-white/70 dark:hover:bg-white/15 shadow-lg shadow-black/8 dark:shadow-black/15"
                      }`}
                    >
                      {buttonLabel}
                    </button>
                  </div>
                );
              })}
            </div>

            <section className="card-aurora rounded-2xl p-6">
              <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white/90">{translate("사용량 현황")}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UsageCard
                  title={translate("프롬프트 복사")}
                  used={data.promptCopiesToday}
                  limit={data.promptCopyLimit}
                  unit={language === "ko" ? "회 / 일" : "per day"}
                />
                <UsageCard
                  title={translate("성장하기 콘텐츠 생성")}
                  used={data.growthContentToday}
                  limit={data.growthContentLimit}
                  unit={language === "ko" ? "개 / 일" : "per day"}
                />
              </div>
            </section>

            <section className="card-aurora rounded-2xl p-6 mt-8">
              <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white/90">{translate("최근 사용 기록")}</h2>
              {data.logs && data.logs.length > 0 ? (
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {data.logs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-xl border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md px-4 py-3 shadow-lg shadow-black/5 dark:shadow-black/15"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground dark:text-white/90">
                          {log.type === "prompt_copy"
                            ? translate("프롬프트 복사")
                            : translate("성장하기 생성")}
                        </p>
                        {log.metadata?.total ? (
                          <p className="text-xs text-muted-foreground dark:text-white/80">
                            {language === "ko"
                              ? `누적 ${log.metadata.total}회`
                              : `Total ${log.metadata.total} times`}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xs text-muted-foreground dark:text-white/80">
                        {new Date(log.createdAt).toLocaleString(
                          language === "ko" ? "ko-KR" : "en-US",
                          {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground dark:text-white/80">
                  {translate("아직 사용 기록이 없습니다.")}
                </p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function UsageCard({
  title,
  used,
  limit,
  unit,
}: {
  title: string;
  used: number;
  limit: number | null;
  unit: string;
}) {
  const { translate } = useLanguage();
  const displayLimit = limit === null ? translate("무제한") : `${limit}${unit}`;
  const percentage =
    limit === null ? 0 : Math.min(100, Math.round((used / limit) * 100));

  return (
    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border-2 border-white/40 dark:border-white/20 rounded-2xl p-4 shadow-lg shadow-black/5 dark:shadow-black/15">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-sm text-muted-foreground dark:text-white/80">{title}</p>
          <p className="text-xl font-semibold text-foreground dark:text-white/90">
            {used} <span className="text-sm text-muted-foreground dark:text-white/80">/{displayLimit}</span>
          </p>
        </div>
      </div>
      {limit !== null && (
        <div className="h-2 w-full rounded-full bg-white/30 dark:bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground/60 dark:bg-white/40 transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}


