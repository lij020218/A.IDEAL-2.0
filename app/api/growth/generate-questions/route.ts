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
    const { topic } = body;

    if (!topic) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Generate 3-5 questions about the topic
    const prompt = `사용자가 "${topic}"에 대해 학습하고자 합니다.

학습자를 더 잘 이해하고 맞춤형 커리큘럼을 설계하기 위해, 다음과 같은 정보를 파악할 수 있는 질문 3~5개를 생성해주세요:

1. 학습 동기와 목적
2. 현재 보유한 관련 지식이나 경험
3. 학습 스타일 선호도
4. 시간 투자 가능 여부
5. 구체적으로 관심 있는 세부 분야

질문은 자연스럽고 친근한 톤으로 작성하되, 답변을 통해 커리큘럼을 설계하는데 실질적으로 도움이 되어야 합니다.

JSON 형식으로 응답해주세요:
{
  "questions": [
    {
      "question": "질문 내용",
      "context": "질문에 대한 간단한 설명 (선택사항)"
    }
  ]
}`;

    // 질문 생성: GPT가 적합 (창의적 질문, 다양성)
    const messages: UnifiedMessage[] = [
      {
        role: "system",
        content:
          "당신은 교육 전문가입니다. 학습자를 이해하고 맞춤형 커리큘럼을 설계하기 위한 효과적인 질문을 만듭니다.",
      },
      {
        role: "user",
        content: prompt,
      },
    ];

    let response;
    try {
      response = await generateWithAI("gpt", messages, {
        temperature: 1, // GPT-5는 항상 1로 고정 (창의적 질문에 적합)
        jsonMode: true,
      });
    } catch (error) {
      console.error("[Generate Questions] GPT error:", error instanceof Error ? error.message : String(error));
      throw error;
    }

    // 응답 검증
    if (!response || !response.content || response.content.trim().length === 0) {
      console.error("[Generate Questions] Empty response from AI");
      throw new Error("AI 응답이 비어있습니다");
    }

    // JSON 파싱
    let contentToParse = response.content.trim();
    if (contentToParse.includes("```json")) {
      const jsonMatch = contentToParse.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) contentToParse = jsonMatch[1].trim();
    }

    const jsonStart = contentToParse.indexOf("{");
    const jsonEnd = contentToParse.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      contentToParse = contentToParse.substring(jsonStart, jsonEnd + 1);
    }

    let data;
    try {
      data = JSON.parse(contentToParse);
    } catch (parseError) {
      console.error("[Generate Questions] JSON parse error:", parseError);
      throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }

    return NextResponse.json({
      questions: data.questions || [],
    });
  } catch (error) {
    console.error("[Generate Questions] Error:", error);
    if (error instanceof Error) {
      console.error("[Generate Questions] Error message:", error.message);
      console.error("[Generate Questions] Error stack:", error.stack);
      return NextResponse.json(
        { 
          error: "Failed to generate questions",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: "Failed to generate questions",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
