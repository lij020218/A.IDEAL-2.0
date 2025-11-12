"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import PromptCard from "@/components/PromptCard";
import CategoryFilter from "@/components/CategoryFilter";
import { samplePrompts, getFeaturedPrompts } from "@/lib/data/prompts";
import { PromptCategory } from "@/types";
import { ArrowRight, Sparkles, Search, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [topicInput, setTopicInput] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const filteredPrompts = samplePrompts.filter((prompt) => {
    const matchesCategory = selectedCategory === "all" || prompt.category === selectedCategory;
    const matchesSearch =
      searchQuery === "" ||
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPrompts = getFeaturedPrompts();

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
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 gradient-bg opacity-10"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              {t.hero.title}{" "}
              <span className="gradient-text">{t.hero.titleHighlight}</span>
              {t.hero.titleEnd}
            </h1>
            <p className="text-xl text-muted-foreground">
              {t.hero.subtitle}
            </p>

            {/* Topic Input */}
            <div className="max-w-2xl mx-auto mt-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (topicInput.trim()) {
                    router.push(`/generate?topic=${encodeURIComponent(topicInput)}`);
                  }
                }}
              >
                <div className="relative flex gap-2">
                  <input
                    type="text"
                    placeholder="무엇을 만들고 싶으신가요? (예: 유튜브 영상 편집 프롬프트)"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    className="input-aurora flex-1 px-4 py-4 rounded-lg text-lg"
                  />
                  <button
                    type="submit"
                    disabled={!topicInput.trim()}
                    className="btn-aurora px-8 py-4 rounded-lg font-semibold flex items-center gap-2"
                  >
                    시작하기
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{samplePrompts.length}+</div>
                <div className="text-sm text-muted-foreground">{t.hero.statsPrompts}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">10+</div>
                <div className="text-sm text-muted-foreground">{t.hero.statsTools}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">9</div>
                <div className="text-sm text-muted-foreground">{t.hero.statsCategories}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Prompts */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold">{t.featured.title}</h2>
            </div>
            <Link
              href="/prompts"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              {t.featured.viewAll}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-6 w-6 text-primary" />
            <h2 className="text-3xl font-bold">{t.category.title}</h2>
          </div>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
      </section>

      {/* All Prompts */}
      <section className="py-12 px-4 pb-20">
        <div className="container mx-auto">
          <h3 className="text-2xl font-bold mb-6">
            {selectedCategory === "all"
              ? t.prompts.allPrompts
              : `${t.category[selectedCategory as keyof typeof t.category]} ${t.prompts.allPrompts}`}
          </h3>
          {filteredPrompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t.prompts.noResults}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>{t.footer.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
