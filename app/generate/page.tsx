"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Header from "@/components/Header";
import PromptGenerator from "@/components/PromptGenerator";
import LeftSidebar from "@/components/LeftSidebar";
import { Sparkles, Wand2, MessageSquare, Lightbulb, Zap } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface ExistingPromptData {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  aiProvider?: string | null;
  aiModel?: string | null;
}

function GenerateContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const initialTopic = searchParams.get("topic") || "";
  const promptId = searchParams.get("promptId") || undefined;
  const [existingPromptData, setExistingPromptData] = useState<ExistingPromptData | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<"topic" | "questions" | "result">("topic");
  const [isGenerating, setIsGenerating] = useState(false);

  // 다른 페이지에서 왔다면 sessionStorage 클리어 (새로고침은 유지)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const lastPage = sessionStorage.getItem("lastPage");
    const currentPage = pathname;
    
    // 다른 페이지에서 왔다면 sessionStorage 클리어
    if (lastPage && lastPage !== currentPage) {
      sessionStorage.removeItem("promptGeneratorState");
    }
    
    // 현재 페이지 저장
    sessionStorage.setItem("lastPage", currentPage);
    
    // 페이지 언마운트 시 정리
    return () => {
      // 언마운트 시에는 저장하지 않음 (다른 페이지로 이동하는 것을 감지하기 위해)
    };
  }, [pathname]);

  // Fetch existing prompt if promptId is provided
  useEffect(() => {
    if (promptId) {
      const fetchPrompt = async () => {
        try {
          const response = await fetch(`/api/prompts/${promptId}`);
          if (response.ok) {
            const data = await response.json();
            setExistingPromptData({
              id: data.id,
              topic: data.topic,
              prompt: data.prompt,
              recommendedTools: data.recommendedTools,
              tips: data.tips,
              aiProvider: data.aiProvider,
              aiModel: data.aiModel,
            });
          }
        } catch (error) {
          console.error("Error fetching prompt:", error);
        }
      };
      fetchPrompt();
    }
  }, [promptId]);

  const handlePromptSaved = () => {
    // Trigger sidebar refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-red-50/30 to-white relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-red-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl" />
      </div>
      <Header onToggleSidebar={toggleSidebar} />

      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? "lg:ml-80" : ""}`}>
        <div className="container mx-auto px-4 py-12 relative z-10">
          {/* Header - 로딩 중일 때 숨김 */}
          {!isGenerating && (
            <div className="text-center mb-12">
              {/* --- 정밀 구현: Hyper-Realistic 3D Glass Icon --- */}
              <div className="relative mx-auto mb-6 w-16 h-16 group cursor-pointer select-none">

                {/* 1. 바닥 그림자 */}
                <div className="absolute inset-0 rounded-[18px] bg-rose-400/40 blur-lg transform translate-y-2 scale-95 transition-all duration-500 group-hover:scale-100 group-hover:bg-rose-500/50" />

                {/* 2. 메인 컨테이너 - 밝은 로즈/핑크색 */}
                <div
                  className="relative w-full h-full rounded-[18px] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(180deg, #FFF1F2 0%, #FFE4E6 40%, #FECDD3 100%)',
                    boxShadow: `
                      inset 0 2px 3px 0 rgba(255, 255, 255, 0.9),
                      inset 0 -2px 4px 0 rgba(220, 100, 120, 0.15),
                      0 0 0 2px rgba(254, 205, 211, 0.6),
                      0 6px 16px -3px rgba(244, 63, 94, 0.4)
                    `
                  }}
                >

                  {/* 3. 상단 물광 반사 */}
                  <div
                    className="absolute top-0 left-0 right-0 h-[55%] rounded-t-[18px]"
                    style={{
                      background: 'linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 100%)',
                    }}
                  />

                  {/* 4. 내부 아이콘 - 로즈 색상 */}
                  <Wand2
                    className="relative z-10 w-7 h-7 transition-all duration-300 group-hover:scale-105"
                    color="#E11D48"
                    strokeWidth={2.2}
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(225, 29, 72, 0.3))'
                    }}
                  />

                  {/* 5. 하단 미세 광택 */}
                  <div className="absolute bottom-1.5 left-2 right-2 h-[6px] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                <span className="text-foreground dark:text-white/90">
                  당신의 세상을 만나보세요
                </span>
              </h1>
              {currentStep !== "result" && (
                <>
                  <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto mb-4">
                    {t.generate.subtitle}
                  </p>
                  {/* AI 기반 버튼 */}
                  <div className="flex justify-center mt-4 mb-8">
                    <button className="px-3 py-1.5 rounded-xl bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 flex items-center justify-center shadow-lg text-rose-500 text-sm font-medium">
                      AI 기반
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Generator Component */}
          <div className="max-w-3xl mx-auto">
            <PromptGenerator
              initialTopic={initialTopic}
              existingPromptData={existingPromptData}
              onPromptSaved={handlePromptSaved}
              onStepChange={setCurrentStep}
              onGeneratingChange={setIsGenerating}
            />
          </div>

          {/* Info Section - result 단계가 아닐 때만 표시 */}
          {currentStep !== "result" && !isGenerating && (
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <div className="card-aurora rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <MessageSquare className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">대화형 질문</h3>
                    <p className="text-sm text-muted-foreground">
                      AI가 5가지 핵심 질문을 던지고 답변을 바탕으로 최적화된 프롬프트를 생성합니다
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-aurora rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Lightbulb className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">AI 도구 추천</h3>
                    <p className="text-sm text-muted-foreground">
                      생성된 프롬프트에 가장 적합한 AI 도구를 자동으로 추천해드립니다
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-aurora rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Zap className="h-6 w-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">즉시 사용 가능</h3>
                    <p className="text-sm text-muted-foreground">
                      생성된 프롬프트를 바로 복사하여 AI 도구에서 사용할 수 있습니다
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <GenerateContent />
    </Suspense>
  );
}
