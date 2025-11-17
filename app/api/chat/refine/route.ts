import { NextRequest, NextResponse } from "next/server";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";
import { getServiceTaskSettings } from "@/lib/ai-config";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { existingPrompt, topic, messages, isInitial } = await req.json();

    if (!existingPrompt || !topic) {
      return NextResponse.json(
        { error: "Existing prompt and topic are required" },
        { status: 400 }
      );
    }

    // 최적의 AI 설정 가져오기 (프롬프트 개선 채팅은 GPT-5가 최적)
    const { provider, settings } = getServiceTaskSettings("CHAT_REFINE");
    
    console.log("[Chat Refine] Using AI provider:", provider);
    console.log("[Chat Refine] Temperature:", settings.temperature);

    // 메시지 구성
    const conversationMessages: UnifiedMessage[] = [
      {
        role: "system",
        content: `당신은 프롬프트 개선을 돕는 AI입니다.

기존 프롬프트 ("${topic}"):
${existingPrompt}

규칙:
- 무조건 한국어만 사용
- 답변은 1문장만 (최대 30자)
- 질문 1개만
- 짧고 직접적으로

${isInitial ? '첫 질문: "어떤 부분을 개선하고 싶으세요?" (정확히 이 문장만)' : '이전 답변 기반으로 구체적인 질문 1개만'}`,
      },
    ];

    // Add conversation history
    messages.forEach((msg: Message) => {
      conversationMessages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // 최적의 AI로 생성 (GPT-5가 일반 대화에 최적)
    const response = await generateWithAI(provider, conversationMessages, {
      temperature: settings.temperature, // GPT-5는 항상 1로 고정되지만 설정값 전달
      maxTokens: settings.maxTokens,
    });

    console.log("[Chat Refine] Response received, length:", response.content?.length || 0);

    const responseMessage = response.content;
    if (!responseMessage) {
      throw new Error("No response from AI");
    }

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error("[Chat Refine] Error:", error);
    if (error instanceof Error) {
      console.error("[Chat Refine] Error message:", error.message);
      console.error("[Chat Refine] Error stack:", error.stack);
      return NextResponse.json(
        { 
          error: "Failed to process chat message",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: "Failed to process chat message",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
