import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";
import { aiLimiter } from "@/lib/rate-limiter";

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929";

interface Quiz {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

function normalizeJsonPayload(raw: string) {
  if (!raw) return raw;

  const trimmed = raw.trim();
  let jsonCandidate = trimmed;

  // Extract from code blocks
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/gi;
  const blockMatch = jsonBlockRegex.exec(trimmed);
  if (blockMatch && blockMatch[1]) {
    jsonCandidate = blockMatch[1].trim();
  } else if (trimmed.startsWith("```")) {
    const genericMatch = trimmed.match(/```\w*\s*([\s\S]*?)```/);
    if (genericMatch && genericMatch[1]) {
      jsonCandidate = genericMatch[1].trim();
    }
  }

  // Find JSON bounds
  const firstBrace = jsonCandidate.indexOf("{");
  const lastBrace = jsonCandidate.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonCandidate = jsonCandidate.substring(firstBrace, lastBrace + 1);
  }

  return jsonCandidate;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Rate limiting
    const rateLimitResult = await aiLimiter.check(`ai:${user.id}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const { topicId, dayNumber, existingQuizCount, additionalCount } = await req.json();

    if (!topicId || !dayNumber || !additionalCount) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다" },
        { status: 400 }
      );
    }

    // Fetch topic and curriculum
    const topic = await prisma.growthTopic.findFirst({
      where: { id: topicId, userId: user.id },
    });

    if (!topic) {
      return NextResponse.json({ error: "학습 주제를 찾을 수 없습니다" }, { status: 404 });
    }

    const curriculum = await prisma.curriculum.findFirst({
      where: { topicId, dayNumber },
    });

    if (!curriculum) {
      return NextResponse.json({ error: "해당 일차 커리큘럼이 없습니다" }, { status: 404 });
    }

    const targetCount = Math.min(additionalCount, 12 - (existingQuizCount || 0));

    if (targetCount <= 0) {
      return NextResponse.json({ error: "더 이상 퀴즈를 추가할 수 없습니다" }, { status: 400 });
    }

    // Build quiz generation prompt
    const systemPrompt = `너는 교육 콘텐츠 전문가이다. 학습 주제에 맞는 4지선다 퀴즈를 생성한다.

## 퀴즈 생성 규칙
- 각 문제는 학습 내용을 정확히 이해했는지 테스트
- 선택지는 서로 명확히 구분되어야 함
- 오답도 학습에 도움이 되도록 구성
- 설명은 정답 이유와 오답 이유를 간결히 포함

## [절대 필수] 개수 규칙
- 요청받은 개수를 **정확히** 생성해야 합니다
- 더 적거나 더 많이 생성하면 실패로 간주됩니다

## JSON 형식으로만 응답
반드시 아래 형식의 JSON 객체만 반환:
{
  "quiz": [
    {
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": 0,
      "explanation": "정답 및 오답 설명"
    }
  ]
}`;

    const userPrompt = `다음 학습 주제에 대해 **정확히 ${targetCount}개**의 추가 퀴즈를 생성해주세요.

⚠️ 중요: 반드시 ${targetCount}개를 생성하세요. ${targetCount - 1}개나 ${targetCount + 1}개가 아닌 정확히 ${targetCount}개입니다.

학습 주제: ${topic.title}
목표: ${topic.goal}
수준: ${topic.level === "beginner" ? "초급" : topic.level === "intermediate" ? "중급" : "고급"}

오늘의 학습 (Day ${dayNumber})
- 제목: ${curriculum.title}
- 설명: ${curriculum.description}

기존에 ${existingQuizCount || 0}개의 퀴즈가 있으므로, 중복되지 않는 새로운 관점의 문제를 만들어주세요.
난이도는 초·중·고급을 적절히 섞어주세요.

반드시 JSON 객체만 반환하세요. 코드 블록이나 설명을 추가하지 마세요.
다시 한번 확인: quiz 배열에 정확히 ${targetCount}개의 문제가 있어야 합니다.`;

    const messages: UnifiedMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    // Try GPT first (faster for simple tasks)
    let response;
    let provider = "GPT";
    let model = process.env.OPENAI_MODEL || "gpt-5.1-2025-11-13";

    try {
      response = await generateWithAI("gpt", messages, {
        temperature: 0.8,
        jsonMode: true,
        maxTokens: 2000,
      });
    } catch (gptError) {
      console.warn("[Generate Quiz] GPT failed, trying Claude:", gptError);
      // Fallback to Claude
      response = await generateWithAI("claude", messages, {
        temperature: 0.7,
        jsonMode: true,
        maxTokens: 2000,
      });
      provider = "Claude";
      model = response.model || CLAUDE_MODEL;
    }

    if (!response?.content) {
      throw new Error("AI 응답이 비어있습니다");
    }

    // Parse response
    const parsed = JSON.parse(normalizeJsonPayload(response.content));
    const newQuiz: Quiz[] = parsed.quiz || [];

    if (!Array.isArray(newQuiz) || newQuiz.length === 0) {
      throw new Error("퀴즈 생성에 실패했습니다");
    }

    // Validate quiz structure
    newQuiz.forEach((item, index) => {
      if (!item.question || !Array.isArray(item.options) || typeof item.answer !== "number") {
        throw new Error(`퀴즈 ${index + 1} 구조가 올바르지 않습니다`);
      }
    });

    return NextResponse.json({
      quiz: newQuiz,
      aiProvider: provider,
      aiModel: model,
    });
  } catch (error) {
    console.error("[Generate Quiz] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "퀴즈 생성에 실패했습니다",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
