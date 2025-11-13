"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import PromptCard from "@/components/PromptCard";
import UserPromptCard from "@/components/UserPromptCard";
import CategoryFilter from "@/components/CategoryFilter";
import { samplePrompts, getFeaturedPrompts } from "@/lib/data/prompts";
import { PromptCategory } from "@/types";
import { ArrowRight, Sparkles, Search, TrendingUp, FileText, Code, Lightbulb, Calendar } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  imageUrl?: string | null;
  createdAt: string;
  user: {
    name?: string;
    email: string;
  };
}

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

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  useEffect(() => {
    fetchSavedPrompts();
    fetchChallenges();
  }, []);

  const fetchSavedPrompts = async () => {
    try {
      const response = await fetch("/api/prompts/public");
      if (response.ok) {
        const data = await response.json();
        setSavedPrompts(data.prompts);
      }
    } catch (error) {
      console.error("Error fetching saved prompts:", error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await fetch("/api/challenges");
      if (response.ok) {
        const data = await response.json();
        setChallenges(data.challenges);
      }
    } catch (error) {
      console.error("Error fetching challenges:", error);
    }
  };

  const filteredPrompts = samplePrompts.filter((prompt) => {
    const matchesCategory = selectedCategory === "all" || prompt.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPrompts = getFeaturedPrompts();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />

      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 gradient-bg opacity-10"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              {t.hero.title}{" "}
              <span className="gradient-text">{t.hero.titleHighlight}</span>
              {t.hero.titleEnd}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t.hero.subtitle}
            </p>

            {/* Topic Input */}
            <div className="max-w-2xl mx-auto mt-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (topicInput.trim()) {
                    router.push(`/generate?topic=${encodeURIComponent(topicInput)}`);
                  }
                }}
              >
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    placeholder="무엇을 만들고 싶으신가요? (예: 유튜브 영상 편집 프롬프트)"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="input-aurora flex-1 px-4 py-4 rounded-lg text-lg"
                  />
                  <button
                    type="submit"
                    disabled={!topicInput.trim()}
                    className="btn-aurora px-8 py-4 rounded-lg font-semibold flex items-center gap-2"
                  >
                    시작하기
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{samplePrompts.length}+</div>
                <div className="text-sm text-muted-foreground">{t.hero.statsPrompts}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">{t.hero.statsTools}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">9</div>
                <div className="text-sm text-muted-foreground">{t.hero.statsCategories}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Prompts */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold gradient-text">추천 프롬프트</h2>
              <p className="text-sm text-muted-foreground">커뮤니티가 만든 최신 프롬프트</p>
            </div>
            <Link
              href="/prompts/list"
              className="flex items-center gap-2 text-primary hover:underline font-medium"
            >
              전체보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Created Prompts */}
            {savedPrompts.slice(0, 3).map((prompt) => (
              <UserPromptCard key={`user-${prompt.id}`} prompt={prompt} />
            ))}

            {/* Featured Example Prompts */}
            {featuredPrompts.slice(0, 3).map((prompt) => (
              <PromptCard key={`featured-${prompt.id}`} prompt={prompt} />
            ))}
          </div>
        </div>
      </section>

      {/* Challengers Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold gradient-text">도전자들</h2>
              <p className="text-sm text-muted-foreground">커뮤니티의 도전 과제</p>
            </div>
            <Link
              href="/challengers"
              className="flex items-center gap-2 text-primary hover:underline font-medium"
            >
              전체보기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {challenges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">등록된 도전이 없습니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {challenges.slice(0, 3).map((challenge) => (
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
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>{t.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
