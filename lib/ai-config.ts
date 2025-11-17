/**
 * AI별 최적 설정
 *
 * 각 AI와 작업 유형에 따른 최적의 temperature와 max_tokens 설정
 */

export interface AISettings {
  temperature: number;
  maxTokens: number;
}

/**
 * Claude 작업별 최적 설정
 */
export const CLAUDE_SETTINGS = {
  // 창의적 작업 (높은 temperature)
  creative_writing: {
    temperature: 1.0,
    maxTokens: 8192, // 긴 창의적 콘텐츠
  },
  storytelling: {
    temperature: 0.9,
    maxTokens: 8192,
  },
  brainstorming: {
    temperature: 0.95,
    maxTokens: 4096,
  },

  // 분석 작업 (중간 temperature)
  prompt_analysis: {
    temperature: 0.7,
    maxTokens: 6144, // 상세한 분석
  },
  content_analysis: {
    temperature: 0.6,
    maxTokens: 6144,
  },
  learning_content: {
    temperature: 0.8,
    maxTokens: 8192, // 긴 학습 자료
  },

  // 코드 생성 (낮은 temperature)
  code_generation: {
    temperature: 0.3,
    maxTokens: 8192, // 긴 코드
  },
  code_review: {
    temperature: 0.4,
    maxTokens: 6144,
  },

  // 구조화된 출력 (낮은 temperature)
  json_output: {
    temperature: 0.5,
    maxTokens: 4096,
  },
  data_extraction: {
    temperature: 0.2,
    maxTokens: 4096,
  },

  // 기본값
  default: {
    temperature: 1.0,
    maxTokens: 8192,
  },
} as const;

/**
 * GPT-5 작업별 최적 설정
 */
export const GPT_SETTINGS = {
  // 창의적 작업
  creative_writing: {
    temperature: 1.0,
    maxTokens: 4096,
  },
  prompt_generation: {
    temperature: 1.0,
    maxTokens: 4096,
  },
  question_generation: {
    temperature: 1.0,
    maxTokens: 2048,
  },

  // 균형잡힌 작업
  content_generation: {
    temperature: 0.7,
    maxTokens: 4096,
  },
  summarization: {
    temperature: 0.5,
    maxTokens: 2048,
  },

  // 정확성 중요
  classification: {
    temperature: 0.0,
    maxTokens: 1024,
  },
  json_output: {
    temperature: 0.5,
    maxTokens: 4096,
  },

  // 기본값
  default: {
    temperature: 1.0,
    maxTokens: 4096,
  },
} as const;

/**
 * Grok 작업별 최적 설정
 */
export const GROK_SETTINGS = {
  // 실시간 정보
  trend_analysis: {
    temperature: 0.8,
    maxTokens: 3072,
  },
  real_time_info: {
    temperature: 0.7,
    maxTokens: 3072,
  },

  // 소셜 콘텐츠
  social_media: {
    temperature: 0.9,
    maxTokens: 2048,
  },

  // 기본값
  default: {
    temperature: 0.8,
    maxTokens: 3072,
  },
} as const;

/**
 * 작업 유형과 AI에 따른 최적 설정 가져오기
 */
export function getOptimalSettings(
  provider: "gpt" | "claude" | "grok",
  taskType?: string
): AISettings {
  const settings = {
    gpt: GPT_SETTINGS,
    claude: CLAUDE_SETTINGS,
    grok: GROK_SETTINGS,
  }[provider];

  if (!taskType) {
    return settings.default;
  }

  return (settings as any)[taskType] || settings.default;
}

/**
 * 우리 서비스의 주요 작업 매핑
 */
export const SERVICE_TASK_MAPPING = {
  // 프롬프트 생성 페이지
  GENERATE_QUESTIONS: {
    provider: "gpt" as const,
    taskType: "question_generation",
  },
  GENERATE_PROMPT: {
    provider: "gpt" as const,
    taskType: "prompt_generation",
  },
  ANALYZE_PROMPT: {
    provider: "claude" as const,
    taskType: "prompt_analysis",
  },
  REFINE_PROMPT: {
    provider: "gpt" as const,
    taskType: "prompt_generation", // 프롬프트 개선은 창의적 작업
  },
  CHAT_REFINE: {
    provider: "gpt" as const,
    taskType: "content_generation", // 프롬프트 개선 채팅은 일반 대화
  },

  // 성장하기 페이지
  GENERATE_CURRICULUM: {
    provider: "claude" as const,
    taskType: "learning_content",
  },
  GENERATE_LEARNING_CONTENT: {
    provider: "claude" as const,
    taskType: "learning_content",
  },
  ANALYZE_PROGRESS: {
    provider: "claude" as const,
    taskType: "content_analysis",
  },

  // 도전자 페이지
  CHAT_GENERAL: {
    provider: "gpt" as const,
    taskType: "content_generation",
  },
  LEARNING_CHAT: {
    provider: "gpt" as const,
    taskType: "content_generation", // 학습 채팅은 일반 대화
  },
  CODE_REVIEW: {
    provider: "claude" as const,
    taskType: "code_review",
  },
  CODE_GENERATION: {
    provider: "claude" as const,
    taskType: "code_generation",
  },

  // 트렌드 분석
  TREND_ANALYSIS: {
    provider: "grok" as const,
    taskType: "trend_analysis",
  },
  LATEST_TOOLS: {
    provider: "grok" as const,
    taskType: "real_time_info",
  },
} as const;

/**
 * 서비스 작업에 최적화된 설정 가져오기
 */
export function getServiceTaskSettings(
  taskName: keyof typeof SERVICE_TASK_MAPPING
): {
  provider: "gpt" | "claude" | "grok";
  settings: AISettings;
} {
  const task = SERVICE_TASK_MAPPING[taskName];
  const settings = getOptimalSettings(task.provider, task.taskType);

  return {
    provider: task.provider,
    settings,
  };
}
