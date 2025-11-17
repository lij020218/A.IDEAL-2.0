export interface AITool {
  id: string;
  name: string;
  description: string;
  url: string;
  category: AIToolCategory;
  logo?: string;
  isPremium?: boolean;
}

export type AIToolCategory =
  | "text-generation"
  | "image-generation"
  | "code-assistant"
  | "data-analysis"
  | "audio-generation"
  | "video-generation"
  | "general";

export type PromptCategory =
  | "writing"
  | "coding"
  | "marketing"
  | "design"
  | "business"
  | "education"
  | "productivity"
  | "creative"
  | "analysis";

export type AIProvider = "gpt" | "claude" | "grok" | "midjourney" | "gemini" | "sora";

export interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  category: PromptCategory;
  tags: string[];
  recommendedTools: AITool[];
  author?: string;
  rating?: number;
  usageCount?: number;
  createdAt: Date;
  updatedAt: Date;
  isFeatured?: boolean;
}

export interface PromptWithTools extends Prompt {
  tools: AITool[];
}

// Prompt Generation Types
export interface PromptGenerationRequest {
  topic: string;
  answers: Record<string, string>;
}

export interface GeneratedQuestion {
  id: string;
  question: string;
  placeholder?: string;
  type?: "text" | "textarea" | "select";
  options?: string[];
}

export interface GeneratedPrompt {
  prompt: string;
  recommendedTools: string[];
  tips?: string[];
  aiProvider?: AIProvider;
  aiModel?: string;
}
