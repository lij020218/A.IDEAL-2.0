"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import {
  Mail,
  Calendar,
  FileText,
  Users,
  Loader2,
  Award,
  Sparkles,
  TrendingUp,
  Eye,
  Target,
  BookOpen,
  Star,
  MessageSquare,
  Rocket,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";
import UserPromptCard from "@/components/UserPromptCard";

interface ProfilePrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  imageUrl?: string | null;
  createdAt: string;
  aiProvider?: string | null;
  aiModel?: string | null;
  isPublic: boolean;
  views?: number;
  averageRating?: number | null;
  ratingCount?: number;
  user: {
    id: string;
    name?: string | null;
    email: string;
  };
}

interface ProfileData {
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  stats: {
    promptsCount: number;
    publicPromptsCount: number;
    challengesCount: number;
    learningTopicsCount: number;
    totalViews: number;
    totalRatings: number;
    averageRating: number | null;
    followersCount: number;
    followingCount: number;
  };
  badges: string[];
  prompts: ProfilePrompt[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchProfileData();
    }
  }, [status, router]);

  const fetchProfileData = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  const badgeConfig: Record<
    string,
    { label: string; icon: any; color: string }
  > = {
    creator: { label: "크리에이터", icon: Sparkles, color: "text-blue-500" },
    popular: { label: "인기", icon: TrendingUp, color: "text-orange-500" },
    expert: { label: "전문가", icon: Award, color: "text-yellow-500" },
    influencer: { label: "인플루언서", icon: Users, color: "text-purple-500" },
    prolific: { label: "다작가", icon: FileText, color: "text-green-500" },
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        <div className="card-aurora rounded-xl p-8 mb-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-primary/30">
                {(profileData.user.name || profileData.user.email)
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold dark:text-white/90">
                    {profileData.user.name ||
                      profileData.user.email.split("@")[0]}
                  </h1>
                  {profileData.badges.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {profileData.badges.map((badge) => {
                        const config = badgeConfig[badge];
                        if (!config) return null;
                        const Icon = config.icon;
                        return (
                          <div
                            key={badge}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/20 ${config.color} text-xs font-medium shadow-lg shadow-black/5 dark:shadow-black/15`}
                          >
                            <Icon className="h-3 w-3" />
                            <span>{config.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="space-y-2 text-muted-foreground dark:text-white/80 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{profileData.user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(profileData.user.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}{" "}
                      가입
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-foreground dark:text-white hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
              >
                대시보드로 이동
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <StatCard
              icon={<MessageSquare className="h-5 w-5 text-orange-500" />}
              label="프롬프트"
              value={profileData.stats.promptsCount}
              subText={`${profileData.stats.publicPromptsCount}개 공개`}
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-teal-500" />}
              label="팔로워"
              value={profileData.stats.followersCount}
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-purple-500" />}
              label="팔로잉"
              value={profileData.stats.followingCount}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <StatCard
              icon={<Users className="h-5 w-5 text-purple-500" />}
              label="도전 과제"
              value={profileData.stats.challengesCount}
            />
            <StatCard
              icon={<Rocket className="h-5 w-5 text-cyan-500" />}
              label="학습 주제"
              value={profileData.stats.learningTopicsCount}
            />
          </div>
        </div>

        {profileData.stats.publicPromptsCount > 0 && (
          <div className="card-aurora rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 dark:text-white/90">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              공개 프롬프트 성과
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon={<Eye className="h-5 w-5 text-blue-500" />}
                label="총 조회수"
                value={profileData.stats.totalViews}
              />
              <StatCard
                icon={<Star className="h-5 w-5 text-yellow-500" />}
                label="총 평가"
                value={profileData.stats.totalRatings}
              />
              <StatCard
                icon={<Star className="h-5 w-5 text-yellow-500" />}
                label="평균 평점"
                value={
                  profileData.stats.averageRating
                    ? Number(profileData.stats.averageRating.toFixed(1))
                    : 0
                }
                subText={
                  profileData.stats.averageRating ? undefined : "평가 없음"
                }
              />
            </div>
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold dark:text-white/90">내 프롬프트</h2>
              <p className="text-sm text-muted-foreground dark:text-white/80">
                공개 · 비공개 프롬프트를 한 곳에서 관리하세요
              </p>
            </div>
            <Link
              href="/prompts/new"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-foreground dark:text-white hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
            >
              새 프롬프트 만들기
            </Link>
          </div>

          {profileData.prompts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground dark:text-white/80 bg-white/50 dark:bg-white/5 backdrop-blur-md border-2 border-white/40 dark:border-white/20 rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/15">
              아직 프롬프트가 없습니다. 새로운 아이디어를 만들어보세요!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profileData.prompts.map((prompt) => (
                <div key={prompt.id} className="relative group">
                  {!prompt.isPublic && (
                    <span className="absolute top-4 left-4 z-10 text-[11px] font-semibold px-2 py-1 rounded-full bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/20 text-muted-foreground dark:text-white/80 shadow-lg shadow-black/5 dark:shadow-black/15">
                      비공개
                    </span>
                  )}
                  <UserPromptCard prompt={{
                    ...prompt,
                    user: {
                      ...prompt.user,
                      name: prompt.user.name ?? undefined,
                    }
                  }} />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subText,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  subText?: string;
}) {
  return (
    <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-xl p-4 shadow-lg shadow-black/5 dark:shadow-black/15">
      <div className="flex items-center gap-2 text-muted-foreground dark:text-white/80 mb-1 text-sm">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-2xl font-bold dark:text-white/90">{value}</div>
      {subText && <p className="text-xs text-muted-foreground dark:text-white/80 mt-1">{subText}</p>}
    </div>
  );
}

