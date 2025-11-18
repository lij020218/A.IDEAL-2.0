"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import PromptCard from "@/components/PromptCard";
import UserPromptCard from "@/components/UserPromptCard";
import SearchFilters from "@/components/SearchFilters";
import { samplePrompts } from "@/lib/data/prompts";
import { FileText, Loader2, Filter, Search, Plus, ChevronDown, ChevronUp } from "lucide-react";
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
  viewCount?: number;
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

  // Filter sample prompts by category (for example prompts only)
  const filteredSamplePrompts = useMemo(() => {
    return samplePrompts.filter((prompt) => {
      if (selectedCategory === "all") return true;
      return prompt.category === selectedCategory;
    });
  }, [selectedCategory]);

  // API에서 이미 필터링되고 정렬된 결과를 받으므로 그대로 사용
  const visibleSavedPrompts = savedPrompts;
  const hasResults = visibleSavedPrompts.length > 0 || filteredSamplePrompts.length > 0;

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
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <div className="mb-12">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-foreground dark:text-white/90">프롬프트 모음</span>
            </h1>
            <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto mb-6">
              다양한 프롬프트를 검색하고 바로 활용해 보세요.
            </p>
            <Link
              href="/prompts/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-white/50 bg-white/60 backdrop-blur-md text-foreground hover:bg-white/70 dark:bg-white/10 dark:backdrop-blur-md dark:border-white/20 dark:text-foreground dark:hover:bg-white/15 transition-all font-semibold text-sm shadow-xl shadow-black/10 dark:shadow-black/30"
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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border-2 ${
                    selectedCategory === category
                      ? "bg-foreground/20 backdrop-blur-md border-foreground/40 text-foreground shadow-xl shadow-black/15 dark:bg-white/15 dark:backdrop-blur-md dark:border-white/30 dark:text-foreground dark:shadow-xl dark:shadow-white/20"
                      : "bg-white/60 backdrop-blur-md dark:bg-white/5 dark:backdrop-blur-md text-foreground border-white/50 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/10 shadow-lg shadow-black/8 dark:shadow-black/15"
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
                            className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border-2 whitespace-nowrap ${
                              isSelected
                                ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm ${colors.darkBg} ${colors.darkBorder} dark:backdrop-blur-md dark:shadow-xl backdrop-blur-md shadow-xl`
                                : "bg-white/60 backdrop-blur-md dark:bg-white/5 dark:backdrop-blur-md text-foreground border-white/50 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/10 shadow-lg shadow-black/8 dark:shadow-black/15"
                            }`}
                          >
                            {tool.label}
                          </button>
                        );
                      })}
                      {!isAIToolsExpanded && (
                        <button
                          onClick={() => setIsAIToolsExpanded(true)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border-2 bg-white/60 backdrop-blur-md dark:bg-white/5 dark:backdrop-blur-md text-foreground border-white/50 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/10 shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center justify-center"
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
                              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border-2 whitespace-nowrap ${
                                isSelected
                                  ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm ${colors.darkBg} ${colors.darkBorder} dark:backdrop-blur-md dark:shadow-xl backdrop-blur-md shadow-xl`
                                  : "bg-white/60 backdrop-blur-md dark:bg-white/5 dark:backdrop-blur-md text-foreground border-white/50 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/10 shadow-lg shadow-black/8 dark:shadow-black/15"
                              }`}
                            >
                              {tool.label}
                            </button>
                          );
                        })}
                        <button
                          onClick={() => setIsAIToolsExpanded(false)}
                          className="px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border-2 bg-white/60 backdrop-blur-md dark:bg-white/5 dark:backdrop-blur-md text-foreground border-white/50 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/10 shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center justify-center"
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
              {visibleSavedPrompts.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xl font-semibold mb-4">등록된 프롬프트 ({visibleSavedPrompts.length}개)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleSavedPrompts.map((prompt) => (
                      <UserPromptCard key={prompt.id} prompt={prompt} />
                    ))}
                  </div>
                </div>
              )}

              {/* Example Prompts (only show when no search/filters) */}
              {!searchQuery && !aiProvider && selectedCategory === "all" && filteredSamplePrompts.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">예시 프롬프트</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSamplePrompts.map((prompt) => (
                      <PromptCard key={prompt.id} prompt={prompt} />
                    ))}
                  </div>
                </div>
              )}
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
