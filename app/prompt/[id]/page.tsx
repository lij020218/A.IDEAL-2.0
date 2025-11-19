"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Copy, Check, Edit, ArrowLeft, Tag, User, Clock, Sparkles, ExternalLink, Loader2, Star, Eye, Trash2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { aiTools } from "@/lib/data/ai-tools";
import Image from "next/image";
import { AIProviderBadge, isAIProvider, AI_PROVIDER_LABELS } from "@/components/AIProviderBadge";
import PromptExecutor from "@/components/PromptExecutor";
import CommentSection from "@/components/CommentSection";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";

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
  isPublic?: boolean;
  views?: number;
  averageRating?: number | null;
  ratingCount?: number;
  userRating?: number | null;
  isOwner?: boolean;
  user?: {
    id: string;
    name?: string;
    email: string;
  };
}

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState<SavedPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [isRating, setIsRating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (session && params.id) {
      fetchPrompt();
    } else if (!session) {
      router.push("/auth/signin");
    }
  }, [session, params.id]);

  const fetchPrompt = async () => {
    try {
      console.log("[Prompt Detail] Fetching prompt:", params.id);
      const response = await fetch(`/api/prompts/${params.id}`);
      console.log("[Prompt Detail] Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[Prompt Detail] Received data:", data);
        setPrompt(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Prompt Detail] Error response:", response.status, errorData);
        alert(`프롬프트를 불러올 수 없습니다: ${errorData.error || response.statusText}`);
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching prompt:", error);
      alert("프롬프트를 불러오는 중 오류가 발생했습니다");
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!prompt) return;
    try {
      const response = await fetch("/api/usage/prompt-copy", {
        method: "POST",
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "프롬프트 복사 한도를 초과했습니다");
      }
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "프롬프트를 복사할 수 없습니다"
      );
    }
  };

  const handleContinue = () => {
    if (prompt) {
      // Navigate to refine page for conversational refinement
      router.push(`/prompt/${params.id}/refine`);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleRating = async (rating: number) => {
    if (!prompt || isRating) return;

    setIsRating(true);
    try {
      const response = await fetch(`/api/prompts/${params.id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (response.ok) {
        const data = await response.json();
        setPrompt({
          ...prompt,
          averageRating: data.averageRating,
          ratingCount: data.ratingCount,
          userRating: rating,
        });
      }
    } catch (error) {
      console.error("Error rating prompt:", error);
    } finally {
      setIsRating(false);
    }
  };

  const handleDelete = async () => {
    if (!prompt || isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/prompts/${params.id}/delete`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/");
      } else {
        alert("삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
      alert("삭제 중 오류가 발생했습니다");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-amber-50/30 to-white relative">
        {/* Global Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-yellow-100/30 rounded-full blur-3xl" />
        </div>
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <section className="relative py-16 px-4">
          <div className="container mx-auto relative z-10 flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </section>
      </div>
    );
  }

  if (!prompt) {
    return null;
  }

  const provider = prompt.aiProvider && isAIProvider(prompt.aiProvider) ? prompt.aiProvider : null;
  const providerLabel = provider ? AI_PROVIDER_LABELS[provider] : null;

  // Get full tool details for recommended tools
  const recommendedToolDetails = prompt.recommendedTools
    .map((toolName) => aiTools.find((t) => t.name === toolName))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 via-amber-50/30 to-white relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-amber-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-yellow-100/30 rounded-full blur-3xl" />
      </div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="mb-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100/70 to-amber-100/70 backdrop-blur-md border border-orange-200/50 flex items-center justify-center shadow-lg mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-foreground dark:text-white/90">프롬프트</span>
            </h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="card-container rounded-xl p-8 md:p-10">
            <button
              onClick={() => router.push("/prompts/list")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              프롬프트 목록으로
            </button>

            {/* Image Header (if available) */}
            {prompt.imageUrl && (
              <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-6">
                <Image
                  src={prompt.imageUrl}
                  alt={prompt.topic}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
            )}

            {/* Header */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2 text-foreground dark:text-white/90">{prompt.topic}</h1>

                  {/* Stats Row */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground dark:text-white/80 mb-3">
                    {prompt.user && (
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/users/${prompt.user.id}`}
                          className="flex items-center gap-1 hover:opacity-80 transition-colors"
                        >
                          <User className="h-4 w-4" />
                          <span>{prompt.user.name || prompt.user.email.split("@")[0]}</span>
                        </Link>
                        <FollowButton targetUserId={prompt.user.id} size="xs" />
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{prompt.views || 0}회 조회</span>
                    </div>
                    {prompt.averageRating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        <span>{prompt.averageRating.toFixed(1)} ({prompt.ratingCount}명)</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDistanceToNow(new Date(prompt.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </span>
                    </div>
                  </div>

                  {provider && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-white/80">
                      <AIProviderBadge provider={provider} model={prompt.aiModel || undefined} size="sm" />
                      <span>
                        {provider === "gpt" ? "GPT-5.1" : providerLabel}
                        {prompt.aiModel && provider !== "gpt" ? ` · ${prompt.aiModel}` : ""} 모델이 생성한 프롬프트입니다.
                      </span>
                    </div>
                  )}
                </div>

                {/* Owner Actions */}
                {prompt.isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/prompts/new?promptId=${params.id}`)}
                      className="px-4 py-2 border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground rounded-lg hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      수정
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isDeleting}
                      className="px-4 py-2 border-2 border-red-500/40 dark:border-red-500/30 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/30 dark:hover:bg-red-500/20 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </button>
                  </div>
                )}
              </div>

            {/* Rating Section - Only for non-owners */}
            {!prompt.isOwner && (
              <div className="mt-4 p-4 card-aurora rounded-lg">
                <p className="text-sm font-medium mb-2 text-foreground">이 프롬프트가 도움이 되셨나요?</p>
                <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    disabled={isRating}
                    className="transition-transform hover:scale-110 disabled:opacity-50"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        (hoveredStar || prompt.userRating || 0) >= star
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
                {prompt.userRating && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    별 {prompt.userRating}개로 평가했습니다
                  </span>
                )}
                </div>
              </div>
            )}
          </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="card-container rounded-xl p-6 max-w-md mx-4">
                  <h3 className="text-xl font-bold mb-4 text-foreground">프롬프트 삭제</h3>
                  <p className="text-muted-foreground mb-6">
                    정말로 이 프롬프트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2 rounded-lg border-2 border-red-500/40 dark:border-red-500/30 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md text-red-600 dark:text-red-400 hover:bg-red-500/30 dark:hover:bg-red-500/20 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50"
                    >
                      {isDeleting ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Prompt Content */}
            <div className="card-aurora rounded-xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground dark:text-white/90">프롬프트 내용</h2>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  프롬프트 복사
                </>
              )}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 p-4 rounded-md shadow-lg shadow-black/5 dark:shadow-black/15">
            {prompt.prompt}
          </pre>
        </div>

            {/* Prompt Executor */}
            <PromptExecutor
              promptId={prompt.id}
              promptText={prompt.prompt}
              defaultProvider={prompt.aiProvider}
              defaultModel={prompt.aiModel}
            />

            {/* Recommended AI Tools */}
            {recommendedToolDetails.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white/90">추천 AI 도구</h2>
                <p className="text-muted-foreground dark:text-white/80 mb-6">
                  이 프롬프트에 가장 적합한 AI 도구들입니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedToolDetails.map((tool: any) => (
                    <a
                      key={tool.id}
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-4 p-4 card-aurora rounded-lg hover:shadow-lg transition-all"
                    >
                      <div className="h-12 w-12 rounded-lg bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 flex items-center justify-center text-xl font-bold text-foreground flex-shrink-0 shadow-lg shadow-black/5 dark:shadow-black/15">
                        {tool.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold group-hover:opacity-80 transition-colors text-foreground">
                            {tool.name}
                          </h3>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tool.description}
                    </p>
                    <span className="inline-block mt-2 text-xs bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/20 px-2 py-0.5 rounded shadow-md shadow-black/5 dark:shadow-black/10">
                      {tool.category}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

            {/* Tips */}
            {prompt.tips && prompt.tips.length > 0 && (
              <div className="card-aurora rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-3 text-foreground dark:text-white/90">💡 사용 팁</h3>
                <ul className="space-y-2 text-sm text-muted-foreground dark:text-white/80">
                  {prompt.tips.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Default Tips if none provided */}
            {(!prompt.tips || prompt.tips.length === 0) && (
              <div className="card-aurora rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-3 text-foreground dark:text-white/90">💡 사용 팁</h3>
                <ul className="space-y-2 text-sm text-muted-foreground dark:text-white/80">
                  <li>• 프롬프트를 복사하여 원하는 AI 도구에 붙여넣으세요</li>
                  <li>• 필요에 따라 프롬프트 내용을 수정하여 사용할 수 있습니다</li>
                  <li>• 여러 AI 도구에서 테스트하여 최상의 결과를 찾아보세요</li>
                  <li>• 성공적인 결과를 얻으면 추가로 작업하여 더 개선할 수 있습니다</li>
                </ul>
              </div>
            )}

            {/* Action Button */}
            <div className="flex gap-4 mb-8">
              <button
                onClick={handleContinue}
                className="flex-1 px-6 py-3 rounded-full border border-orange-200/50 bg-gradient-to-r from-orange-100/50 to-amber-100/50 backdrop-blur-md text-orange-600 hover:from-orange-100/70 hover:to-amber-100/70 dark:from-orange-500/20 dark:to-amber-500/20 dark:border-orange-400/30 dark:text-orange-400 dark:hover:from-orange-500/30 dark:hover:to-amber-500/30 transition-all font-semibold shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
              >
                <Edit className="h-5 w-5" />
                추가로 작업하기
              </button>
            </div>

            {/* Comments Section - Only for public prompts */}
            {prompt.isPublic && (
              <CommentSection
                resourceId={prompt.id}
                resourceType="prompt"
                resourceOwnerId={prompt.isOwner ? session?.user?.id : undefined}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
