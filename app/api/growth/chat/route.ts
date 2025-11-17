import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { messages, curriculum } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    // Build system message with curriculum context
    const systemMessage = `당신은 친절하고 전문적인 AI 학습 튜터입니다. 학습자가 오늘 배우는 내용을 잘 이해하도록 돕는 것이 목표입니다.

오늘의 학습 주제: ${curriculum?.title || ""}
학습 내용: ${curriculum?.description || ""}

역할:
- 학습자의 질문에 명확하고 이해하기 쉽게 답변합니다
- 필요시 간단한 예시를 들어 설명합니다
- 학습자가 스스로 생각할 수 있도록 힌트를 제공합니다
- 긍정적이고 격려하는 태도를 유지합니다
- 한국어로 답변합니다

**중요한 제약사항**:
1. **간결성**: 답변은 2-4문장으로 제한합니다
2. **질문 제한**: 답변 끝에 질문을 하나만 합니다. 여러 질문을 한 번에 하지 않습니다
3. **핵심만**: 핵심 내용만 간단명료하게 전달합니다
4. **짧은 예시**: 예시가 필요하면 1-2줄로 간단하게

답변 형식:
- 핵심 답변 (2-3문장)
- [필요시] 간단한 예시 (1문장)
- [선택] 추가로 궁금한 점이 있는지 물어보기 (1문장, 하나의 질문만)`;

    // 학습 채팅: GPT가 적합 (빠른 응답, 자연스러운 대화)
    const chatMessages: UnifiedMessage[] = [
      {
        role: "system",
        content: systemMessage,
      },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    let response;
    try {
      response = await generateWithAI("gpt", chatMessages, {
        temperature: 1, // GPT-5는 항상 1로 고정 (자연스러운 대화)
      });
    } catch (error) {
      console.error("[Learning Chat] GPT error:", error instanceof Error ? error.message : String(error));
      throw error;
    }

    // 응답 검증
    if (!response || !response.content) {
      console.error("[Learning Chat] Empty response from AI");
      throw new Error("AI 응답이 비어있습니다");
    }

    const assistantMessage = response.content;

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("[Learning Chat] Error:", error);
    if (error instanceof Error) {
      console.error("[Learning Chat] Error message:", error.message);
      console.error("[Learning Chat] Error stack:", error.stack);
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
