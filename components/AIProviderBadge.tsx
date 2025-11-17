"use client";

import { Sparkles, Brain, Zap } from "lucide-react";
import type { AIProvider } from "@/types";

interface AIProviderBadgeProps {
  provider: AIProvider;
  model?: string | null;
  size?: "sm" | "md" | "lg";
  showModel?: boolean;
}

const PROVIDER_CONFIG: Record<
  AIProvider,
  {
    name: string;
    icon: typeof Sparkles;
    iconColor: string;
    description: string;
  }
> = {
  gpt: {
    name: "GPT-5.1",
    icon: Sparkles,
    iconColor: "ai-icon-gpt",
    description: "창의적인 생성에 특화",
  },
  claude: {
    name: "Claude",
    icon: Brain,
    iconColor: "ai-icon-claude",
    description: "논리적 분석과 문맥 이해",
  },
  grok: {
    name: "Grok",
    icon: Zap,
    iconColor: "ai-icon-grok",
    description: "실시간 정보·트렌드에 특화",
  },
  midjourney: {
    name: "Midjourney",
    icon: Sparkles,
    iconColor: "ai-icon-midjourney",
    description: "이미지 생성에 특화",
  },
  gemini: {
    name: "Gemini",
    icon: Brain,
    iconColor: "ai-icon-gemini",
    description: "Google의 AI 모델",
  },
  sora: {
    name: "Sora",
    icon: Zap,
    iconColor: "ai-icon-sora",
    description: "비디오 생성에 특화",
  },
};

export const AI_PROVIDER_LABELS: Record<AIProvider, string> = {
  gpt: PROVIDER_CONFIG.gpt.name,
  claude: PROVIDER_CONFIG.claude.name,
  grok: PROVIDER_CONFIG.grok.name,
  midjourney: PROVIDER_CONFIG.midjourney.name,
  gemini: PROVIDER_CONFIG.gemini.name,
  sora: PROVIDER_CONFIG.sora.name,
};

export function AIProviderBadge({
  provider,
  model,
  size = "md",
  showModel = false,
}: AIProviderBadgeProps) {
  const config = PROVIDER_CONFIG[provider];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  } as const;

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  } as const;

  return (
    <div className="inline-flex items-center gap-1.5">
      <div
        className={`
          inline-flex items-center gap-1.5 rounded-full
          bg-white border border-border
          dark:bg-white/[0.08] dark:border-white/20
          ${sizeClasses[size]}
          font-medium shadow-sm
          transition-all duration-200 hover:shadow-md
        `}
        title={`${config.name}${model ? ` (${model})` : ""} - ${config.description}`}
      >
        <Icon size={iconSizes[size]} className={config.iconColor} />
        <span className="text-foreground dark:text-white">{config.name}</span>
      </div>
      {showModel && model && (
        <span className="text-xs text-muted-foreground dark:text-white/70">{model}</span>
      )}
    </div>
  );
}

export function AIProviderInfo({ provider }: { provider: AIProvider }) {
  const info = {
    gpt: {
      name: "GPT-5.1",
      description: "OpenAI의 최신 모델로 창의적인 콘텐츠 제작과 프롬프트 생성에 최적화되어 있습니다.",
      strengths: ["창의적 글쓰기", "프롬프트 생성", "질문 생성"],
    },
    claude: {
      name: "Claude Sonnet 4.5",
      description: "Anthropic의 고급 모델로 논리적 분석과 문맥 이해가 강점입니다.",
      strengths: ["프롬프트 분석", "코드 생성", "학습 콘텐츠"],
    },
    grok: {
      name: "Grok",
      description: "xAI의 모델로 최신 트렌드와 실시간 정보에 특화되어 있습니다.",
      strengths: ["트렌드 분석", "실시간 정보", "최신 도구 추천"],
    },
    midjourney: {
      name: "Midjourney",
      description: "고품질 이미지 생성에 특화된 AI 모델입니다.",
      strengths: ["이미지 생성", "아트워크", "비주얼 디자인"],
    },
    gemini: {
      name: "Gemini",
      description: "Google의 고급 AI 모델로 다양한 작업에 활용됩니다.",
      strengths: ["다중 모달", "이미지 분석", "텍스트 생성"],
    },
    sora: {
      name: "Sora",
      description: "OpenAI의 비디오 생성 AI 모델입니다.",
      strengths: ["비디오 생성", "동영상 편집", "시각적 스토리텔링"],
    },
  };

  const data = info[provider];

  return (
    <div className="p-4 bg-muted/50 dark:bg-white/[0.05] rounded-lg space-y-2 border border-border dark:border-white/10">
      <div className="flex items-center gap-2">
        <AIProviderBadge provider={provider} size="sm" />
        <h4 className="font-semibold text-sm">{data.name}</h4>
      </div>
      <p className="text-sm text-muted-foreground dark:text-white/70">{data.description}</p>
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground dark:text-white/60">강점:</p>
        <div className="flex flex-wrap gap-1">
          {data.strengths.map((strength) => (
            <span
              key={strength}
              className="px-2 py-0.5 text-xs bg-background dark:bg-white/[0.08] rounded-full border dark:border-white/15"
            >
              {strength}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function isAIProvider(value: unknown): value is AIProvider {
  return value === "gpt" || value === "claude" || value === "grok" || value === "midjourney" || value === "gemini" || value === "sora";
}
