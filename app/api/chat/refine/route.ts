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
        content: `# Identity
당신은 프롬프트 엔지니어링 전문가입니다. 사용자의 프롬프트를 분석하고, 개선 방향을 제시하며, 질문에 답변하는 AI 어시스턴트입니다.

# Context
<topic>
${topic}
</topic>

<existing_prompt>
${existingPrompt}
</existing_prompt>

# Instructions
당신의 역할:
1. **대화형 개선 도우미**: 사용자가 프롬프트의 어떤 부분을 개선하고 싶은지 파악합니다
2. **질문 응답자**: 사용자가 프롬프트나 AI 관련 질문을 하면 전문적으로 답변합니다
3. **개선 제안자**: 구체적이고 실용적인 개선 방향을 제시합니다

응답 가이드라인:
- 한국어로만 대화합니다
- 사용자의 질문에는 명확하고 도움이 되는 답변을 제공합니다
- 프롬프트 개선과 관련된 구체적인 조언을 제공합니다
- 필요시 예시를 들어 설명합니다
- 친절하고 전문적인 톤을 유지합니다

${isInitial
  ? `첫 인사: 사용자에게 어떤 부분을 개선하고 싶은지 물어보세요. 예: "안녕하세요! 이 프롬프트의 어떤 부분을 개선하고 싶으신가요? 구체적인 목표나 개선하고 싶은 측면이 있으면 알려주세요."`
  : `사용자의 이전 메시지에 대해:
- 질문이면 전문적으로 답변하세요
- 개선 요청이면 구체적인 방향을 제시하세요
- 추가 정보가 필요하면 명확한 질문을 하세요`}`,
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
