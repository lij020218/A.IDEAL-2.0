"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Calendar, TrendingUp, Clock, Target, Loader2, Trash2, Rocket } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface GrowthTopic {
  id: string;
  title: string;
  description: string | null;
  goal: string;
  level: string;
  duration: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  _count: {
    curriculum: number;
    progress: number;
  };
  progressPercentage: number;
}

export default function GrowPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topics, setTopics] = useState<GrowthTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchTopics();
    }
  }, [status, router]);

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/growth/topics");
      if (response.ok) {
        const data = await response.json();
        setTopics(data.topics);
      }
    } catch (error) {
      console.error("Error fetching topics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTopic = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId) return;
    const confirmed = window.confirm("이 학습 주제를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.");
    if (!confirmed) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/growth/topics/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`삭제에 실패했습니다: ${err.error || res.status}`);
        return;
      }
      setTopics((prev) => prev.filter((t) => t.id !== id));
    } catch (error) {
      console.error("Failed to delete topic:", error);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "초급",
      intermediate: "중급",
      advanced: "고급",
    };
    return labels[level] || level;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: "진행 중",
      paused: "일시정지",
      completed: "완료",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/10 text-green-500",
      paused: "bg-yellow-500/10 text-yellow-500",
      completed: "bg-blue-500/10 text-blue-500",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-blue-50/30 to-white relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-sky-100/30 rounded-full blur-3xl" />
      </div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <main>
        {/* Header Section */}
        <div className="mb-12">
          <div className="text-center">
            {/* --- 정밀 구현: Hyper-Realistic 3D Glass Icon --- */}
            <div className="relative mx-auto mb-6 w-16 h-16 group cursor-pointer select-none">

              {/* 1. 바닥 그림자 */}
              <div className="absolute inset-0 rounded-[18px] bg-cyan-400/40 blur-lg transform translate-y-2 scale-95 transition-all duration-500 group-hover:scale-100 group-hover:bg-cyan-500/50" />

              {/* 2. 메인 컨테이너 - 밝은 시안/하늘색 */}
              <div
                className="relative w-full h-full rounded-[18px] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(180deg, #E0F7FA 0%, #B2EBF2 40%, #80DEEA 100%)',
                  boxShadow: `
                    inset 0 2px 3px 0 rgba(255, 255, 255, 0.9),
                    inset 0 -2px 4px 0 rgba(0, 150, 180, 0.15),
                    0 0 0 2px rgba(128, 222, 234, 0.6),
                    0 6px 16px -3px rgba(0, 188, 212, 0.5)
                  `
                }}
              >

                {/* 3. 상단 물광 반사 */}
                <div
                  className="absolute top-0 left-0 right-0 h-[55%] rounded-t-[18px]"
                  style={{
                    background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)',
                  }}
                />

                {/* 4. 내부 아이콘 - 시안 색상 */}
                <Rocket
                  className="relative z-10 w-7 h-7 transition-all duration-300 group-hover:scale-105"
                  color="#0891B2"
                  strokeWidth={2.2}
                  style={{
                    filter: 'drop-shadow(0 1px 2px rgba(8, 145, 178, 0.3))'
                  }}
                />

                {/* 5. 하단 미세 광택 */}
                <div className="absolute bottom-1.5 left-2 right-2 h-[6px] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              </div>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-foreground dark:text-white/90">성장하기</span>
            </h1>
            <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto mb-6">
              AI가 설계하는 맞춤 학습 경로로 성장하세요
            </p>
            <button
              onClick={() => router.push("/grow/new")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-cyan-200/50 bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md text-cyan-500 hover:from-cyan-100/80 hover:to-blue-100/80 dark:from-cyan-500/20 dark:to-blue-500/20 dark:border-cyan-400/30 dark:text-cyan-400 dark:hover:from-cyan-500/30 dark:hover:to-blue-500/30 transition-all font-semibold text-sm shadow-lg shadow-cyan-500/20"
            >
              <Plus className="h-4 w-4" />
              새 학습 시작하기
            </button>
          </div>
        </div>

        {/* Topics Grid */}
        {topics.length === 0 ? (
          <div className="card-container rounded-xl p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center shadow-lg">
                <BookOpen className="h-8 w-8 text-cyan-500" />
              </div>
              <h3 className="text-xl font-semibold">아직 학습 주제가 없습니다</h3>
              <p className="text-muted-foreground max-w-md">
                새로운 학습 주제를 만들고 AI와 함께 체계적인 커리큘럼으로 성장해보세요
              </p>
              <button
                onClick={() => router.push("/grow/new")}
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-2xl border border-cyan-200/50 bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md text-cyan-500 hover:from-cyan-100/80 hover:to-blue-100/80 dark:from-cyan-500/20 dark:to-blue-500/20 dark:border-cyan-400/30 dark:text-cyan-400 dark:hover:from-cyan-500/30 dark:hover:to-blue-500/30 transition-all font-semibold text-sm shadow-lg shadow-cyan-500/20"
              >
                <Plus className="h-4 w-4" />
                첫 학습 시작하기
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <Link
                key={topic.id}
                href={`/grow/${topic.id}`}
                className="card-aurora rounded-xl p-6 hover:shadow-lg transition-all block"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-xl font-semibold line-clamp-2 flex-1">
                          {topic.title}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${getStatusColor(
                              topic.status
                            )}`}
                          >
                            {getStatusLabel(topic.status)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={(e) => deleteTopic(e, topic.id)}
                            aria-label="삭제"
                            title="삭제"
                          >
                            {deletingId === topic.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {topic.description && (() => {
                        // description이 JSON 배열(파일 URL들)인지 확인
                        try {
                          const parsed = JSON.parse(topic.description);
                          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
                            // 파일 URL 배열이면 표시하지 않음
                            return null;
                          }
                        } catch {
                          // JSON이 아니면 일반 텍스트로 표시
                        }
                        // 일반 텍스트 description만 표시
                        return (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {topic.description}
                          </p>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span className="line-clamp-1">{topic.goal}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{getLevelLabel(topic.level)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{topic.duration}일</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-auto">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">학습 진도</span>
                      <span className="font-medium">
                        {topic._count.progress} / {topic._count.curriculum}일
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-foreground transition-all"
                        style={{ width: `${topic.progressPercentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
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
        )}

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Calendar className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">체계적인 커리큘럼</h3>
                <p className="text-sm text-muted-foreground">
                  AI가 당신의 목표와 수준에 맞는 학습 계획을 자동으로 설계합니다
                </p>
              </div>
            </div>
          </div>

          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                <BookOpen className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">AI 튜터 모드</h3>
                <p className="text-sm text-muted-foreground">
                  학습 중 궁금한 점은 언제든지 AI에게 질문하고 답변을 받으세요
                </p>
              </div>
            </div>
          </div>

          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                <TrendingUp className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">진도 추적</h3>
                <p className="text-sm text-muted-foreground">
                  학습 진행 상황을 자동으로 저장하고 이어서 학습할 수 있습니다
                </p>
              </div>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
