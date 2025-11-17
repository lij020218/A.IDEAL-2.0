"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import FollowButton from "@/components/FollowButton";
import UserPromptCard from "@/components/UserPromptCard";
import { Mail, Calendar, Loader2, FileText, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface UserProfileData {
  user: {
    id: string;
    name?: string | null;
    email: string;
    createdAt: string;
  };
  stats: {
    promptsCount: number;
    followersCount: number;
    followingCount: number;
  };
  isOwnProfile: boolean;
  isFollowing: boolean;
  prompts: Array<{
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
    user: {
      id: string;
      name?: string | null;
      email: string;
    };
  }>;
}

export default function UserPublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${params.id}/public`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
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

  if (!profile) {
    return null;
  }

  const { user, stats, isOwnProfile, prompts } = profile;

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="card-aurora rounded-xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-4xl font-bold text-white">
                {(user.name || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {user.name || user.email.split("@")[0]}
                </h1>
                <div className="space-y-2 text-muted-foreground text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(user.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })} 가입
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {!isOwnProfile && (
              <FollowButton
                targetUserId={user.id}
                size="md"
                variant="solid"
                initialIsFollowing={profile.isFollowing}
                onToggle={(next) => {
                  setProfile((prev) =>
                    prev
                      ? {
                          ...prev,
                          isFollowing: next,
                          stats: {
                            ...prev.stats,
                            followersCount: Math.max(
                              0,
                              prev.stats.followersCount + (next ? 1 : -1)
                            ),
                          },
                        }
                      : prev
                  );
                }}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
            <StatCard
              icon={<FileText className="h-5 w-5 text-blue-500" />}
              label="프롬프트"
              value={stats.promptsCount}
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-teal-500" />}
              label="팔로워"
              value={stats.followersCount}
            />
            <StatCard
              icon={<Users className="h-5 w-5 text-purple-500" />}
              label="팔로잉"
              value={stats.followingCount}
            />
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {isOwnProfile ? "내가 만든 프롬프트" : `${user.name || user.email.split("@")[0]}님의 프롬프트`}
              </h2>
              <p className="text-sm text-muted-foreground">
                최근에 공개한 프롬프트를 모아봤어요
              </p>
            </div>
          </div>

          {prompts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border rounded-2xl">
              아직 공개한 프롬프트가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prompts.map((prompt) => (
                <UserPromptCard key={prompt.id} prompt={prompt} />
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
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-secondary/40 rounded-xl p-4">
      <div className="flex items-center gap-3 text-muted-foreground mb-2">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}


