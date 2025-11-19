"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import UserPromptCard from "@/components/UserPromptCard";
import {
  ArrowRight,
  Sparkles,
  FileText,
  Code,
  Lightbulb,
  Calendar,
  MessageSquare,
  Users,
  Rocket,
  Target,
  BookOpen,
  Clock
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  imageUrl?: string | null;
  createdAt: string;
  aiProvider?: string | null;
  aiModel?: string | null;
  views?: number;
  averageRating?: number | null;
  ratingCount?: number;
  user: {
    id?: string;
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

interface GrowthTopic {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: number;
  goal: string;
  progress: number;
  createdAt: string;
}

export default function Home() {
  const { t, translate, language } = useLanguage();
  const tr = translate;
  const router = useRouter();
  const [topicInput, setTopicInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [growthTopics, setGrowthTopics] = useState<GrowthTopic[]>([]);

  useEffect(() => {
    fetchSavedPrompts();
    fetchChallenges();
    fetchGrowthTopics();
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

  const fetchGrowthTopics = async () => {
    try {
      const response = await fetch("/api/growth/topics/public");
      if (response.ok) {
        const data = await response.json();
        setGrowthTopics(data.topics || []);
      }
    } catch (error) {
      console.error("Error fetching growth topics:", error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      <Header onToggleSidebar={toggleSidebar} />

      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container mx-auto relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            {/* subtle top badge (Framer 스타일 참고, 우리 톤 적용) */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/50 backdrop-blur-md text-foreground border-2 border-white/40 shadow-lg shadow-black/5 dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 dark:text-foreground dark:shadow-[0_0_18px_rgba(0,255,200,0.3)] text-sm font-medium">
              <div className="relative">
                <Sparkles 
                  className="h-4 w-4 dark:hidden" 
                  style={{ 
                    stroke: 'url(#sparkles-gradient-light)',
                    strokeWidth: 2,
                  }} 
                />
                <Sparkles 
                  className="h-4 w-4 hidden dark:block" 
                  style={{ 
                    stroke: 'url(#sparkles-gradient-dark)',
                    strokeWidth: 2,
                  }} 
                />
                <svg className="absolute w-0 h-0">
                  <defs>
                    <linearGradient id="sparkles-gradient-light" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ADD8E6" />
                      <stop offset="50%" stopColor="#DDA0DD" />
                      <stop offset="100%" stopColor="#FFDAB9" />
                    </linearGradient>
                    <linearGradient id="sparkles-gradient-dark" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00FFC8" />
                      <stop offset="50%" stopColor="#FF0099" />
                      <stop offset="100%" stopColor="#0096FF" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              {tr("아이디어에서 배포까지, AI로 더 빠르게")}
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground dark:text-white/90">
              {t.hero.title}{" "}
              <span className="text-foreground dark:text-white/90">{t.hero.titleHighlight}</span>
              {t.hero.titleEnd}
              {((t as any).hero?.titleEnd2 ? (
                <>
                  <br />
                  {(t as any).hero.titleEnd2}
                </>
              ) : null)}
            </h1>
            <p className="text-xl text-muted-foreground dark:text-white/80">
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
                <div className="relative">
                  <input
                    type="text"
                    placeholder={tr("무엇을 만들고 싶으신가요? (예: 유튜브 영상 편집 프롬프트)")}
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="w-full pl-5 pr-14 py-4 text-lg rounded-3xl bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/50 dark:border-white/30 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60 shadow-lg shadow-black/10 dark:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-white/30 focus:border-white/70 dark:focus:border-white/50 transition-all"
                  />
                  <button
                    type="submit"
                    aria-label={tr("전송")}
                    disabled={!topicInput.trim()}
                    className="absolute top-1/2 -translate-y-1/2 right-1.5 h-10 w-10 rounded-full bg-gradient-to-r from-[#ADD8E6]/60 via-[#DDA0DD]/60 to-[#FFDAB9]/60 dark:from-[#00FFC8]/60 dark:via-[#FF0099]/60 dark:to-[#0096FF]/60 backdrop-blur-md border-2 border-[#ADD8E6]/50 dark:border-[#00FFC8]/50 text-foreground dark:text-white hover:from-[#ADD8E6]/70 hover:via-[#DDA0DD]/70 hover:to-[#FFDAB9]/70 dark:hover:from-[#00FFC8]/70 dark:hover:via-[#FF0099]/70 dark:hover:to-[#0096FF]/70 transition-all shadow-lg shadow-[#ADD8E6]/20 dark:shadow-[#00FFC8]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">{savedPrompts.length}+</div>
                <div className="text-sm text-muted-foreground">{t.hero.statsPrompts}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">10+</div>
                <div className="text-sm text-muted-foreground">{t.hero.statsTools}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">9</div>
                <div className="text-sm text-muted-foreground">{t.hero.statsCategories}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* (Removed) Key highlights cards */}

      {/* Recommended Prompts */}
      <section className="relative py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-100/70 to-amber-100/70 backdrop-blur-md border border-orange-200/50 flex items-center justify-center shadow-lg flex-shrink-0">
                <MessageSquare className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {tr("추천 프롬프트")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tr("커뮤니티가 만든 최신 프롬프트")}
                </p>
              </div>
            </div>
            <Link
              href="/prompts/list"
              className="flex items-center gap-2 text-black dark:text-white hover:opacity-80 font-medium transition-opacity"
            >
              {tr("전체보기")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {savedPrompts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{tr("등록된 프롬프트가 없습니다")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedPrompts.slice(0, 6).map((prompt) => (
                <UserPromptCard key={`user-${prompt.id}`} prompt={prompt} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Growth Section */}
      <section className="relative py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center shadow-lg flex-shrink-0">
                <Rocket className="h-6 w-6 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">
                  {tr("성장하기")}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {tr("AI가 설계하는 맞춤 학습 경로")}
                </p>
              </div>
            </div>
            <Link
              href="/grow"
              className="flex items-center gap-2 text-black dark:text-white hover:opacity-80 font-medium transition-opacity"
            >
              {tr("전체보기")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {growthTopics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{tr("나만의 학습 경로를 시작해보세요")}</p>
              <Link
                href="/grow/new"
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-2xl border border-cyan-200/50 bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md text-cyan-500 hover:from-cyan-100/80 hover:to-blue-100/80 dark:from-cyan-500/20 dark:to-blue-500/20 dark:border-cyan-400/30 dark:text-cyan-400 dark:hover:from-cyan-500/30 dark:hover:to-blue-500/30 transition-all font-semibold text-sm shadow-lg shadow-cyan-500/20"
              >
                {tr("새 학습 시작하기")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {growthTopics.slice(0, 3).map((topic) => (
                <Link
                  key={topic.id}
                  href={`/grow/${topic.id}`}
                  className="card-aurora rounded-xl p-6 hover:shadow-lg transition-all block"
                >
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold line-clamp-2 mb-2">
                          {topic.title}
                        </h3>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {topic.description}
                          </p>
                        )}
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
                          <span>{topic.level === "beginner" ? tr("초급") : topic.level === "intermediate" ? tr("중급") : tr("고급")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{topic.duration}{tr("일")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-auto">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{tr("학습 진도")}</span>
                        <span className="font-medium">{topic.progress || 0}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                          style={{ width: `${topic.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Challengers Section */}
      <section className="relative py-16 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md border border-purple-200/50 flex items-center justify-center shadow-lg flex-shrink-0">
                <Users className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground">{tr("도전자들")}</h2>
                <p className="text-sm text-muted-foreground">
                  {tr("커뮤니티의 도전 과제")}
                </p>
              </div>
            </div>
            <Link
              href="/challengers"
              className="flex items-center gap-2 text-black dark:text-white hover:opacity-80 font-medium transition-opacity"
            >
              {tr("전체보기")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {challenges.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{tr("등록된 도전이 없습니다")}</p>
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
                        <div className="px-2 py-1 bg-foreground/10 text-foreground rounded text-xs flex items-center gap-1">
                          <Code className="h-3 w-3" />
                          {tr("코드")}
                        </div>
                      )}
                      {challenge.ideaDetails && (
                        <div className="px-2 py-1 bg-foreground/10 text-foreground rounded text-xs flex items-center gap-1">
                          <Lightbulb className="h-3 w-3" />
                          {tr("아이디어")}
                        </div>
                      )}
                      {challenge.resumeUrl && (
                        <div className="px-2 py-1 bg-foreground/10 text-foreground rounded text-xs flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {tr("이력서")}
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
                        {challenge.author.name || tr("익명")}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(challenge.createdAt), {
                          addSuffix: true,
                          locale: language === "ko" ? ko : enUS,
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