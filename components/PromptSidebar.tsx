"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FileText, Loader2, X, Menu } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AIProviderBadge, isAIProvider } from "@/components/AIProviderBadge";

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  createdAt: string;
  aiProvider?: string | null;
  aiModel?: string | null;
}

interface PromptSidebarProps {
  onPromptSelect?: (prompt: SavedPrompt) => void;
  refreshTrigger?: number;
}

export default function PromptSidebar({ onPromptSelect, refreshTrigger }: PromptSidebarProps) {
  const { data: session } = useSession();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (session) {
      fetchPrompts();
    }
  }, [session, refreshTrigger]);

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/prompts/list");
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 lg:hidden p-4 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-16 right-0 h-[calc(100vh-4rem)] w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto transition-transform duration-300 z-40
          ${isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">저장된 프롬프트</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">저장된 프롬프트가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {prompts.map((prompt) => {
                const provider = prompt.aiProvider && isAIProvider(prompt.aiProvider) ? prompt.aiProvider : null;
                return (
                <button
                  key={prompt.id}
                  onClick={() => {
                    if (onPromptSelect) {
                      onPromptSelect(prompt);
                    }
                    setIsOpen(false);
                  }}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1 truncate group-hover:text-primary transition-colors">
                          {prompt.topic}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                          {prompt.prompt.substring(0, 100)}...
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {formatDistanceToNow(new Date(prompt.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                    {provider && (
                      <AIProviderBadge provider={provider} model={prompt.aiModel || undefined} size="sm" />
                    )}
                  </div>
                </button>
              )})}
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        />
      )}
    </>
  );
}
