"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { X } from "lucide-react";

export default function NewChallengePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    codeSnippet: "",
    ideaDetails: "",
    resumeUrl: "",
    contactInfo: "",
    tags: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push("/auth/signin?message=도전을 올리려면 로그인이 필요합니다");
      return;
    }

    setIsSubmitting(true);

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const response = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          tags,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/challengers/${data.challenge.id}`);
      } else {
        alert("도전 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("Error creating challenge:", error);
      alert("도전 생성에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 max-w-3xl relative z-10">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">새로운 <span className="text-foreground">도전</span> 올리기</h1>
          <p className="text-muted-foreground">
            당신의 아이디어와 열정을 공유하고, 함께할 동료를 찾아보세요
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 제목 */}
          <div className="card-aurora rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              제목 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 같이 AI 스타트업 만들 개발자 구합니다"
              className="input-aurora w-full px-4 py-3 rounded-lg"
              required
            />
          </div>

          {/* 설명 */}
          <div className="card-aurora rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              설명 <span className="text-destructive">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="프로젝트나 아이디어에 대해 자세히 설명해주세요"
              className="input-aurora w-full px-4 py-3 rounded-lg resize-none"
              rows={6}
              required
            />
          </div>

          {/* 코드 스니펫 */}
          <div className="card-aurora rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              코드 스니펫 (선택)
            </label>
            <textarea
              value={formData.codeSnippet}
              onChange={(e) => setFormData({ ...formData, codeSnippet: e.target.value })}
              placeholder="관련 코드가 있다면 공유해주세요"
              className="input-aurora w-full px-4 py-3 rounded-lg resize-none font-mono text-sm"
              rows={8}
            />
          </div>

          {/* 아이디어 상세 */}
          <div className="card-aurora rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              아이디어 상세 (선택)
            </label>
            <textarea
              value={formData.ideaDetails}
              onChange={(e) => setFormData({ ...formData, ideaDetails: e.target.value })}
              placeholder="비즈니스 모델, 타겟 시장, 예상 수익 등"
              className="input-aurora w-full px-4 py-3 rounded-lg resize-none"
              rows={4}
            />
          </div>

          {/* 이력서 URL */}
          <div className="card-aurora rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              이력서 URL (선택)
            </label>
            <input
              type="url"
              value={formData.resumeUrl}
              onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
              placeholder="https://drive.google.com/... 또는 노션 링크 등"
              className="input-aurora w-full px-4 py-3 rounded-lg"
            />
            <p className="text-xs text-muted-foreground mt-2">
              구글 드라이브, 노션 등의 링크를 입력해주세요
            </p>
          </div>

          {/* 연락처 */}
          <div className="card-aurora rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              연락처 <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              placeholder="이메일, 전화번호, 카카오톡 ID 등"
              className="input-aurora w-full px-4 py-3 rounded-lg"
              required
            />
            <p className="text-xs text-muted-foreground mt-2">
              "같이 도전하기"를 누르면 이 연락처가 공개됩니다
            </p>
          </div>

          {/* 태그 */}
          <div className="card-aurora rounded-xl p-6">
            <label className="block text-sm font-medium mb-2">
              태그 (선택)
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="AI, 웹개발, 스타트업 (쉼표로 구분)"
              className="input-aurora w-full px-4 py-3 rounded-lg"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-aurora flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
            >
              {isSubmitting ? "올리는 중..." : "도전 올리기"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg shadow-black/8 dark:shadow-black/15"
            >
              <X className="h-5 w-5" />
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
