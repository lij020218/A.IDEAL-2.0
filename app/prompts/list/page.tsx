"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import UserPromptCard from "@/components/UserPromptCard";
import SearchFilters from "@/components/SearchFilters";
import { FileText, Loader2, Filter, Plus, ChevronUp, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { PromptCategory, AIProvider } from "@/types";

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  imageUrl?: string | null;
  createdAt: string;
  usageCount?: number;
  views?: number;
  averageRating?: number | null;
  ratingCount?: number;
  aiProvider?: AIProvider | null;
  aiModel?: string | null;
  user: {
    id?: string;
    name?: string;
    email: string;
  };
}

type SortOption = "latest" | "relevance" | "popular";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "latest", label: "최신순" },
  { value: "relevance", label: "관련성순" },
  { value: "popular", label: "조회수순" },
];

const categoryLabels: Record<string, string> = {
  all: "전체",
  writing: "글쓰기",
  marketing: "마케팅",
  coding: "코딩",
  design: "디자인",
  business: "비즈니스",
  education: "교육",
  productivity: "생산성",
  creative: "창작",
};

function PromptsListContent() {
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOption>("latest");

  const [aiProvider, setAiProvider] = useState("");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isAIToolsExpanded, setIsAIToolsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // 페이지네이션 적용
  const totalPages = Math.ceil(savedPrompts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const visibleSavedPrompts = savedPrompts.slice(startIndex, endIndex);
  const hasResults = savedPrompts.length > 0;

  useEffect(() => {
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category as PromptCategory | "all");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSearchHistory();
  }, []);

  useEffect(() => {
    fetchSavedPrompts();
  }, [searchQuery, selectedCategory, aiProvider, sortOrder]);

  // 필터 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, aiProvider, sortOrder]);

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch("/api/search/history?limit=10");
      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data.history.map((h: any) => h.query));
      }
    } catch (error) {
      console.error("Error fetching search history:", error);
    }
  };

  const fetchSavedPrompts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      if (selectedCategory !== "all") params.set("category", selectedCategory);
      // aiProvider는 API에 전달하지 않고 클라이언트에서 필터링
      params.set("sort", sortOrder === "relevance" ? "latest" : sortOrder);

      const response = await fetch(`/api/prompts/public?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // AI 툴 필터링 (recommendedTools 기반)
        let filteredPrompts = data.prompts;
        if (aiProvider) {
          // AI 툴 이름 매핑
          const toolNameMap: Record<string, string[]> = {
            "gpt": ["gpt", "chatgpt", "openai", "chat gpt"],
            "claude": ["claude", "anthropic"],
            "grok": ["grok", "x ai", "xai", "grok image"],
            "grok-image": ["grok image", "grok", "x ai", "xai"],
            "midjourney": ["midjourney", "mj"],
            "gemini": ["gemini", "google gemini", "bard"],
            "sora": ["sora", "openai sora", "sora 2"],
            "sora-2": ["sora 2", "sora", "openai sora"],
            "dall-e": ["dall-e", "dall e", "dalle", "dall-e 3"],
            "github-copilot": ["github copilot", "copilot", "github"],
            "perplexity": ["perplexity", "perplexity ai"],
            "stable-diffusion": ["stable diffusion", "stability ai"],
            "eleven-labs": ["elevenlabs", "eleven labs"],
            "runway": ["runway", "runwayml"],
            "veo-3": ["veo", "veo 3", "google veo"],
            "kling-ai": ["kling", "kling ai"],
            "pika": ["pika", "pika 2.1", "pika art"],
            "heygen": ["heygen", "hey gen"],
            "synthesia": ["synthesia"],
            "ideogram": ["ideogram"],
            "flux": ["flux", "black forest labs"],
          };
          
          const searchTerms = toolNameMap[aiProvider.toLowerCase()] || [aiProvider.toLowerCase()];
          
          filteredPrompts = data.prompts.filter((prompt: SavedPrompt) => {
            const tools = prompt.recommendedTools || [];
            return tools.some((tool: string) => {
              const toolLower = tool.toLowerCase();
              return searchTerms.some(term => toolLower.includes(term));
            });
          });
        }
        setSavedPrompts(filteredPrompts);
      }
    } catch (error) {
      console.error("Error fetching saved prompts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const categories: (PromptCategory | "all")[] = [
    "all",
    "writing",
    "marketing",
    "coding",
    "design",
    "business",
    "education",
    "productivity",
    "creative",
  ];

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
        <div className="mb-12">
          <div className="text-center">
           {/* --- 정밀 구현: 3D Glassmorphism Icon --- */}
<div className="relative mx-auto mb-6 w-16 h-16 group cursor-pointer select-none">

  {/* 1. 바닥 그림자 */}
  <div className="absolute inset-0 rounded-[18px] bg-orange-300/40 blur-lg transform translate-y-2 scale-95 transition-all duration-500 group-hover:scale-100 group-hover:bg-orange-400/50" />

  {/* 2. 메인 컨테이너 - 밝은 살구색 */}
  <div
    className="relative w-full h-full rounded-[18px] flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:-translate-y-0.5"
    style={{
      background: 'linear-gradient(180deg, #FFF5EB 0%, #FFECD9 40%, #FFE0C7 100%)',
      boxShadow: `
        inset 0 2px 3px 0 rgba(255, 255, 255, 0.9),
        inset 0 -2px 4px 0 rgba(255, 180, 130, 0.15),
        0 0 0 2px rgba(255, 218, 185, 0.6),
        0 6px 16px -3px rgba(255, 160, 100, 0.4)
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

    {/* 4. 내부 아이콘 - 오렌지 색상 */}
    <MessageSquare
      className="relative z-10 w-7 h-7 transition-all duration-300 group-hover:scale-105"
      color="#F97316"
      strokeWidth={2.2}
      style={{
        filter: 'drop-shadow(0 1px 2px rgba(249, 115, 22, 0.3))'
      }}
    />

    {/* 5. 하단 미세 광택 */}
    <div className="absolute bottom-1.5 left-2 right-2 h-[6px] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

  </div>
</div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="text-foreground dark:text-white/90">프롬프트 모음</span>
            </h1>
            <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto mb-6">
              다양한 프롬프트를 검색하고 바로 활용해 보세요.
            </p>
            <Link
              href="/prompts/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-orange-200/50 bg-gradient-to-r from-orange-100/50 to-amber-100/50 backdrop-blur-md text-orange-600 hover:from-orange-100/70 hover:to-amber-100/70 dark:from-orange-500/20 dark:to-amber-500/20 dark:border-orange-400/30 dark:text-orange-400 dark:hover:from-orange-500/30 dark:hover:to-amber-500/30 transition-all font-semibold text-sm shadow-lg shadow-orange-500/10"
            >
              <Plus className="h-4 w-4" />
              프롬프트 등록
            </Link>
          </div>
        </div>

        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground dark:text-white/90">등록된 프롬프트</h2>
            <p className="text-sm text-muted-foreground dark:text-white/80">커뮤니티가 만든 최신 프롬프트들</p>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground dark:text-white/80" />
              <h3 className="text-lg font-semibold text-foreground dark:text-white/90">카테고리로 탐색</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border-2 backdrop-blur-lg ${
                    selectedCategory === category
                      ? "border-orange-200/60 bg-gradient-to-r from-orange-100/40 to-amber-100/40 backdrop-blur-lg text-orange-600 hover:from-orange-100/60 hover:to-amber-100/60 dark:from-orange-500/30 dark:to-amber-500/30 dark:border-orange-400/40 dark:text-orange-400 dark:hover:from-orange-500/40 dark:hover:to-amber-500/40 shadow-xl shadow-orange-500/20"
                      : "bg-white/20 backdrop-blur-lg dark:bg-white/10 dark:backdrop-blur-lg text-foreground border-white/40 dark:border-white/30 hover:bg-white/30 dark:hover:bg-white/15 shadow-lg shadow-black/10 dark:shadow-black/20"
                  }`}
                >
                  {categoryLabels[category] || category}
                </button>
              ))}
            </div>
          </div>

          {/* AI Tool Filter */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-muted-foreground dark:text-white/80" />
              <h3 className="text-lg font-semibold text-foreground dark:text-white/90">AI 툴로 탐색</h3>
            </div>
            <div className="flex flex-col gap-2">
              {/* First Row */}
              <div className="flex flex-wrap gap-1.5 items-center">
                {(() => {
                  const getAIProviderColor = (provider: string): { bg: string; text: string; border: string; darkBg: string; darkBorder: string } => {
                    switch (provider) {
                      case "gpt":
                      case "chatgpt":
                        return { bg: "bg-gray-400", text: "text-white", border: "border-gray-400", darkBg: "dark:bg-gray-400/20", darkBorder: "dark:border-gray-400/40" };
                      case "claude":
                        return { bg: "bg-orange-300", text: "text-white", border: "border-orange-300", darkBg: "dark:bg-orange-300/20", darkBorder: "dark:border-orange-300/40" };
                      case "grok":
                      case "grok-image":
                        return { bg: "bg-black", text: "text-white", border: "border-black", darkBg: "dark:bg-black/30", darkBorder: "dark:border-black/50" };
                      case "midjourney":
                        return { bg: "bg-[#ff006e]", text: "text-white", border: "border-[#ff006e]", darkBg: "dark:bg-[#ff006e]/20", darkBorder: "dark:border-[#ff006e]/40" };
                      case "gemini":
                        return { bg: "bg-[#00d4ff]", text: "text-white", border: "border-[#00d4ff]", darkBg: "dark:bg-[#00d4ff]/20", darkBorder: "dark:border-[#00d4ff]/40" };
                      case "sora":
                      case "sora-2":
                        return { bg: "bg-[#00bcd4]", text: "text-white", border: "border-[#00bcd4]", darkBg: "dark:bg-[#00bcd4]/20", darkBorder: "dark:border-[#00bcd4]/40" };
                      case "dall-e":
                        return { bg: "bg-slate-600", text: "text-white", border: "border-slate-600", darkBg: "dark:bg-slate-600/20", darkBorder: "dark:border-slate-600/40" };
                      case "github-copilot":
                        return { bg: "bg-blue-600", text: "text-white", border: "border-blue-600", darkBg: "dark:bg-blue-600/20", darkBorder: "dark:border-blue-600/40" };
                      case "perplexity":
                        return { bg: "bg-purple-600", text: "text-white", border: "border-purple-600", darkBg: "dark:bg-purple-600/20", darkBorder: "dark:border-purple-600/40" };
                      case "stable-diffusion":
                        return { bg: "bg-emerald-600", text: "text-white", border: "border-emerald-600", darkBg: "dark:bg-emerald-600/20", darkBorder: "dark:border-emerald-600/40" };
                      case "eleven-labs":
                        return { bg: "bg-amber-600", text: "text-white", border: "border-amber-600", darkBg: "dark:bg-amber-600/20", darkBorder: "dark:border-amber-600/40" };
                      case "runway":
                        return { bg: "bg-rose-600", text: "text-white", border: "border-rose-600", darkBg: "dark:bg-rose-600/20", darkBorder: "dark:border-rose-600/40" };
                      case "veo-3":
                        return { bg: "bg-[#0ea5e9]", text: "text-white", border: "border-[#0ea5e9]", darkBg: "dark:bg-[#0ea5e9]/20", darkBorder: "dark:border-[#0ea5e9]/40" };
                      case "kling-ai":
                        return { bg: "bg-yellow-600", text: "text-white", border: "border-yellow-600", darkBg: "dark:bg-yellow-600/20", darkBorder: "dark:border-yellow-600/40" };
                      case "pika":
                        return { bg: "bg-fuchsia-600", text: "text-white", border: "border-fuchsia-600", darkBg: "dark:bg-fuchsia-600/20", darkBorder: "dark:border-fuchsia-600/40" };
                      case "heygen":
                        return { bg: "bg-[#14b8a6]", text: "text-white", border: "border-[#14b8a6]", darkBg: "dark:bg-[#14b8a6]/20", darkBorder: "dark:border-[#14b8a6]/40" };
                      case "synthesia":
                        return { bg: "bg-indigo-600", text: "text-white", border: "border-indigo-600", darkBg: "dark:bg-indigo-600/20", darkBorder: "dark:border-indigo-600/40" };
                      case "ideogram":
                        return { bg: "bg-lime-600", text: "text-white", border: "border-lime-600", darkBg: "dark:bg-lime-600/20", darkBorder: "dark:border-lime-600/40" };
                      case "flux":
                        return { bg: "bg-violet-600", text: "text-white", border: "border-violet-600", darkBg: "dark:bg-violet-600/20", darkBorder: "dark:border-violet-600/40" };
                      default:
                        return { bg: "bg-white", text: "text-foreground", border: "border-border", darkBg: "dark:bg-white/10", darkBorder: "dark:border-white/20" };
                    }
                  };
                  const firstRowTools = [
                    { value: "", label: "전체" },
                    { value: "gpt", label: "GPT" },
                    { value: "claude", label: "Claude" },
                    { value: "grok", label: "Grok" },
                    { value: "midjourney", label: "Midjourney" },
                    { value: "gemini", label: "Gemini" },
                    { value: "sora", label: "Sora" },
                    { value: "dall-e", label: "DALL-E" },
                    { value: "github-copilot", label: "GitHub Copilot" },
                    { value: "perplexity", label: "Perplexity" },
                    { value: "stable-diffusion", label: "Stable Diffusion" },
                    { value: "eleven-labs", label: "ElevenLabs" },
                    { value: "runway", label: "Runway" },
                    { value: "veo-3", label: "Veo" },
                    { value: "kling-ai", label: "Kling AI" },
                  ];
                  return (
                    <>
                      {firstRowTools.map((tool) => {
                        const colors = getAIProviderColor(tool.value);
                        const isSelected = aiProvider === tool.value;
                        return (
                          <button
                            key={tool.value}
                            onClick={() => setAiProvider(tool.value)}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border-2 whitespace-nowrap backdrop-blur-lg ${
                              isSelected
                                ? `${colors.bg} ${colors.text} ${colors.border} ${colors.darkBg} ${colors.darkBorder} dark:backdrop-blur-lg dark:shadow-xl backdrop-blur-lg shadow-xl border-opacity-60 dark:border-opacity-50`
                                : "bg-white/20 backdrop-blur-lg dark:bg-white/10 dark:backdrop-blur-lg text-foreground border-white/40 dark:border-white/30 hover:bg-white/30 dark:hover:bg-white/15 shadow-lg shadow-black/10 dark:shadow-black/20"
                            }`}
                          >
                            {tool.label}
                          </button>
                        );
                      })}
                      {!isAIToolsExpanded && (
                        <button
                          onClick={() => setIsAIToolsExpanded(true)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border-2 bg-white/20 backdrop-blur-lg dark:bg-white/10 dark:backdrop-blur-lg text-foreground border-white/40 dark:border-white/30 hover:bg-white/30 dark:hover:bg-white/15 shadow-lg shadow-black/10 dark:shadow-black/20 flex items-center justify-center"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
              
              {/* Second Row (when expanded) */}
              {isAIToolsExpanded && (
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    const getAIProviderColor = (provider: string): { bg: string; text: string; border: string; darkBg: string; darkBorder: string } => {
                      switch (provider) {
                        case "pika":
                          return { bg: "bg-fuchsia-600", text: "text-white", border: "border-fuchsia-600", darkBg: "dark:bg-fuchsia-600/20", darkBorder: "dark:border-fuchsia-600/40" };
                        case "heygen":
                          return { bg: "bg-[#14b8a6]", text: "text-white", border: "border-[#14b8a6]", darkBg: "dark:bg-[#14b8a6]/20", darkBorder: "dark:border-[#14b8a6]/40" };
                        case "synthesia":
                          return { bg: "bg-indigo-600", text: "text-white", border: "border-indigo-600", darkBg: "dark:bg-indigo-600/20", darkBorder: "dark:border-indigo-600/40" };
                        case "ideogram":
                          return { bg: "bg-lime-600", text: "text-white", border: "border-lime-600", darkBg: "dark:bg-lime-600/20", darkBorder: "dark:border-lime-600/40" };
                        case "flux":
                          return { bg: "bg-violet-600", text: "text-white", border: "border-violet-600", darkBg: "dark:bg-violet-600/20", darkBorder: "dark:border-violet-600/40" };
                        default:
                          return { bg: "bg-white", text: "text-foreground", border: "border-border", darkBg: "dark:bg-white/10", darkBorder: "dark:border-white/20" };
                      }
                    };
                    const moreAITools = [
                      { value: "pika", label: "Pika" },
                      { value: "heygen", label: "HeyGen" },
                      { value: "synthesia", label: "Synthesia" },
                      { value: "ideogram", label: "Ideogram" },
                      { value: "flux", label: "Flux" },
                    ];
                    return (
                      <>
                        {moreAITools.map((tool) => {
                          const colors = getAIProviderColor(tool.value);
                          const isSelected = aiProvider === tool.value;
                          return (
                            <button
                              key={tool.value}
                              onClick={() => setAiProvider(tool.value)}
                              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border-2 whitespace-nowrap backdrop-blur-lg ${
                                isSelected
                                  ? `${colors.bg} ${colors.text} ${colors.border} ${colors.darkBg} ${colors.darkBorder} dark:backdrop-blur-lg dark:shadow-xl backdrop-blur-lg shadow-xl border-opacity-60 dark:border-opacity-50`
                                  : "bg-white/20 backdrop-blur-lg dark:bg-white/10 dark:backdrop-blur-lg text-foreground border-white/40 dark:border-white/30 hover:bg-white/30 dark:hover:bg-white/15 shadow-lg shadow-black/10 dark:shadow-black/20"
                              }`}
                            >
                              {tool.label}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setIsAIToolsExpanded(false)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border-2 bg-white/20 backdrop-blur-lg dark:bg-white/10 dark:backdrop-blur-lg text-foreground border-white/40 dark:border-white/30 hover:bg-white/30 dark:hover:bg-white/15 shadow-lg shadow-black/10 dark:shadow-black/20 flex items-center justify-center"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Search Filters */}
          <div className="mb-8">
            <SearchFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              aiProvider={aiProvider}
              onAiProviderChange={setAiProvider}
              sortOrder={sortOrder}
              onSortChange={(sort) => setSortOrder(sort as SortOption)}
              searchHistory={searchHistory}
              onHistorySelect={(query) => {
                setSearchQuery(query);
                fetchSavedPrompts();
              }}
              onClearHistory={async () => {
                try {
                  await fetch("/api/search/history", { method: "DELETE" });
                  setSearchHistory([]);
                } catch (error) {
                  console.error("Error clearing search history:", error);
                }
              }}
            />
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground dark:text-white/80" />
            </div>
          ) : hasResults ? (
            <>
              <div className="mb-12">
                <h3 className="text-xl font-semibold mb-4">등록된 프롬프트 ({savedPrompts.length}개)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleSavedPrompts.map((prompt) => (
                    <UserPromptCard key={prompt.id} prompt={prompt} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      이전
                    </button>

                    <div className="flex items-center gap-2">
                      {(() => {
                        const pages: (number | string)[] = [];
                        const maxVisible = 7; // 최대 표시할 페이지 버튼 수

                        if (totalPages <= maxVisible) {
                          // 페이지가 적으면 모두 표시
                          for (let i = 1; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // 많으면 ellipsis 사용
                          if (currentPage <= 3) {
                            // 시작 부분
                            for (let i = 1; i <= 5; i++) pages.push(i);
                            pages.push('...');
                            pages.push(totalPages);
                          } else if (currentPage >= totalPages - 2) {
                            // 끝 부분
                            pages.push(1);
                            pages.push('...');
                            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
                          } else {
                            // 중간 부분
                            pages.push(1);
                            pages.push('...');
                            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                            pages.push('...');
                            pages.push(totalPages);
                          }
                        }

                        return pages.map((page, idx) => {
                          if (page === '...') {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground dark:text-white/60">
                                ...
                              </span>
                            );
                          }
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page as number)}
                              className={`px-4 py-2 rounded-lg transition-all ${
                                currentPage === page
                                  ? "border-2 border-orange-200/60 bg-gradient-to-r from-orange-100/70 to-amber-100/70 text-orange-600 dark:from-orange-500/30 dark:to-amber-500/30 dark:border-orange-400/40 dark:text-orange-400 shadow-lg shadow-orange-500/20"
                                  : "border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 shadow-lg shadow-black/8 dark:shadow-black/15"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        });
                      })()}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      다음
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground dark:text-white/60 opacity-50" />
              <p className="text-muted-foreground dark:text-white/80">
                {searchQuery
                  ? `"${searchQuery}"에 맞는 프롬프트가 아직 없어요`
                  : "선택한 조건에 맞는 프롬프트가 없어요"}
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-20">
        <div className="container mx-auto text-center text-muted-foreground dark:text-white/80">
          <p>© 2024 A.IDEAL - AI 프롬프트 협업 플랫폼</p>
        </div>
      </footer>
    </div>
  );
}

export default function PromptsListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <PromptsListContent />
    </Suspense>
  );
}
