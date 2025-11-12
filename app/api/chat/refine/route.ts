import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";

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

    // Build conversation history for OpenAI
    const conversationMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
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

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: conversationMessages,
      temperature: 1,
    });

    const responseMessage = completion.choices[0].message.content;
    if (!responseMessage) {
      throw new Error("No response from OpenAI");
    }

    return NextResponse.json({ message: responseMessage });
  } catch (error) {
    console.error("Error in chat refine:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
