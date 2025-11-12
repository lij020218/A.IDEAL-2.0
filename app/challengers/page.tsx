"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Plus, Code, Lightbulb, FileText, Calendar } from "lucide-react";
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
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2 leading-tight">
                <span className="gradient-text">도전자들</span> 🚀
              </h1>
              <p className="text-xl text-muted-foreground leading-tight">
                함께 성장하고, 함께 도전할 동료를 찾아보세요
              </p>
            </div>
            {session && (
              <Link
                href="/challengers/new"
                className="btn-aurora px-6 py-3 rounded-lg flex items-center gap-2"
              >
                <Plus className="h-5 w-5" />
                도전 올리기
              </Link>
            )}
          </div>
        </div>

        {/* Challenges Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : challenges.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4">
              <Lightbulb className="h-20 w-20 mx-auto text-primary opacity-30" />
            </div>
            <h3 className="text-2xl font-bold mb-2">아직 도전이 없습니다</h3>
            <p className="text-muted-foreground">
              첫 번째 도전자가 되어보세요!
            </p>
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
                    <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs flex items-center gap-1">
                      <Code className="h-3 w-3" />
                      코드
                    </div>
                  )}
                  {challenge.ideaDetails && (
                    <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      아이디어
                    </div>
                  )}
                  {challenge.resumeUrl && (
                    <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs flex items-center gap-1">
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
      </div>
    </div>
  );
}
