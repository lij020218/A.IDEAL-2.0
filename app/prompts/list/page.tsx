"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import PromptCard from "@/components/PromptCard";
import UserPromptCard from "@/components/UserPromptCard";
import { samplePrompts } from "@/lib/data/prompts";
import { FileText, Loader2, Filter } from "lucide-react";
import { PromptCategory } from "@/types";

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  imageUrl?: string | null;
  createdAt: string;
  user: {
    name?: string;
    email: string;
  };
}

const categoryLabels: Record<string, string> = {
  "all": "전체",
  "writing": "글쓰기",
  "marketing": "마케팅",
  "coding": "코딩",
  "design": "디자인",
  "business": "비즈니스",
  "education": "교육",
  "productivity": "생산성",
  "creative": "창작",
};

export default function PromptsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");

  useEffect(() => {
    fetchSavedPrompts();
    const category = searchParams.get("category");
    if (category) {
      setSelectedCategory(category as PromptCategory | "all");
    }
  }, [searchParams]);

  const fetchSavedPrompts = async () => {
    try {
      const response = await fetch("/api/prompts/public");
      if (response.ok) {
        const data = await response.json();
        setSavedPrompts(data.prompts);
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

  const filteredSamplePrompts = selectedCategory === "all"
    ? samplePrompts
    : samplePrompts.filter(prompt => prompt.category === selectedCategory);

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
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">프롬프트 모음</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            다양한 프롬프트를 탐색하고 활용하세요
          </p>
        </div>

        {/* All Prompts Section */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold gradient-text">등록된 프롬프트</h2>
            <p className="text-sm text-muted-foreground">커뮤니티가 만든 다양한 프롬프트</p>
          </div>

          {/* Category Filter */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">카테고리별 탐색</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary hover:bg-secondary/80"
                  }`}
                >
                  {categoryLabels[category] || category}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* User Created Prompts - only show in "all" category */}
              {selectedCategory === "all" && savedPrompts.map((prompt) => (
                <UserPromptCard key={`user-${prompt.id}`} prompt={prompt} />
              ))}

              {/* Example Prompts */}
              {filteredSamplePrompts.map((prompt) => (
                <PromptCard key={`sample-${prompt.id}`} prompt={prompt} />
              ))}
            </div>
          )}

          {!isLoading && selectedCategory === "all" && savedPrompts.length === 0 && filteredSamplePrompts.length === 0 && (
            <div className="text-center py-20">
              <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">등록된 프롬프트가 없습니다</p>
            </div>
          )}

          {!isLoading && selectedCategory !== "all" && filteredSamplePrompts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">이 카테고리에 프롬프트가 없습니다</p>
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-20">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© 2024 A.IDEAL - AI 프롬프트 생성 플랫폼</p>
        </div>
      </footer>
    </div>
  );
}
