import { NextRequest, NextResponse } from "next/server";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";
import { getServiceTaskSettings } from "@/lib/ai-config";
import { GeneratedPrompt } from "@/types";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { existingPrompt, topic, conversation } = await req.json();

    if (!existingPrompt || !topic || !conversation) {
      return NextResponse.json(
        { error: "Existing prompt, topic, and conversation are required" },
        { status: 400 }
      );
    }

    // Format the conversation for context
    const conversationContext = conversation
      .map((msg: Message) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
      .join("\n\n");

    // 최적의 AI 설정 가져오기 (프롬프트 개선은 GPT-5가 최적)
    const { provider, settings } = getServiceTaskSettings("REFINE_PROMPT");
    
    console.log("[Refine Prompt] Using AI provider:", provider);
    console.log("[Refine Prompt] Temperature:", settings.temperature);

    // 메시지 구성
    const messages: UnifiedMessage[] = [
      {
        role: "system",
        content: `You are an expert AI prompt engineer who REFINES and IMPROVES existing AI prompts based on conversational feedback.

Your task is to:
1. Analyze the existing prompt and the conversation between the user and AI
2. Create an IMPROVED version of the prompt that:
   - Incorporates all the requirements and improvements discussed in the conversation
   - Maintains the core purpose of the original prompt
   - Adds more detail, clarity, or structure based on the conversation
   - Addresses any gaps or limitations mentioned
   - Keeps what works well in the original prompt

3. Recommend the most suitable AI tools for this refined prompt
4. Provide 3-5 practical tips for using the refined prompt effectively

Return ONLY a valid JSON object in this exact format:
{
  "prompt": "The improved AI prompt text here...",
  "recommendedTools": ["tool-id-1", "tool-id-2"],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Available tool IDs: chatgpt, claude, gemini, midjourney, dall-e, github-copilot, perplexity, stable-diffusion, eleven-labs, runway

Do not include any markdown formatting, code blocks, or explanations. Return only the raw JSON object.`,
      },
      {
        role: "user",
        content: `User's goal: "${topic}"

EXISTING PROMPT:
${existingPrompt}

CONVERSATION ABOUT IMPROVEMENTS:
${conversationContext}

Generate an improved version of the prompt that incorporates all the improvements discussed in the conversation.`,
      },
    ];

    // 최적의 AI로 생성 (GPT-5가 프롬프트 개선에 최적)
    const response = await generateWithAI(provider, messages, {
      temperature: settings.temperature, // GPT-5는 항상 1로 고정되지만 설정값 전달
      jsonMode: true, // JSON 형식 응답 필요
      maxTokens: settings.maxTokens,
    });

    console.log("[Refine Prompt] Response received, length:", response.content?.length || 0);

    const content = response.content;
    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse the JSON response
    let result: GeneratedPrompt;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid response format from AI");
    }

    return NextResponse.json({
      ...result,
      aiProvider: response.provider,
      aiModel: response.model,
    });
  } catch (error) {
    console.error("[Refine Prompt] Error:", error);
    if (error instanceof Error) {
      console.error("[Refine Prompt] Error message:", error.message);
      console.error("[Refine Prompt] Error stack:", error.stack);
      return NextResponse.json(
        { 
          error: "Failed to refine prompt",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: "Failed to refine prompt",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
