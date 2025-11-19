"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Plus, Code, Lightbulb, FileText, Calendar, Loader2, Users, MessageSquare, Target, Rocket } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";

interface Challenge {
  id: string;
  title: string;
  description: string;
  codeSnippet?: string;
  ideaDetails?: string;
  resumeUrl?: string;
  tags: string[];
  createdAt: string;
  author: {
    name?: string;
    email: string;
  };
}

export default function ChallengersPage() {
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const response = await fetch("/api/challenges");
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-pink-50/30 to-white relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-fuchsia-100/30 rounded-full blur-3xl" />
      </div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md border border-purple-200/50 flex items-center justify-center shadow-lg mx-auto mb-4">
              <Users className="h-8 w-8 text-purple-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-foreground dark:text-white/90">도전자들</span>
            </h1>
            <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto mb-6">
              함께 성장하고, 함께 도전할 동료를 찾아보세요
            </p>
            {session && (
              <button
                onClick={() => window.location.href = "/challengers/new"}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md text-purple-500 hover:from-purple-100/80 hover:to-pink-100/80 dark:from-purple-500/20 dark:to-pink-500/20 dark:border-purple-400/30 dark:text-purple-400 dark:hover:from-purple-500/30 dark:hover:to-pink-500/30 transition-all font-semibold text-sm shadow-lg shadow-purple-500/20"
              >
                <Plus className="h-4 w-4" />
                도전 올리기
              </button>
            )}
          </div>
        </div>

        {/* Challenges Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20 card-aurora rounded-xl">
            <div className="mb-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md border border-purple-200/50 flex items-center justify-center shadow-lg mx-auto">
                <Lightbulb className="h-8 w-8 text-purple-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">아직 도전이 없습니다</h3>
            <p className="text-muted-foreground">
              첫 번째 도전자가 되어보세요!
            </p>
            {session && (
              <div className="mt-6">
                <button
                  onClick={() => window.location.href = "/challengers/new"}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md text-purple-500 hover:from-purple-100/80 hover:to-pink-100/80 dark:from-purple-500/20 dark:to-pink-500/20 dark:border-purple-400/30 dark:text-purple-400 dark:hover:from-purple-500/30 dark:hover:to-pink-500/30 transition-all font-semibold text-sm shadow-lg shadow-purple-500/20"
                >
                  <Plus className="h-4 w-4" />
                  도전 올리기
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.map((challenge) => (
                <Link
                  key={challenge.id}
                  href={`/challengers/${challenge.id}`}
                  className="card-aurora rounded-xl p-6 hover:shadow-lg transition-all block"
                >
                  <div className="mb-4">
                    <h3 className="text-xl font-bold mb-2 line-clamp-2">
                      {challenge.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {challenge.description}
                    </p>
                  </div>

                  {/* Icons for content types */}
                  <div className="flex gap-2 mb-4">
                    {challenge.codeSnippet && (
                      <div className="px-2 py-1 bg-foreground/10 text-foreground rounded text-xs flex items-center gap-1">
                        <Code className="h-3 w-3" />
                        코드
                      </div>
                    )}
                    {challenge.ideaDetails && (
                      <div className="px-2 py-1 bg-foreground/10 text-foreground rounded text-xs flex items-center gap-1">
                        <Lightbulb className="h-3 w-3" />
                        아이디어
                      </div>
                    )}
                    {challenge.resumeUrl && (
                      <div className="px-2 py-1 bg-foreground/10 text-foreground rounded text-xs flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        이력서
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {challenge.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {challenge.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-secondary text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      {challenge.author.name || "익명"}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(challenge.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
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
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md border border-purple-200/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                <MessageSquare className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">A.IDEAL SPACE</h3>
                <p className="text-sm text-muted-foreground">
                  팀원들과 실시간으로 소통하며 아이디어를 구체화하고 협업할 수 있습니다
                </p>
              </div>
            </div>
          </div>

          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md border border-purple-200/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Target className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">역할 기반 매칭</h3>
                <p className="text-sm text-muted-foreground">
                  디자이너, 개발자, 기획자 등 각자의 역할에 맞는 팀원을 찾을 수 있습니다
                </p>
              </div>
            </div>
          </div>

          <div className="card-aurora rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md border border-purple-200/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Rocket className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">아이디어 실현</h3>
                <p className="text-sm text-muted-foreground">
                  코드 리뷰, 아이디어 검증, 팀 빌딩까지 프로젝트 실현을 위한 모든 것
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-20">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 A.IDEAL - 함께 도전하고 성장하는 커뮤니티</p>
        </div>
      </footer>
    </div>
  );
}
