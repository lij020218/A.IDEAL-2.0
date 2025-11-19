"use client";

import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { aiTools } from "@/lib/data/ai-tools";
import { ExternalLink, Filter, Wrench } from "lucide-react";
import { useState } from "react";
import { AIToolCategory } from "@/types";

const categoryIcons: Record<string, string> = {
  "text-generation": "✍️",
  "image-generation": "🎨",
  "code-assistant": "💻",
  "data-analysis": "📊",
  "audio-generation": "🎵",
  "video-generation": "🎬",
  general: "🌟",
};

const categoryLabels: Record<string, string> = {
  "all": "전체",
  "text-generation": "텍스트 생성",
  "image-generation": "이미지 생성",
  "code-assistant": "코드 어시스턴트",
  "data-analysis": "데이터 분석",
  "audio-generation": "오디오 생성",
  "video-generation": "비디오 생성",
  "general": "일반",
};

export default function ToolsPage() {
  const [selectedFilter, setSelectedFilter] = useState<AIToolCategory | "all">("all");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredTools =
    selectedFilter === "all"
      ? aiTools
      : aiTools.filter((tool) => tool.category === selectedFilter);

  const categories: (AIToolCategory | "all")[] = [
    "all",
    "text-generation",
    "image-generation",
    "code-assistant",
    "data-analysis",
    "audio-generation",
    "video-generation",
    "general",
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-200 via-gray-200 to-slate-100 relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-slate-300/60 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gray-300/60 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-slate-300/50 rounded-full blur-3xl" />
      </div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-300/60 to-gray-400/60 backdrop-blur-lg border border-slate-400/50 flex items-center justify-center shadow-xl shadow-black/20 mx-auto mb-4 dark:from-slate-500/30 dark:to-gray-500/30 dark:border-slate-400/40">
            <Wrench className="h-8 w-8 text-slate-800 dark:text-slate-300" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-foreground dark:text-white/90">AI 도구 모음</span>
          </h1>
          <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto mb-4">
            다양한 AI 도구를 탐색하고 활용하세요
          </p>
          {/* AI 기반 버튼 */}
          <div className="flex justify-center mt-4 mb-8">
            <button className="px-3 py-1.5 rounded-xl bg-gradient-to-br from-slate-300/60 to-gray-400/60 backdrop-blur-lg border border-slate-400/50 flex items-center justify-center shadow-xl shadow-black/20 text-slate-800 dark:text-slate-300 text-sm font-medium dark:from-slate-500/30 dark:to-gray-500/30 dark:border-slate-400/40">
              AI 기반
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">카테고리별 필터</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedFilter(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border-2 backdrop-blur-lg ${
                  selectedFilter === category
                    ? "bg-slate-300/40 backdrop-blur-lg border-slate-400/60 text-slate-800 shadow-xl shadow-black/20 dark:bg-white/15 dark:backdrop-blur-lg dark:border-white/30 dark:text-foreground dark:shadow-xl dark:shadow-white/20"
                    : "bg-white/20 backdrop-blur-lg dark:bg-white/10 dark:backdrop-blur-lg text-foreground border-white/40 dark:border-white/30 hover:bg-white/30 dark:hover:bg-white/15 shadow-lg shadow-black/10 dark:shadow-black/20"
                }`}
              >
                {categoryLabels[category] || category}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <div className="card-aurora h-full p-6 rounded-xl hover:shadow-xl transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 rounded-lg bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {categoryIcons[tool.category] || "🔧"}
                  </div>
                  <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {tool.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs bg-secondary px-2 py-1 rounded">
                    {categoryLabels[tool.category] || tool.category}
                  </span>
                  {tool.isPremium && (
                    <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded">
                      프리미엄
                    </span>
                  )}
                </div>
              </div>
            </a>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              이 카테고리에 도구가 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
