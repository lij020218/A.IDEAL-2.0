 "use client";

import { Star, TrendingUp, Tag, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AIProviderBadge, isAIProvider, AI_PROVIDER_LABELS } from "@/components/AIProviderBadge";

// 도구 이름에서 AI 모델을 감지하여 배경색 클래스 반환
function getAIToolBgColor(toolName: string): { bg: string; text: string } {
  const name = toolName.toLowerCase();
  if (name.includes("gpt") || name.includes("chatgpt") || name.includes("openai")) {
    return { bg: "bg-gray-400", text: "text-white" }; // GPT: 회색 배경, 흰 텍스트
  }
  if (name.includes("claude") || name.includes("anthropic")) {
    return { bg: "bg-orange-300", text: "text-white" }; // Claude: 연한 주황 배경
  }
  if (name.includes("grok") || name.includes("xai")) {
    return { bg: "bg-black", text: "text-white" }; // Grok: 검정 배경, 흰 텍스트
  }
  if (name.includes("midjourney")) {
    return { bg: "bg-[#ff006e]", text: "text-white" }; // Midjourney: 네온 빨강 배경
  }
  if (name.includes("gemini") || name.includes("google")) {
    return { bg: "bg-[#00d4ff]", text: "text-white" }; // Gemini: 네온 블루 배경
  }
  if (name.includes("sora")) {
    return { bg: "bg-[#00bcd4]", text: "text-white" }; // Sora: 소라색 배경
  }
  return { bg: "bg-secondary", text: "text-foreground" }; // 기본 색상
}

interface UserPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  imageUrl?: string | null;
  createdAt: string;
  aiProvider?: string | null;
  aiModel?: string | null;
  user: {
    id?: string;
    name?: string;
    email: string;
    role?: string;
  };
}

interface UserPromptCardProps {
  prompt: UserPrompt;
}

export default function UserPromptCard({ prompt }: UserPromptCardProps) {
  const router = useRouter();
  const provider =
    prompt.aiProvider && isAIProvider(prompt.aiProvider)
      ? prompt.aiProvider
      : null;
  const providerLabel = provider ? AI_PROVIDER_LABELS[provider] : null;

  const openPrompt = () => {
    router.push(`/prompt/${prompt.id}`);
  };

  const openUser = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (prompt.user?.id) {
      router.push(`/users/${prompt.user.id}`);
    }
  };

  return (
    <button
      onClick={openPrompt}
      className="card-aurora group relative overflow-hidden rounded-xl p-6 text-left cursor-pointer w-full"
    >
      {provider && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-1">
          <AIProviderBadge
            provider={provider}
            model={prompt.aiModel || undefined}
            size="sm"
          />
          {providerLabel && (
            <span className="text-[11px] text-muted-foreground dark:text-white/80">
              {providerLabel}
              {prompt.aiModel ? ` · ${prompt.aiModel}` : ""}
            </span>
          )}
        </div>
      )}

      <div className="space-y-4">
        {prompt.user?.id && (
          <span
            onClick={openUser}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground dark:text-white/80 hover:opacity-80 transition-colors"
          >
            <User className="h-3 w-3" />
            {prompt.user.role === "admin" ? "관리자" : (prompt.user.name || prompt.user.email.split("@")[0])}
          </span>
        )}
        <div>
          <h3 className="text-xl font-semibold group-hover:opacity-80 transition-colors line-clamp-1 text-foreground dark:text-white/90">
            {prompt.topic}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {prompt.recommendedTools.slice(0, 3).map((tool, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium"
            >
              <Tag className="h-3 w-3" />
              {tool}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border/50 dark:border-white/10">
          <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-white/80">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-[#FFDAB9] dark:text-[#0096FF] fill-[#FFDAB9] dark:fill-[#0096FF]" />
              <span className="font-medium">0</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>0 uses</span>
            </div>
          </div>

          <div className="flex -space-x-2">
            {prompt.recommendedTools.slice(0, 3).map((tool, index) => {
              const colors = getAIToolBgColor(tool);
              return (
                <div
                  key={index}
                  className={`h-8 w-8 rounded-full border-2 border-background ${colors.bg} flex items-center justify-center text-xs font-semibold ${colors.text}`}
                  title={tool}
                >
                  {tool.charAt(0)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </button>
  );
}
