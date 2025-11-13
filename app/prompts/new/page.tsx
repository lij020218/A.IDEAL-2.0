"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { aiTools } from "@/lib/data/ai-tools";
import Image from "next/image";
import { FileText, Upload, X, Sparkles, ArrowLeft, Image as ImageIcon, Loader2 } from "lucide-react";

export default function NewPromptPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    // Let NextAuth guard elsewhere; we can also redirect users to signin
  }

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
          throw new Error("이미지 업로드에 실패했습니다");
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
          topic: title,
          prompt: content,
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
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 max-w-5xl">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          돌아가기
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">프롬프트 등록</h1>
              <p className="text-muted-foreground">나만의 프롬프트를 저장하고 공유하세요</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Section */}
          <div className="card-aurora rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              제목
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-aurora w-full px-4 py-3 rounded-lg text-base"
              placeholder="예: 블로그 글 자동 작성 프롬프트"
            />
          </div>

          {/* Content Section */}
          <div className="card-aurora rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <FileText className="h-4 w-4 text-primary" />
              프롬프트 내용
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="input-aurora w-full px-4 py-3 rounded-lg font-mono text-sm resize-none"
              placeholder={`모델에 전달할 프롬프트를 입력하세요.\n\n예시:\n당신은 경험이 풍부한 시니어 콘텐츠 라이터입니다.\n주어진 주제에 대해 매력적이고 정보성 있는 블로그 글을 작성해주세요.\n\n요구사항:\n- 1000자 이상 작성\n- SEO 최적화된 제목 포함\n- 명확한 구조 (서론, 본론, 결론)`}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>마크다운 및 코드 블록 지원</span>
              <span>{content.length} 자</span>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="card-aurora rounded-xl p-6">
            <label className="flex items-center gap-2 text-sm font-semibold mb-3">
              <ImageIcon className="h-4 w-4 text-primary" />
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
            <label className="flex items-center gap-2 text-sm font-semibold mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              추천 AI 도구 ({selectedTools.length}개 선택)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {aiTools.map((tool) => {
                const isSelected = selectedTools.includes(tool.id);
                return (
                  <label
                    key={tool.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border hover:bg-secondary"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectTool(tool.id)}
                      className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <div className="flex-1">
                      <span className="font-medium block">{tool.name}</span>
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
              disabled={submitting}
              className="btn-aurora px-8 py-3 rounded-lg font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  등록하기
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="px-8 py-3 rounded-lg border-2 border-border hover:bg-secondary transition-colors font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

