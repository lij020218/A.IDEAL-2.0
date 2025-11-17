"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import {
  FileText,
  Target,
  BookOpen,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface DashboardStats {
  promptsCount: number;
  challengesCount: number;
  learningTopicsCount: number;
  publicPromptsCount: number;
  totalViews: number;
  totalRatings: number;
  recentPrompts: any[];
  recentChallenges: any[];
  recentLearning: any[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json().catch(() => ({ error: "알 수 없는 오류" }));
        console.error("Error fetching dashboard data:", errorData);
        // 에러가 발생해도 기본값으로 표시
        setStats({
          promptsCount: 0,
          challengesCount: 0,
          learningTopicsCount: 0,
          publicPromptsCount: 0,
          totalViews: 0,
          totalRatings: 0,
          recentPrompts: [],
          recentChallenges: [],
          recentLearning: [],
        });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // 네트워크 오류 등 발생 시 기본값 설정
      setStats({
        promptsCount: 0,
        challengesCount: 0,
        learningTopicsCount: 0,
        publicPromptsCount: 0,
        totalViews: 0,
        totalRatings: 0,
        recentPrompts: [],
        recentChallenges: [],
        recentLearning: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Global Background Effects */}
        <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
        <div className="fixed inset-0 hero-grain pointer-events-none"></div>
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // stats가 null이면 기본값 사용
  const displayStats = stats || {
    promptsCount: 0,
    challengesCount: 0,
    learningTopicsCount: 0,
    publicPromptsCount: 0,
    totalViews: 0,
    totalRatings: 0,
    recentPrompts: [],
    recentChallenges: [],
    recentLearning: [],
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground dark:text-white/90 mb-2">대시보드</h1>
          <p className="text-muted-foreground dark:text-white/80">
            {session?.user?.name || session?.user?.email}님의 활동 현황을 확인하세요
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 backdrop-blur-sm border border-blue-500/20 dark:border-blue-500/30 flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/15">
                <FileText className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 dark:text-white/90">{displayStats.promptsCount}</div>
            <div className="text-sm text-muted-foreground dark:text-white/80">저장된 프롬프트</div>
          </div>

          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 backdrop-blur-sm border border-purple-500/20 dark:border-purple-500/30 flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/15">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 dark:text-white/90">{displayStats.challengesCount}</div>
            <div className="text-sm text-muted-foreground dark:text-white/80">도전 과제</div>
          </div>

          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-green-500/10 dark:bg-green-500/20 backdrop-blur-sm border border-green-500/20 dark:border-green-500/30 flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/15">
                <BookOpen className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 dark:text-white/90">{displayStats.learningTopicsCount}</div>
            <div className="text-sm text-muted-foreground dark:text-white/80">학습 주제</div>
          </div>

          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 backdrop-blur-sm border border-orange-500/20 dark:border-orange-500/30 flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/15">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-1 dark:text-white/90">{displayStats.totalViews}</div>
            <div className="text-sm text-muted-foreground dark:text-white/80">총 조회수</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Prompts */}
          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-white/90">최근 프롬프트</h2>
              <Link
                href="/prompts/list"
                className="text-sm text-black dark:text-white hover:opacity-80 flex items-center gap-1 transition-opacity"
              >
                전체보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {displayStats.recentPrompts && displayStats.recentPrompts.length > 0 ? (
              <div className="space-y-4">
                {displayStats.recentPrompts.slice(0, 5).map((prompt) => (
                  <Link
                    key={prompt.id}
                    href={`/prompt/${prompt.id}`}
                    className="block p-3 rounded-lg bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 transition-all shadow-md shadow-black/5 dark:shadow-black/10"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="h-4 w-4 text-[#ADD8E6] dark:text-[#00FFC8] mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1 dark:text-white/90">{prompt.topic}</h3>
                        <p className="text-xs text-muted-foreground dark:text-white/80 mt-1">
                          {formatDistanceToNow(new Date(prompt.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground dark:text-white/80">
                <p className="text-sm">아직 프롬프트가 없습니다</p>
                <Link
                  href="/generate"
                  className="text-sm text-[#ADD8E6] dark:text-[#00FFC8] hover:opacity-80 mt-2 inline-block transition-opacity"
                >
                  프롬프트 생성하기
                </Link>
              </div>
            )}
          </div>

          {/* Recent Challenges */}
          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-white/90">최근 도전</h2>
              <Link
                href="/challengers"
                className="text-sm text-black dark:text-white hover:opacity-80 flex items-center gap-1 transition-opacity"
              >
                전체보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {displayStats.recentChallenges && displayStats.recentChallenges.length > 0 ? (
              <div className="space-y-4">
                {displayStats.recentChallenges.slice(0, 5).map((challenge) => (
                  <Link
                    key={challenge.id}
                    href={`/challengers/${challenge.id}`}
                    className="block p-3 rounded-lg bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 transition-all shadow-md shadow-black/5 dark:shadow-black/10"
                  >
                    <div className="flex items-start gap-3">
                      <Target className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1 dark:text-white/90">{challenge.title}</h3>
                        <p className="text-xs text-muted-foreground dark:text-white/80 mt-1">
                          {formatDistanceToNow(new Date(challenge.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground dark:text-white/80">
                <p className="text-sm">아직 도전이 없습니다</p>
                <Link
                  href="/challengers/new"
                  className="text-sm text-[#ADD8E6] dark:text-[#00FFC8] hover:opacity-80 mt-2 inline-block transition-opacity"
                >
                  도전 올리기
                </Link>
              </div>
            )}
          </div>

          {/* Recent Learning */}
          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold dark:text-white/90">최근 학습</h2>
              <Link
                href="/grow"
                className="text-sm text-black dark:text-white hover:opacity-80 flex items-center gap-1 transition-opacity"
              >
                전체보기
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {displayStats.recentLearning && displayStats.recentLearning.length > 0 ? (
              <div className="space-y-4">
                {displayStats.recentLearning.slice(0, 5).map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/grow/${topic.id}`}
                    className="block p-3 rounded-lg bg-white/40 dark:bg-white/5 backdrop-blur-sm border border-white/30 dark:border-white/10 hover:bg-white/50 dark:hover:bg-white/10 transition-all shadow-md shadow-black/5 dark:shadow-black/10"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1 dark:text-white/90">{topic.title}</h3>
                        <p className="text-xs text-muted-foreground dark:text-white/80 mt-1">
                          {formatDistanceToNow(new Date(topic.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground dark:text-white/80">
                <p className="text-sm">아직 학습 주제가 없습니다</p>
                <Link
                  href="/grow/new"
                  className="text-sm text-[#ADD8E6] dark:text-[#00FFC8] hover:opacity-80 mt-2 inline-block transition-opacity"
                >
                  학습 시작하기
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/generate"
            className="card-aurora rounded-xl p-6 hover:shadow-xl transition-all flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-lg bg-primary/10 dark:bg-primary/20 backdrop-blur-sm border border-primary/20 dark:border-primary/30 flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/15">
              <Sparkles className="h-6 w-6 text-[#ADD8E6] dark:text-[#00FFC8]" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 dark:text-white/90">프롬프트 생성</h3>
              <p className="text-sm text-muted-foreground dark:text-white/80">새로운 프롬프트 만들기</p>
            </div>
          </Link>

          <Link
            href="/challengers/new"
            className="card-aurora rounded-xl p-6 hover:shadow-xl transition-all flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 backdrop-blur-sm border border-purple-500/20 dark:border-purple-500/30 flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/15">
              <Target className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 dark:text-white/90">도전 올리기</h3>
              <p className="text-sm text-muted-foreground dark:text-white/80">프로젝트 공유하기</p>
            </div>
          </Link>

          <Link
            href="/grow/new"
            className="card-aurora rounded-xl p-6 hover:shadow-xl transition-all flex items-center gap-4"
          >
            <div className="h-12 w-12 rounded-lg bg-green-500/10 dark:bg-green-500/20 backdrop-blur-sm border border-green-500/20 dark:border-green-500/30 flex items-center justify-center shadow-lg shadow-black/5 dark:shadow-black/15">
              <BookOpen className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <h3 className="font-semibold mb-1 dark:text-white/90">학습 시작</h3>
              <p className="text-sm text-muted-foreground dark:text-white/80">새로운 학습 주제 만들기</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}

