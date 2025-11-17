"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen, Calendar, TrendingUp, Clock, Target, Loader2, Trash2 } from "lucide-react";
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
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <section className="relative py-16 px-4">
        <main className="container mx-auto px-4 py-12 relative z-10">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-4">성장하기</h1>
            <p className="text-muted-foreground text-lg">
              <span className="text-foreground font-semibold">A.IDEAL</span>과 함께 <span className="text-foreground">성장</span>하세요
            </p>
          </div>
          <Button
            onClick={() => router.push("/grow/new")}
            size="lg"
            className="gap-2 bg-white/50 backdrop-blur-md border-2 border-white/40 text-foreground hover:bg-white/60 dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 dark:text-foreground dark:hover:bg-white/15 shadow-lg shadow-black/5 dark:shadow-black/20"
          >
            <Plus className="h-5 w-5" />
            새 학습 시작하기
          </Button>
        </div>

        {/* Topics Grid */}
        {topics.length === 0 ? (
          <div className="card-container rounded-xl p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-foreground/10 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold">아직 학습 주제가 없습니다</h3>
              <p className="text-muted-foreground max-w-md">
                새로운 학습 주제를 만들고 AI와 함께 체계적인 커리큘럼으로 성장해보세요
              </p>
              <Button
                onClick={() => router.push("/grow/new")}
                size="lg"
                className="gap-2 mt-4 bg-white/50 backdrop-blur-md border-2 border-white/40 text-foreground hover:bg-white/60 dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 dark:text-foreground dark:hover:bg-white/15 shadow-lg shadow-black/5 dark:shadow-black/20"
              >
                <Plus className="h-5 w-5" />
                첫 학습 시작하기
              </Button>
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
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2 line-clamp-2">
                        {topic.title}
                      </h3>
                      {topic.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {topic.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-2 flex items-center gap-2">
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
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
              <div className="h-12 w-12 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-6 w-6 text-foreground" />
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
              <div className="h-12 w-12 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-6 w-6 text-foreground" />
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
              <div className="h-12 w-12 rounded-lg bg-foreground/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-foreground" />
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
      </section>
    </div>
  );
}
