"use client";

import { Prompt } from "@/types";
import { Star, TrendingUp, Tag } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import Link from "next/link";

interface PromptCardProps {
  prompt: Prompt;
}

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

export default function PromptCard({ prompt }: PromptCardProps) {
  return (
    <Link href={`/prompts/${prompt.id}`}>
      <div className="card-aurora group relative overflow-hidden rounded-xl p-6 cursor-pointer">
        {prompt.isFeatured && (
          <div className="absolute top-4 right-4">
            <span className="inline-flex items-center rounded-full bg-background/80 dark:bg-white/10 dark:backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-foreground border border-border dark:border-white/20 shadow-sm">Featured</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <h3 className="text-xl font-semibold group-hover:opacity-80 transition-colors line-clamp-1 text-foreground dark:text-white/90">
              {prompt.title}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {prompt.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium"
              >
                <Tag className="h-3 w-3" />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border/50 dark:border-white/10">
            <div className="flex items-center gap-4 text-sm text-muted-foreground dark:text-white/80">
              {prompt.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-[#FFDAB9] dark:text-[#0096FF] fill-[#FFDAB9] dark:fill-[#0096FF]" />
                  <span className="font-medium">{prompt.rating}</span>
                </div>
              )}
              {prompt.usageCount && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>{formatNumber(prompt.usageCount)} uses</span>
                </div>
              )}
            </div>

            <div className="flex -space-x-2">
              {prompt.recommendedTools.slice(0, 3).map((tool) => {
                const colors = getAIToolBgColor(tool.name);
                return (
                  <div
                    key={tool.id}
                    className={`h-8 w-8 rounded-full border-2 border-background ${colors.bg} flex items-center justify-center text-xs font-semibold ${colors.text}`}
                    title={tool.name}
                  >
                    {tool.name.charAt(0)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
