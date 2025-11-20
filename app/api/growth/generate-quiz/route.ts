import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";
import { aiLimiter } from "@/lib/rate-limiter";

// ===== 타입 정의 =====
interface Quiz {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

// ===== 시스템 프롬프트 =====
const SYSTEM_PROMPT = `당신은 교육 전문가입니다. 학습 내용을 바탕으로 효과적인 퀴즈 문제를 만듭니다.

# 퀴즈 작성 원칙
- 문제는 명확하고 이해하기 쉬워야 합니다
- 선택지는 모두 그럴듯해야 하며, 정답이 명확해야 합니다
- 설명은 왜 정답인지, 왜 다른 선택지가 틀렸는지 명확히 해야 합니다
- 학습 내용의 핵심을 다루어야 합니다`;

// ===== 사용자 프롬프트 생성 =====
function buildQuizPrompt(params: {
  topicTitle: string;
  curriculumTitle: string;
  curriculumDescription: string;
  existingQuizCount: number;
  additionalCount: number;
  slides: any[];
}): string {
  const { topicTitle, curriculumTitle, curriculumDescription, existingQuizCount, additionalCount, slides } = params;

  // 슬라이드 내용 요약 (퀴즈 생성에 필요한 컨텍스트)
  const slidesSummary = slides
    .slice(0, 5) // 처음 5개 슬라이드만 사용 (컨텍스트 길이 제한)
    .map((slide, idx) => `슬라이드 ${idx + 1}: ${slide.title}\n${slide.content.substring(0, 200)}...`)
    .join("\n\n");

  return `# 퀴즈 추가 생성 요청

## 학습 정보
- 주제: ${topicTitle}
- 오늘의 학습: ${curriculumTitle}
- 설명: ${curriculumDescription}

## 현재 상황
- 기존 퀴즈: ${existingQuizCount}문제
- 추가 생성 필요: ${additionalCount}문제

## 학습 내용 요약
${slidesSummary}

## 생성 규칙
1. ${additionalCount}개의 4지선다 문제를 생성하세요
2. 기존 퀴즈와 중복되지 않도록 주의하세요
3. 학습 내용의 다양한 측면을 다루세요
4. 문제는 명확하고, 선택지는 모두 그럴듯해야 합니다

## JSON 형식
{
  "quiz": [
    {
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": 0,
      "explanation": "정답 설명"
    }
  ]
}

JSON만 반환하세요. 코드 블록 금지.`;
}

// ===== JSON 정규화 =====
function normalizeJson(raw: string): string {
  if (!raw) return raw;

  let text = raw.trim();

  // 코드 블록 제거
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/i);
  if (jsonMatch) {
    text = jsonMatch[1].trim();
  } else if (text.startsWith("```")) {
    const match = text.match(/```\w*\s*([\s\S]*?)```/);
    if (match) text = match[1].trim();
  }

  // JSON 객체 추출
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    text = text.substring(firstBrace, lastBrace + 1);
  }

  return text;
}

// ===== 메인 API 핸들러 =====
export async function POST(req: NextRequest) {
  try {
    // 인증 확인
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
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    // 요청 파싱
    const { topicId, dayNumber, existingQuizCount, additionalCount } = await req.json();
    if (!topicId || !dayNumber || typeof existingQuizCount !== "number" || typeof additionalCount !== "number") {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다" },
        { status: 400 }
      );
    }

    // 최대 12문제 제한 확인
    if (existingQuizCount + additionalCount > 12) {
      return NextResponse.json(
        { error: "최대 12문제까지만 생성할 수 있습니다" },
        { status: 400 }
      );
    }

    // 토픽 조회
    const topic = await prisma.growthTopic.findFirst({
      where: { id: topicId, userId: user.id },
    });

    if (!topic) {
      return NextResponse.json({ error: "학습 주제를 찾을 수 없습니다" }, { status: 404 });
    }

    // 커리큘럼 조회
    const curriculum = await prisma.curriculum.findFirst({
      where: { topicId, dayNumber },
    });

    if (!curriculum) {
      return NextResponse.json({ error: "커리큘럼을 찾을 수 없습니다" }, { status: 404 });
    }

    // 기존 슬라이드 로드
    let slides: any[] = [];
    if (curriculum.content) {
      try {
        slides = JSON.parse(curriculum.content);
      } catch {
        // 슬라이드 파싱 실패 시 빈 배열
      }
    }

    // 프롬프트 생성
    const userPrompt = buildQuizPrompt({
      topicTitle: topic.title,
      curriculumTitle: curriculum.title,
      curriculumDescription: curriculum.description,
      existingQuizCount,
      additionalCount,
      slides,
    });

    const messages: UnifiedMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ];

    // GPT-5 Mini 호출 (퀴즈 생성에 최적화)
    const miniModel = process.env.OPENAI_MINI_MODEL || "gpt-5-mini-2025-08-07";
    console.log("[Generate Quiz] Using model:", miniModel);

    const response = await generateWithAI("gpt", messages, {
      temperature: 1, // GPT-5는 항상 1로 고정
      jsonMode: true,
      maxTokens: 4000,
      model: miniModel, // GPT-5 Mini 명시적 지정
    });

    if (!response?.content) {
      throw new Error("AI 응답이 비어있습니다");
    }

    // 응답 파싱
    const normalized = normalizeJson(response.content);
    const parsed = JSON.parse(normalized);

    if (!parsed.quiz || !Array.isArray(parsed.quiz)) {
      throw new Error("퀴즈 배열이 없습니다");
    }

    // 퀴즈 검증
    parsed.quiz.forEach((q: any, i: number) => {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.answer !== "number") {
        throw new Error(`퀴즈 ${i + 1} 구조가 잘못되었습니다`);
      }
    });

    return NextResponse.json({
      quiz: parsed.quiz,
      aiProvider: "GPT",
      aiModel: miniModel,
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

