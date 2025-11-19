"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import Header from "@/components/Header";
import PromptGenerator from "@/components/PromptGenerator";
import LeftSidebar from "@/components/LeftSidebar";
import { Sparkles, Wand2 } from "lucide-react";
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
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 flex items-center justify-center shadow-lg mx-auto mb-4">
                <Wand2 className="h-8 w-8 text-rose-500" />
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
