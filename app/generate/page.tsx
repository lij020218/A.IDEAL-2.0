"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import PromptGenerator from "@/components/PromptGenerator";
import LeftSidebar from "@/components/LeftSidebar";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function GeneratePage() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialTopic = searchParams.get("topic") || "";
  const promptId = searchParams.get("promptId") || undefined;
  const [existingPrompt, setExistingPrompt] = useState<string | undefined>(undefined);
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
            setExistingPrompt(data.prompt);
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
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />

      {/* Left Sidebar */}
      <LeftSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? "lg:ml-80" : ""}`}>
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full mb-4">
              <span className="text-sm font-semibold">{t.generate.badge}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.generate.title} <span className="gradient-text">{t.generate.titleHighlight}</span>{t.generate.titleEnd}
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t.generate.subtitle}
            </p>
          </div>

          {/* Generator Component */}
          <PromptGenerator
            initialTopic={initialTopic}
            existingPrompt={existingPrompt}
            onPromptSaved={handlePromptSaved}
          />
        </div>
      </div>
    </div>
  );
}
