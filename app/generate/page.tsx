"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import PromptGenerator from "@/components/PromptGenerator";
import LeftSidebar from "@/components/LeftSidebar";
import { Sparkles } from "lucide-react";
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
  const initialTopic = searchParams.get("topic") || "";
  const promptId = searchParams.get("promptId") || undefined;
  const [existingPromptData, setExistingPromptData] = useState<ExistingPromptData | undefined>(undefined);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
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
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-md text-foreground border-2 border-white/40 shadow-lg shadow-black/5 dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 dark:text-foreground dark:shadow-[0_0_18px_rgba(64,248,255,0.25)] rounded-full mb-4">
              <span className="text-sm font-semibold">{t.generate.badge}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground dark:text-white/90">
              {t.generate.title} <span className="text-foreground dark:text-white/90">{t.generate.titleHighlight}</span>{t.generate.titleEnd}
            </h1>
            <p className="text-xl text-muted-foreground dark:text-white/80 max-w-2xl mx-auto">
              {t.generate.subtitle}
            </p>
          </div>

          {/* Generator Component */}
          <div className="max-w-3xl mx-auto">
            <PromptGenerator
              initialTopic={initialTopic}
              existingPromptData={existingPromptData}
              onPromptSaved={handlePromptSaved}
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
