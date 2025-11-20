/**
 * AI Router - 멀티 AI 시스템의 핵심
 *
 * 각 AI의 강점에 따라 작업을 자동으로 라우팅합니다:
 * - GPT-5: 창의적 콘텐츠 생성, 구조화된 출력
 * - Claude: 긴 문맥 이해, 논리적 분석, 코드 생성
 * - Grok: 실시간 정보, 트렌드 반영
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// AI 제공자 타입
export type AIProvider = "gpt" | "claude" | "grok" | "gemini";

// 작업 타입별 최적 AI 매핑
export const AI_TASK_MAPPING = {
  // GPT-5: 창의적 프롬프트 생성
  PROMPT_GENERATION: "gpt" as AIProvider,
  QUESTION_GENERATION: "gpt" as AIProvider,

  // Claude: 분석 및 개선
  PROMPT_ANALYSIS: "claude" as AIProvider,
  PROMPT_OPTIMIZATION: "claude" as AIProvider,
  CODE_GENERATION: "claude" as AIProvider,
  LEARNING_CONTENT: "claude" as AIProvider,

  // Grok: 트렌드 기반 추천
  TREND_ANALYSIS: "grok" as AIProvider,
  REAL_TIME_SUGGESTIONS: "grok" as AIProvider,
} as const;

// AI 클라이언트 초기화
const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const claudeClient = process.env.CLAUDE_API_KEY
  ? new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    })
  : null;

// Grok 클라이언트 (OpenAI 호환 API 사용)
const grokClient = process.env.GROK_API_KEY
  ? new OpenAI({
      apiKey: process.env.GROK_API_KEY,
      baseURL: "https://api.x.ai/v1",
    })
  : null;

// Gemini 클라이언트 (Google Generative AI 사용)
const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// 통합 메시지 타입
export interface UnifiedMessage {
  role: "system" | "user" | "assistant" | "developer";
  content: string;
}

// 통합 응답 타입
export interface UnifiedResponse {
  content: string;
  provider: AIProvider;
  model: string;
}

/**
 * 메시지를 Claude 형식으로 변환
 */
function convertToClaudeMessages(messages: UnifiedMessage[]) {
  // Claude는 system 메시지를 별도로 처리
  const systemMessage = messages.find((m) => m.role === "system" || m.role === "developer");
  const userMessages = messages.filter((m) => m.role !== "system" && m.role !== "developer");

  return {
    system: systemMessage?.content,
    messages: userMessages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
  };
}

/**
 * GPT-5로 텍스트 생성
 * 
 * GPT-5 설정:
 * - temperature: 항상 1로 고정
 * - max_completion_tokens: GPT-5는 max_tokens 대신 max_completion_tokens 사용
 */
async function generateWithGPT(
  messages: UnifiedMessage[],
  options: {
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number; // 프롬프트 실행 등에서 응답 시간 단축을 위해 사용 (max_completion_tokens로 변환됨)
    model?: string; // 특정 모델 지정 (예: GPT-5 Mini)
  } = {}
): Promise<UnifiedResponse> {
  const model = options.model || process.env.OPENAI_MODEL || "gpt-5.1-2025-11-13";

  console.log("[AI Router] Generating with GPT");
  console.log("[AI Router] Model:", model);
  console.log("[AI Router] Temperature: 1 (fixed)");
  console.log("[AI Router] JSON Mode:", options.jsonMode);
  console.log("[AI Router] Message count:", messages.length);

  // developer role을 system으로 변환 (OpenAI는 developer role 미지원)
  const convertedMessages = messages.map((m) => ({
    role: m.role === "developer" ? "system" : m.role,
    content: m.content,
  }));

    console.log("[AI Router] Calling OpenAI API...");
    console.log("[AI Router] Max tokens:", options.maxTokens || "not set");
    console.log("[AI Router] Total message length:", convertedMessages.reduce((sum, m) => sum + (m.content?.length || 0), 0));

  try {
    // GPT-5 API 파라미터 구성
    // 응답 속도 최적화:
    // - 프롬프트 최적화는 호출 전에 수행
    const apiParams: Parameters<typeof openaiClient.chat.completions.create>[0] = {
      model,
      messages: convertedMessages as any,
      temperature: 1, // GPT-5는 항상 temperature 1로 고정
    };

    // JSON 모드 설정
    if (options.jsonMode) {
      apiParams.response_format = { type: "json_object" };
    }

    console.log("[AI Router] API params:", JSON.stringify({ ...apiParams, response_format: apiParams.response_format ? { type: "json_object" } : undefined }, null, 2));

    const completion = await openaiClient.chat.completions.create(apiParams as any);

    console.log("[AI Router] OpenAI response received");
    console.log("[AI Router] Finish reason:", completion.choices[0]?.finish_reason);
    console.log("[AI Router] Choices count:", completion.choices?.length || 0);
    console.log("[AI Router] Content length:", completion.choices[0]?.message?.content?.length || 0);
    console.log("[AI Router] Usage:", completion.usage ? JSON.stringify(completion.usage) : "N/A");
    
    // 응답 구조 확인
    if (!completion.choices || completion.choices.length === 0) {
      console.error("[AI Router] No choices in response!");
      console.error("[AI Router] Full response:", JSON.stringify(completion, null, 2));
      throw new Error("AI 응답에 choices가 없습니다");
    }

    const content = completion.choices[0]?.message?.content || "";
    
    if (!content || content.trim().length === 0) {
      console.error("[AI Router] Empty content received!");
      console.error("[AI Router] Finish reason:", completion.choices[0]?.finish_reason);
      console.error("[AI Router] Full response:", JSON.stringify(completion, null, 2));
      throw new Error(`AI 응답이 비어있습니다. Finish reason: ${completion.choices[0]?.finish_reason || "unknown"}`);
    }
    
    console.log("[AI Router] Content preview:", content.substring(0, 100));

    return {
      content,
      provider: "gpt",
      model,
    };
  } catch (error) {
    console.error("[AI Router] OpenAI API error:", error);
    if (error instanceof Error) {
      console.error("[AI Router] Error message:", error.message);
    }
    throw error;
  }
}

/**
 * Claude로 텍스트 생성
 *
 * Claude 최적 설정:
 * - max_tokens: 8192 (Claude의 강점인 긴 출력 활용)
 * - temperature: 1.0 (기본, 작업에 따라 조정)
 */
async function generateWithClaude(
  messages: UnifiedMessage[],
  options: {
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number;
  } = {}
): Promise<UnifiedResponse> {
  if (!claudeClient) {
    throw new Error("Claude API key not configured");
  }

  const model = process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929";
  const { system, messages: claudeMessages } = convertToClaudeMessages(messages);

  // Claude 최적 설정
  // 작업 복잡도에 따른 max_tokens 자동 조정
  const maxTokens = options.maxTokens ?? 8192; // Claude의 강력한 긴 출력 능력 활용

  // JSON 모드 처리: Claude는 response_format을 지원하지 않으므로 프롬프트에 지시 추가
  let finalMessages = claudeMessages;
  let finalSystem = system;
  
  if (options.jsonMode) {
    // 시스템 프롬프트에 JSON 형식 지시 추가
    finalSystem = `${finalSystem}\n\nIMPORTANT: You must respond with valid JSON only. Do not wrap the JSON in markdown code blocks. Do not include any explanatory text before or after the JSON. Return only the raw JSON object.`;

    // 마지막 user 메시지에도 JSON 형식 지시 추가 (강조)
    if (finalMessages.length > 0 && finalMessages[finalMessages.length - 1].role === "user") {
      const lastMessage = finalMessages[finalMessages.length - 1];
      finalMessages = [
        ...finalMessages.slice(0, -1),
        {
          ...lastMessage,
          content: `${lastMessage.content}\n\nREMINDER: Respond with valid JSON only. No markdown code blocks, no explanations, just the raw JSON.`,
        },
      ];
    }
  }

  console.log("[AI Router] Calling Claude API...");
  console.log("[AI Router] Model:", model);
  console.log("[AI Router] Max tokens:", maxTokens);
  console.log("[AI Router] Temperature:", options.temperature ?? 1.0);
  console.log("[AI Router] JSON mode:", options.jsonMode || false);

  try {
    const completion = await claudeClient.messages.create({
      model,
      max_tokens: maxTokens,
      temperature: options.temperature ?? 1.0,
      system: finalSystem,
      messages: finalMessages,
    });

    let content = completion.content[0].type === "text"
      ? completion.content[0].text
      : "";

    console.log("[AI Router] Claude response received");
    console.log("[AI Router] Content length:", content.length);

    // JSON 모드일 때 마크다운 코드 블록 제거
    if (options.jsonMode && content) {
      console.log("[AI Router] JSON mode: cleaning response");
      console.log("[AI Router] Original content preview:", content.substring(0, 200));

      const trimmedContent = content.trimStart();
      const looksLikeJson = trimmedContent.startsWith("{") || trimmedContent.startsWith("[");

      if (!looksLikeJson) {
        // 1) ```json ... ``` 블록을 우선 추출
        const explicitJsonBlock = content.match(/```json\s*\n?([\s\S]*?)\n?```/i);
        if (explicitJsonBlock && explicitJsonBlock[1]) {
          content = explicitJsonBlock[1].trim();
          console.log("[AI Router] Extracted explicit ```json``` block");
        } else {
          // 2) fallback: JSON처럼 보이는 코드 블록 중 실제로 파싱 가능한 블록 찾기
          const genericBlocks = content.match(/```\w*\s*\n?([\s\S]*?)\n?```/g);
          if (genericBlocks) {
            for (const block of genericBlocks) {
              const inner = block.replace(/```\w*\s*\n?|```/g, "").trim();
              if (inner.startsWith("{") || inner.startsWith("[")) {
                try {
                  JSON.parse(inner);
                  content = inner;
                  console.log("[AI Router] Extracted parseable JSON from generic code block");
                  break;
                } catch {
                  continue;
                }
              }
            }
          }
        }
      } else {
        content = trimmedContent;
      }

      // 앞뒤 공백 제거
      content = content.trim();

      console.log("[AI Router] Cleaned content preview:", content.substring(0, 200));
    }

    return {
      content,
      provider: "claude",
      model,
    };
  } catch (error) {
    console.error("[AI Router] Claude API error:", error);
    if (error instanceof Error) {
      console.error("[AI Router] Error message:", error.message);
    }
    throw error;
  }
}

/**
 * Grok으로 텍스트 생성
 */
async function generateWithGrok(
  messages: UnifiedMessage[],
  options: {
    temperature?: number;
    jsonMode?: boolean;
  } = {}
): Promise<UnifiedResponse> {
  if (!grokClient) {
    throw new Error("Grok API key not configured");
  }

  const model = process.env.GROK_MODEL || "grok-3";

  console.log("[AI Router] Generating with Grok");
  console.log("[AI Router] Model:", model);
  console.log("[AI Router] Temperature:", options.temperature ?? 1);
  console.log("[AI Router] JSON Mode:", options.jsonMode || false);

  // developer role을 system으로 변환
  const convertedMessages = messages.map((m) => ({
    role: m.role === "developer" ? "system" : m.role,
    content: m.content,
  }));

  try {
    const completion = await grokClient.chat.completions.create({
      model,
      messages: convertedMessages as any,
      temperature: options.temperature ?? 1,
      ...(options.jsonMode && { response_format: { type: "json_object" } }),
    });

    const content = completion.choices[0]?.message?.content || "";

    console.log("[AI Router] Grok response received");
    console.log("[AI Router] Content length:", content.length);

    if (!content) {
      console.warn("[AI Router] Empty content from Grok");
    }

    return {
      content,
      provider: "grok",
      model,
    };
  } catch (error) {
    console.error("[AI Router] Grok API error:", error);
    if (error instanceof Error) {
      console.error("[AI Router] Error message:", error.message);
    }
    throw error;
  }
}

/**
 * Gemini로 텍스트 생성
 */
async function generateWithGemini(
  messages: UnifiedMessage[],
  options: {
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number;
  } = {}
): Promise<UnifiedResponse> {
  if (!geminiClient) {
    throw new Error("Gemini API key not configured");
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
  const model = geminiClient.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: options.temperature ?? 1.0,
      maxOutputTokens: options.maxTokens ?? 8192,
      ...(options.jsonMode && { responseMimeType: "application/json" }),
    },
  });

  console.log("[AI Router] Generating with Gemini");
  console.log("[AI Router] Model:", modelName);
  console.log("[AI Router] Temperature:", options.temperature ?? 1.0);
  console.log("[AI Router] Max tokens:", options.maxTokens ?? 8192);
  console.log("[AI Router] JSON Mode:", options.jsonMode || false);

  try {
    // Gemini 메시지 형식으로 변환
    // system 메시지는 systemInstruction으로, 나머지는 contents로
    const systemMessage = messages.find((m) => m.role === "system" || m.role === "developer");
    const conversationMessages = messages.filter((m) => m.role !== "system" && m.role !== "developer");

    // Gemini 형식으로 메시지 변환
    const contents = conversationMessages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    // 시스템 메시지가 있으면 모델 재생성 (systemInstruction 포함)
    let finalModel = model;
    if (systemMessage) {
      finalModel = geminiClient.getGenerativeModel({
        model: modelName,
        systemInstruction: systemMessage.content,
        generationConfig: {
          temperature: options.temperature ?? 1.0,
          maxOutputTokens: options.maxTokens ?? 8192,
          ...(options.jsonMode && { responseMimeType: "application/json" }),
        },
      });
    }

    const result = await finalModel.generateContent({
      contents,
    });

    const response = result.response;
    const content = response.text();

    console.log("[AI Router] Gemini response received");
    console.log("[AI Router] Content length:", content.length);

    if (!content) {
      console.warn("[AI Router] Empty content from Gemini");
    }

    return {
      content,
      provider: "gemini",
      model: modelName,
    };
  } catch (error) {
    console.error("[AI Router] Gemini API error:", error);
    if (error instanceof Error) {
      console.error("[AI Router] Error message:", error.message);
    }
    throw error;
  }
}

/**
 * 통합 AI 생성 함수
 *
 * @param provider - 사용할 AI 제공자 (gpt, claude, grok)
 * @param messages - 메시지 배열
 * @param options - 생성 옵션
 * @returns 생성된 텍스트와 메타데이터
 */
export async function generateWithAI(
  provider: AIProvider,
  messages: UnifiedMessage[],
  options: {
    temperature?: number;
    jsonMode?: boolean;
    maxTokens?: number; // 프롬프트 실행 등에서 응답 시간 단축을 위해 사용
    model?: string; // 특정 모델 지정 (예: GPT-5 Mini)
  } = {}
): Promise<UnifiedResponse> {
  switch (provider) {
    case "gpt":
      return generateWithGPT(messages, options);

    case "claude":
      // Claude가 없으면 GPT로 폴백
      if (!claudeClient) {
        console.warn("Claude API not configured, falling back to GPT");
        return generateWithGPT(messages, options);
      }
      return generateWithClaude(messages, options);

    case "grok":
      // Grok이 없으면 GPT로 폴백
      if (!grokClient) {
        console.warn("Grok API not configured, falling back to GPT");
        return generateWithGPT(messages, options);
      }
      return generateWithGrok(messages, options);

    case "gemini":
      // Gemini가 없으면 GPT로 폴백
      if (!geminiClient) {
        console.warn("Gemini API not configured, falling back to GPT");
        return generateWithGPT(messages, options);
      }
      return generateWithGemini(messages, options);

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * 작업 타입에 따라 최적의 AI를 자동 선택하여 생성
 */
export async function generateForTask(
  taskType: keyof typeof AI_TASK_MAPPING,
  messages: UnifiedMessage[],
  options: {
    temperature?: number;
    jsonMode?: boolean;
    model?: string; // 특정 모델 지정 (예: GPT-5 Mini)
  } = {}
): Promise<UnifiedResponse> {
  const provider = AI_TASK_MAPPING[taskType];
  return generateWithAI(provider, messages, options);
}

/**
 * 여러 AI를 병렬로 실행하고 결과 비교
 *
 * 사용 예: 중요한 프롬프트 생성 시 GPT와 Claude 둘 다 실행하여
 * 더 나은 결과 선택 또는 두 결과 조합
 */
export async function generateWithMultipleAIs(
  providers: AIProvider[],
  messages: UnifiedMessage[],
  options: {
    temperature?: number;
    jsonMode?: boolean;
  } = {}
): Promise<UnifiedResponse[]> {
  const promises = providers.map((provider) =>
    generateWithAI(provider, messages, options).catch((error) => ({
      content: "",
      provider,
      model: "error",
      error: error.message,
    }))
  );

  return Promise.all(promises) as Promise<UnifiedResponse[]>;
}
