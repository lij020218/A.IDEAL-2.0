"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { aiTools } from "@/lib/data/ai-tools";
import Image from "next/image";
import { FileText, Upload, X, Sparkles, ArrowLeft, Image as ImageIcon, Loader2, Tag, MessageSquare } from "lucide-react";
import Link from "next/link";
import { PromptCategory } from "@/types";

function NewPromptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const promptId = searchParams.get("promptId");
  const { data: session } = useSession();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "">("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!session) {
    // Let NextAuth guard elsewhere; we can also redirect users to signin
  }

  // Fetch existing prompt data if promptId is provided
  useEffect(() => {
    if (promptId && session) {
      const fetchPrompt = async () => {
        setLoading(true);
        try {
          const response = await fetch(`/api/prompts/${promptId}`);
          if (response.ok) {
            const data = await response.json();
            setTitle(data.topic);
            setContent(data.prompt);
            setSelectedCategory(data.category || "");

            // Map tool names back to tool IDs
            const toolIds = data.recommendedTools
              .map((toolName: string) => {
                const tool = aiTools.find(t => t.name === toolName);
                return tool?.id;
              })
              .filter(Boolean);
            setSelectedTools(toolIds);

            // Set image preview if exists
            if (data.imageUrl) {
              setImagePreview(data.imageUrl);
            }
          }
        } catch (error) {
          console.error("Error fetching prompt:", error);
          setError("프롬프트를 불러오는데 실패했습니다");
        } finally {
          setLoading(false);
        }
      };
      fetchPrompt();
    }
  }, [promptId, session]);

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);

  const onSelectTool = (id: string) => {
    setSelectedTools((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setImageFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        const form = new FormData();
        form.append("file", imageFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: form });
        if (!upRes.ok) {
          const errorData = await upRes.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.details || "이미지 업로드에 실패했습니다";
          throw new Error(errorMessage);
        }
        const upJson = await upRes.json();
        imageUrl = upJson.url;
      }

      // Store tool names for readability in saved prompts
      const toolNames = aiTools
        .filter((t) => selectedTools.includes(t.id))
        .map((t) => t.name);

      const res = await fetch("/api/prompts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: promptId || undefined, // Include ID if editing
          topic: title,
          prompt: content,
          category: selectedCategory || undefined,
          recommendedTools: toolNames,
          tips: [],
          parentId: null,
          imageUrl,
          isPublic: true, // 프롬프트 등록 페이지에서는 공개로 설정
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || "저장에 실패했습니다");
      }

      router.push(`/prompt/${json.prompt.id}`);
    } catch (err: any) {
      setError(err?.message || "에러가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

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

      <div className="container mx-auto px-4 py-12 max-w-5xl relative z-10">
        {/* Back Button */}
        <div className="relative">
          <Link
            href="/prompts/list"
            className="absolute -top-6 left-0 inline-flex items-center gap-2 text-muted-foreground hover:opacity-80 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100/70 to-amber-100/70 backdrop-blur-md border border-orange-200/50 flex items-center justify-center shadow-lg mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-orange-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-foreground dark:text-white/90">
                {promptId ? "프롬프트 수정" : "프롬프트 등록하기"}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto">
              {promptId ? "프롬프트를 수정하고 저장하세요" : "나만의 프롬프트를 저장하고 공유하세요"}
            </p>
          </div>
        </div>

        <div className="card-container rounded-xl p-8 md:p-10">

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Section */}
          <div className="card-aurora rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <Sparkles className="h-4 w-4 text-foreground" />
              제목
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg text-base bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder="예: 블로그 글 자동 작성 프롬프트"
            />
          </div>

          {/* Category Section */}
          <div className="card-aurora rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <Tag className="h-4 w-4 text-foreground" />
              카테고리
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as PromptCategory | "")}
              className="w-full px-4 py-3 rounded-lg text-base bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">카테고리를 선택하세요 (선택사항)</option>
              <option value="writing">글쓰기</option>
              <option value="marketing">마케팅</option>
              <option value="coding">코딩</option>
              <option value="design">디자인</option>
              <option value="business">비즈니스</option>
              <option value="education">교육</option>
              <option value="productivity">생산성</option>
              <option value="creative">창작</option>
              <option value="analysis">분석</option>
            </select>
          </div>

          {/* Content Section */}
          <div className="card-aurora rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <FileText className="h-4 w-4 text-foreground" />
              프롬프트 내용
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-lg font-mono text-sm resize-none bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              placeholder={`모델에 전달할 프롬프트를 입력하세요.\n\n예시:\n당신은 경험이 풍부한 시니어 콘텐츠 라이터입니다.\n주어진 주제에 대해 매력적이고 정보성 있는 블로그 글을 작성해주세요.\n\n요구사항:\n- 1000자 이상 작성\n- SEO 최적화된 제목 포함\n- 명확한 구조 (서론, 본론, 결론)`}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>마크다운 및 코드 블록 지원</span>
              <span>{content.length} 자</span>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="card-aurora rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3 text-foreground">
              <ImageIcon className="h-4 w-4 text-foreground" />
              참고 이미지 (선택)
            </label>

            {!imagePreview ? (
              <label className="border-2 border-dashed border-border rounded-lg p-8 cursor-pointer hover:bg-secondary/50 transition-colors flex flex-col items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium mb-1">이미지를 드래그하거나 클릭하여 업로드</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, GIF (최대 10MB)</p>
                </div>
              </label>
            ) : (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <Image
                  src={imagePreview}
                  alt="미리보기"
                  width={800}
                  height={400}
                  className="w-full h-auto object-contain max-h-96 bg-secondary"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-destructive/90 hover:bg-destructive text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* AI Tools Section */}
          <div className="card-aurora rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold mb-4 text-foreground">
              <Sparkles className="h-4 w-4 text-foreground" />
              추천 AI 도구 ({selectedTools.length}개 선택)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aiTools.map((tool) => {
                const isSelected = selectedTools.includes(tool.id);
                
                // AI 도구별 색상 매핑
                const getAIToolColor = (toolId: string, toolName: string): { bg: string; border: string; text: string } => {
                  const id = toolId.toLowerCase();
                  const name = toolName.toLowerCase();
                  
                  // 사용자가 정해준 색상
                  if (id.includes("chatgpt") || id.includes("gpt") || name.includes("chatgpt") || name.includes("gpt")) {
                    return { bg: "bg-gray-400/20", border: "border-gray-400", text: "text-gray-700 dark:text-gray-300" };
                  }
                  if (id.includes("claude") || name.includes("claude")) {
                    return { bg: "bg-orange-300/20", border: "border-orange-300", text: "text-orange-700 dark:text-orange-300" };
                  }
                  if (id.includes("grok") || name.includes("grok")) {
                    return { bg: "bg-black/20", border: "border-black", text: "text-black dark:text-gray-200" };
                  }
                  if (id.includes("midjourney") || name.includes("midjourney")) {
                    return { bg: "bg-[#ff006e]/20", border: "border-[#ff006e]", text: "text-[#ff006e]" };
                  }
                  if (id.includes("gemini") || name.includes("gemini")) {
                    return { bg: "bg-[#00d4ff]/20", border: "border-[#00d4ff]", text: "text-[#00d4ff]" };
                  }
                  if (id.includes("sora") || name.includes("sora")) {
                    return { bg: "bg-[#00bcd4]/20", border: "border-[#00bcd4]", text: "text-[#00bcd4]" };
                  }
                  
                  // 나머지 AI 도구들 - 배경색과 어울리는 파스텔 색상 (모두 고유한 색상)
                  if (id.includes("dall-e") || name.includes("dall-e")) {
                    return { bg: "bg-slate-600/20", border: "border-slate-600", text: "text-slate-700 dark:text-slate-300" };
                  }
                  if (id.includes("copilot") || name.includes("copilot")) {
                    return { bg: "bg-blue-600/20", border: "border-blue-600", text: "text-blue-700 dark:text-blue-300" };
                  }
                  if (id.includes("perplexity") || name.includes("perplexity")) {
                    return { bg: "bg-purple-600/20", border: "border-purple-600", text: "text-purple-700 dark:text-purple-300" };
                  }
                  if (id.includes("stable-diffusion") || name.includes("stable diffusion")) {
                    return { bg: "bg-emerald-600/20", border: "border-emerald-600", text: "text-emerald-700 dark:text-emerald-300" };
                  }
                  if (id.includes("eleven") || name.includes("eleven")) {
                    return { bg: "bg-amber-600/20", border: "border-amber-600", text: "text-amber-700 dark:text-amber-300" };
                  }
                  if (id.includes("runway") || name.includes("runway")) {
                    return { bg: "bg-rose-600/20", border: "border-rose-600", text: "text-rose-700 dark:text-rose-300" };
                  }
                  if (id.includes("veo") || name.includes("veo")) {
                    return { bg: "bg-[#0ea5e9]/20", border: "border-[#0ea5e9]", text: "text-[#0ea5e9]" };
                  }
                  if (id.includes("kling") || name.includes("kling")) {
                    return { bg: "bg-yellow-600/20", border: "border-yellow-600", text: "text-yellow-700 dark:text-yellow-300" };
                  }
                  if (id.includes("pika") || name.includes("pika")) {
                    return { bg: "bg-fuchsia-600/20", border: "border-fuchsia-600", text: "text-fuchsia-700 dark:text-fuchsia-300" };
                  }
                  if (id.includes("heygen") || name.includes("heygen")) {
                    return { bg: "bg-[#14b8a6]/20", border: "border-[#14b8a6]", text: "text-[#14b8a6]" };
                  }
                  if (id.includes("synthesia") || name.includes("synthesia")) {
                    return { bg: "bg-indigo-600/20", border: "border-indigo-600", text: "text-indigo-700 dark:text-indigo-300" };
                  }
                  if (id.includes("ideogram") || name.includes("ideogram")) {
                    return { bg: "bg-lime-600/20", border: "border-lime-600", text: "text-lime-700 dark:text-lime-300" };
                  }
                  if (id.includes("flux") || name.includes("flux")) {
                    return { bg: "bg-violet-600/20", border: "border-violet-600", text: "text-violet-700 dark:text-violet-300" };
                  }
                  
                  // 기본값
                  return { bg: "bg-gray-300/20", border: "border-gray-300", text: "text-gray-700 dark:text-gray-300" };
                };
                
                const colors = getAIToolColor(tool.id, tool.name);
                
                return (
                  <label
                    key={tool.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text}`
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectTool(tool.id)}
                      className="h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-offset-2"
                      style={isSelected ? {
                        accentColor: colors.border.includes("[") 
                          ? colors.border.match(/#[0-9a-fA-F]{6}/)?.[0] || colors.border
                          : colors.border.replace("border-", "").replace("gray-400", "#9ca3af").replace("orange-300", "#fdba74").replace("black", "#000000")
                      } : {}}
                    />
                    <div className="flex-1">
                      <span className={`font-medium block ${isSelected ? colors.text : ""}`}>{tool.name}</span>
                      <span className="text-xs text-muted-foreground">{tool.category}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={submitting || loading}
              className="flex-1 px-6 py-3 rounded-2xl border border-orange-200/50 bg-gradient-to-br from-orange-100/70 to-amber-100/70 backdrop-blur-md text-orange-500 hover:from-orange-100/80 hover:to-amber-100/80 dark:from-orange-500/20 dark:to-amber-500/20 dark:border-orange-400/30 dark:text-orange-400 dark:hover:from-orange-500/30 dark:hover:to-amber-500/30 transition-all font-semibold shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {promptId ? "수정 중..." : "등록 중..."}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {promptId ? "수정하기" : "등록하기"}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
              취소
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}

export default function NewPromptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <NewPromptContent />
    </Suspense>
  );
}

