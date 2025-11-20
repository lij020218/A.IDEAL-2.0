import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureGrowthContentAllowed } from "@/lib/plan";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";
import { aiLimiter } from "@/lib/rate-limiter";

// ===== 타입 정의 (통합 AI 엔진 구조) =====
interface Card {
  card_title: string;
  card_content: string;
  style: "glass-cyan";
}

interface Summary {
  text: string;
  style: "glass-emerald";
}

interface PreviousLessonReference {
  prev_lesson_id: string | null;
  brief_summary: string;
  connection_sentence: string;
}

interface Metadata {
  estimated_study_time_min: number;
  difficulty_level: "쉬움" | "보통" | "어려움";
  source_reference?: string[];
}

interface Slide {
  slide_id: string;
  lesson_id: string;
  sequence_number: number;
  title: string;
  content: string; // 250~300자 철저 준수
  example: string;
  cards: Card[];
  summary: Summary;
  previous_lesson_reference: PreviousLessonReference;
  metadata: Metadata;
}

interface Quiz {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface LearningContent {
  slides: Slide[];
  objectives: string[];
  quiz: Quiz[];
  resources: string[];
}

// ===== 시스템 프롬프트 (통합 AI 엔진 - World-Class Master Teacher) =====
const SYSTEM_PROMPT = `당신은 A.ideal의 '통합 학습 AI 엔진'이며, **세계 최고의 강사(World-Class Master Teacher)**입니다.

당신의 강의는 학생이 어떤 학력·배경을 가지고 있어도 "즉시 이해 가능"하며, 모든 개념을 가장 정확하고 명확하고 교육적으로 뛰어난 구조로 설명합니다.

# 당신의 기본 능력
- 개념을 단번에 이해시키는 직관적 설명 능력
- 복잡한 내용을 구조적으로 재구성하는 능력
- 학생 수준에 맞춰 난이도를 완벽하게 조절하는 능력
- 정보를 압축하는 동시에 의미 손실 없이 전달하는 능력

# Mode: learning_mode (학습하기)

## 슬라이드 생성 규칙

### 1. content (250~300자 철저 준수)
- "개념 → 이유 → 예시" 순서로 구조화
- 초·중·고·대학 누구나 이해할 수 있을 만큼 명확
- 불필요한 문장 없음, 구조적·논리적·직관적
- 학생이 이해하지 못할 요소는 자동으로 설명을 덧붙임
- **중요한 단어**: \`**굵게**\` 표시
- *중요한 문장*: \`*기울임*\` 표시

### 2. example (실제 적용 예시 1개)
- 구체적이고 실용적인 예제 제공
- 단계별로 명확하게 설명 (1→2→3)
- 학습자가 직접 따라할 수 있는 수준

### 3. cards (시안 글래스 핵심 개념 카드)
- 배열 형태: [{"card_title":"개념명","card_content":"명확한 정의","style":"glass-cyan"}]
- 슬라이드당 1~3개의 핵심 개념
- 정의는 간결하고 정확하게 (50~80자)

### 4. summary (에메랄드 글래스 요점 정리)
- 형태: {"text":"요점 정리 내용","style":"glass-emerald"}
- 슬라이드의 핵심 3~5개를 요약
- 각 요점은 명확한 문장으로 작성

### 5. previous_lesson_reference (이전 학습 연결)
- prev_lesson_id: 이전 슬라이드 ID (첫 슬라이드는 null)
- brief_summary: 이전 핵심 요약 (30~80자)
- connection_sentence: 이전 내용과 현재 내용의 연결 이유

### 6. metadata (학습 메타데이터)
- estimated_study_time_min: 예상 학습 시간 (5~8분)
- difficulty_level: "쉬움" | "보통" | "어려움"
- source_reference: 출처 (해당 시 명시)

## 난이도 자동 조절
- 초등: 쉬운 말, 비유 중심
- 중·고등: 원리 중심, 과학적 설명
- 대학: 이론+사례, 심화 개념
- 직장인: 실무 중심, 응용 위주

## 절대 규칙
- 첨부자료가 없으므로 "객관적 사실 기반"만 사용
- 오개념·불확실·추측 금지
- content는 정확히 250~300자
- 모든 슬라이드는 cards와 summary 필수 포함
- JSON만 반환, 코드 블록이나 설명 금지

# 출력 형식
반드시 JSON만 반환. 코드 블록이나 설명 금지.`;

// ===== PDF 파일에서 텍스트 추출 =====
async function extractTextFromPDF(url: string): Promise<string> {
  try {
    console.log("[Generate Content] Fetching PDF from URL:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`PDF 다운로드 실패: ${response.status}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    // pdf-parse는 CommonJS 모듈이므로 require 사용
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    const text = data.text.trim();
    
    console.log("[Generate Content] PDF 텍스트 추출 완료, 길이:", text.length);
    return text;
  } catch (error) {
    console.error("[Generate Content] PDF 텍스트 추출 실패:", error);
    throw new Error(`PDF 파일 처리 실패: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ===== 시험 공부 주제인지 확인 =====
function isExamTopic(description: string | null): boolean {
  if (!description) return false;
  try {
    const parsed = JSON.parse(description);
    return Array.isArray(parsed) && parsed.length > 0 && parsed[0].url;
  } catch {
    return false;
  }
}

// ===== 시험 자료 내용 추출 =====
async function extractExamMaterials(description: string | null): Promise<string> {
  if (!isExamTopic(description)) {
    return "";
  }

  try {
    const files = JSON.parse(description!);
    if (!Array.isArray(files) || files.length === 0) {
      return "";
    }

    console.log("[Generate Content] 시험 자료 파일 개수:", files.length);
    
    const extractedTexts: string[] = [];
    
    // 각 PDF 파일에서 텍스트 추출 (최대 10개 파일, 각 파일 최대 10000자)
    for (let i = 0; i < Math.min(files.length, 10); i++) {
      const file = files[i];
      if (file.url) {
        try {
          const text = await extractTextFromPDF(file.url);
          // 각 파일의 텍스트를 제한하여 너무 길어지지 않도록 함
          const limitedText = text.substring(0, 10000);
          extractedTexts.push(`[파일 ${i + 1}: ${file.filename || `파일${i + 1}.pdf`}]\n${limitedText}${text.length > 10000 ? '\n...(내용 생략)...' : ''}`);
        } catch (error) {
          console.error(`[Generate Content] 파일 ${i + 1} 처리 실패:`, error);
          // 파일 처리 실패해도 계속 진행
        }
      }
    }

    return extractedTexts.join("\n\n---\n\n");
  } catch (error) {
    console.error("[Generate Content] 시험 자료 추출 실패:", error);
    return "";
  }
}

// ===== 사용자 프롬프트 생성 =====
function buildUserPrompt(params: {
  topicTitle: string;
  topicGoal: string;
  level: string;
  dayNumber: number;
  curriculumTitle: string;
  curriculumDescription: string;
  estimatedTime: number;
  previousTitle?: string;
  previousDescription?: string;
  examMaterials?: string;
}): string {
  const {
    topicTitle,
    topicGoal,
    level,
    dayNumber,
    curriculumTitle,
    curriculumDescription,
    estimatedTime,
    previousTitle,
    previousDescription,
    examMaterials,
  } = params;

  const levelText = level === "beginner" ? "초급" : level === "intermediate" ? "중급" : "고급";
  const slideCount = Math.max(10, Math.min(18, Math.round(estimatedTime / 5)));

  const previousSection = previousTitle
    ? `\n이전 학습 (Day ${dayNumber - 1}): ${previousTitle}\n내용: ${previousDescription}\n→ 이전 내용과 자연스럽게 연결하세요.`
    : "첫 학습이므로 기초 개념을 탄탄히 잡아주세요.";

  const examMaterialsSection = examMaterials
    ? `\n\n## 시험 자료 내용 (중요)\n아래 첨부된 시험 자료 파일의 내용을 **충실히 따르고 상세히 요약**하여 학습 콘텐츠를 생성하세요.\n\n${examMaterials}\n\n**중요 지시사항**:\n- 첨부된 파일 내용을 정확하게 반영해야 합니다\n- 파일의 핵심 내용을 빠짐없이 포함하세요\n- 파일 내용을 기반으로 상세하고 정확한 설명을 제공하세요\n- 파일에 없는 내용을 임의로 추가하지 마세요\n- **핵심 개념은 반드시 \`**개념명: 설명**\` 형식으로 작성해야 합니다**\n- **모든 슬라이드는 반드시 요점 정리로 끝나야 합니다**`
    : "";

  return `# 학습 콘텐츠 생성 요청

## 기본 정보
- 주제: ${topicTitle}
- 목표: ${topicGoal}
- 수준: ${levelText}

## 오늘의 학습 (Day ${dayNumber})
- 제목: ${curriculumTitle}
- 설명: ${curriculumDescription}
- 학습 시간: ${estimatedTime}분
${previousSection}${examMaterialsSection}

## 생성 규칙
1. 슬라이드: ${slideCount}개 (±2)
2. 슬라이드당 content: 정확히 250~300자
3. 퀴즈: 6개 (4지선다) - 기본 제공
4. 모든 슬라이드는 cards + summary 필수
5. previous_lesson_reference 필수 포함
6. 세계 최고 강사 톤: "개념 → 이유 → 예시" 구조
${examMaterials ? "7. **시험 자료 내용을 충실히 따르고 상세히 요약**해야 함" : ""}

## JSON 형식 (반드시 이 구조 준수)
{
  "slides": [
    {
      "slide_id": "L${dayNumber}-S1",
      "lesson_id": "L${dayNumber}",
      "sequence_number": 1,
      "title": "슬라이드 제목",
      "content": "250~300자 본문 (개념→이유→예시 구조)",
      "example": "구체적 적용 예시 (단계별 설명)",
      "cards": [
        {"card_title":"핵심개념1","card_content":"명확한 정의 50~80자","style":"glass-cyan"}
      ],
      "summary": {"text":"요점 정리 3~5개","style":"glass-emerald"},
      "previous_lesson_reference": {
        "prev_lesson_id": null,
        "brief_summary": "이전 핵심 요약 30~80자",
        "connection_sentence": "이전과 현재의 연결"
      },
      "metadata": {
        "estimated_study_time_min": 7,
        "difficulty_level": "보통",
        "source_reference": []
      }
    }
  ],
  "objectives": ["학습 목표 1", "학습 목표 2"],
  "quiz": [
    {
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": 0,
      "explanation": "정답 설명"
    }
  ],
  "resources": ["추가 자료 1", "추가 자료 2"]
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

// ===== 콘텐츠 검증 (통합 AI 엔진 구조) =====
function validateContent(data: any): LearningContent {
  if (!data || typeof data !== "object") {
    throw new Error("응답이 객체가 아닙니다");
  }

  if (!Array.isArray(data.slides) || data.slides.length === 0) {
    throw new Error("slides 배열이 없거나 비어있습니다");
  }

  data.slides.forEach((slide: any, i: number) => {
    if (!slide.title || !slide.content) {
      throw new Error(`슬라이드 ${i + 1}에 title/content가 없습니다`);
    }
    if (!Array.isArray(slide.cards)) {
      throw new Error(`슬라이드 ${i + 1}에 cards 배열이 없습니다`);
    }
    if (!slide.summary || !slide.summary.text) {
      throw new Error(`슬라이드 ${i + 1}에 summary가 없습니다`);
    }
    if (!slide.previous_lesson_reference) {
      throw new Error(`슬라이드 ${i + 1}에 previous_lesson_reference가 없습니다`);
    }
    if (!slide.metadata) {
      throw new Error(`슬라이드 ${i + 1}에 metadata가 없습니다`);
    }
  });

  if (data.quiz && Array.isArray(data.quiz)) {
    data.quiz.forEach((q: any, i: number) => {
      if (!q.question || !Array.isArray(q.options) || typeof q.answer !== "number") {
        throw new Error(`퀴즈 ${i + 1} 구조가 잘못되었습니다`);
      }
    });
  }

  return {
    slides: data.slides,
    objectives: Array.isArray(data.objectives) ? data.objectives : [],
    quiz: Array.isArray(data.quiz) ? data.quiz : [],
    resources: Array.isArray(data.resources) ? data.resources : [],
  };
}

// ===== 콘텐츠 후처리 (통합 AI 엔진 구조) =====
function postProcessContent(data: LearningContent): LearningContent {
  return {
    ...data,
    slides: data.slides.map((slide, index) => {
      // ID 자동 생성 (없는 경우)
      const slideId = slide.slide_id || `L${slide.lesson_id || "1"}-S${index + 1}`;
      const lessonId = slide.lesson_id || "L1";
      const sequenceNumber = slide.sequence_number || index + 1;

      // cards 기본값
      const cards = Array.isArray(slide.cards) && slide.cards.length > 0
        ? slide.cards
        : [{
            card_title: "핵심 개념",
            card_content: "이 슬라이드의 주요 내용을 학습합니다",
            style: "glass-cyan" as const
          }];

      // summary 기본값
      const summary = slide.summary && slide.summary.text
        ? slide.summary
        : {
            text: "이 슬라이드에서 핵심 개념을 학습했습니다.",
            style: "glass-emerald" as const
          };

      // previous_lesson_reference 기본값
      const previous_lesson_reference = slide.previous_lesson_reference || {
        prev_lesson_id: index > 0 ? `L${lessonId}-S${index}` : null,
        brief_summary: index > 0 ? "이전 내용 요약" : "첫 학습입니다",
        connection_sentence: index > 0 ? "이전 내용을 바탕으로 진행합니다" : "기초부터 시작합니다"
      };

      // metadata 기본값
      const metadata = slide.metadata || {
        estimated_study_time_min: 7,
        difficulty_level: "보통" as const,
        source_reference: []
      };

      return {
        ...slide,
        slide_id: slideId,
        lesson_id: lessonId,
        sequence_number: sequenceNumber,
        example: slide.example || "예시가 제공되지 않았습니다.",
        cards,
        summary,
        previous_lesson_reference,
        metadata
      };
    }),
  };
}

// ===== DB 저장 =====
async function saveContent(curriculumId: string, data: LearningContent) {
  const slidesStr = JSON.stringify(data.slides);
  const objectivesStr = JSON.stringify(data.objectives);
  const quizStr = data.quiz.length ? JSON.stringify(data.quiz) : null;
  const resourcesStr = data.resources.length ? JSON.stringify(data.resources) : null;

  await prisma.$executeRaw`
    UPDATE "Curriculum"
    SET content = ${slidesStr},
        objectives = ${objectivesStr},
        exercises = ${quizStr},
        resources = ${resourcesStr},
        "updatedAt" = NOW()
    WHERE id = ${curriculumId}
  `;
}

// ===== 캐시된 콘텐츠 로드 =====
function loadCachedContent(curriculum: any): LearningContent | null {
  if (!curriculum.content || typeof curriculum.content !== "string") {
    return null;
  }

  try {
    const slides = JSON.parse(curriculum.content);
    if (!Array.isArray(slides) || slides.length === 0) {
      return null;
    }

    return {
      slides,
      objectives: curriculum.objectives ? JSON.parse(curriculum.objectives) : [],
      quiz: curriculum.exercises ? JSON.parse(curriculum.exercises) : [],
      resources: curriculum.resources ? JSON.parse(curriculum.resources) : [],
    };
  } catch {
    return null;
  }
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
    const { topicId, dayNumber, force } = await req.json();
    if (!topicId || !dayNumber) {
      return NextResponse.json(
        { error: "topicId와 dayNumber는 필수입니다" },
        { status: 400 }
      );
    }

    // 플랜 확인
    await ensureGrowthContentAllowed(user.id);

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

    // 캐시된 콘텐츠 확인
    if (!force) {
      const cached = loadCachedContent(curriculum);
      if (cached) {
        return NextResponse.json({
          ...cached,
          aiProvider: "Cached",
          aiModel: "cached",
          cached: true,
        });
      }
    }

    // 이전 커리큘럼 조회
    const previous = dayNumber > 1
      ? await prisma.curriculum.findFirst({
          where: { topicId, dayNumber: dayNumber - 1 },
        })
      : null;

    // 시험 공부 주제인 경우 첨부 파일 내용 추출
    let examMaterials = "";
    if (isExamTopic(topic.description)) {
      console.log("[Generate Content] 시험 공부 주제 감지, 파일 내용 추출 중...");
      try {
        examMaterials = await extractExamMaterials(topic.description);
        console.log("[Generate Content] 시험 자료 추출 완료, 길이:", examMaterials.length);
      } catch (error) {
        console.error("[Generate Content] 시험 자료 추출 실패:", error);
        // 파일 추출 실패해도 계속 진행 (경고만 표시)
      }
    }

    // 프롬프트 생성
    const userPrompt = buildUserPrompt({
      topicTitle: topic.title,
      topicGoal: topic.goal,
      level: topic.level,
      dayNumber,
      curriculumTitle: curriculum.title,
      curriculumDescription: curriculum.description,
      estimatedTime: curriculum.estimatedTime,
      previousTitle: previous?.title,
      previousDescription: previous?.description,
      examMaterials: examMaterials || undefined,
    });

    const messages: UnifiedMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ];

    // GPT-5.1 호출
    const model = process.env.OPENAI_MODEL || "gpt-5.1-2025-11-13";
    const response = await generateWithAI("gpt", messages, {
      temperature: 1, // GPT-5는 항상 1로 고정
      jsonMode: true,
      maxTokens: 8000,
    });

    if (!response?.content) {
      throw new Error("AI 응답이 비어있습니다");
    }

    // 응답 파싱 및 검증
    const normalized = normalizeJson(response.content);
    const parsed = JSON.parse(normalized);
    const validated = validateContent(parsed);
    const processed = postProcessContent(validated);

    // DB 저장
    await saveContent(curriculum.id, processed);

    return NextResponse.json({
      ...processed,
      aiProvider: "GPT",
      aiModel: model,
    });
  } catch (error) {
    console.error("[Generate Content] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "학습 콘텐츠 생성에 실패했습니다",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
