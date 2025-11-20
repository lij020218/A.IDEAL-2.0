import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureGrowthContentAllowed } from "@/lib/plan";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";
import { aiLimiter } from "@/lib/rate-limiter";

// ===== 타입 정의 =====
interface Slide {
  title: string;
  content: string;
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

// ===== 시스템 프롬프트 (GPT-5.1 최적화) =====
const SYSTEM_PROMPT = `당신은 세계 최고의 교육 전문가입니다. 학습자에게 최고의 학습 경험을 제공하는 것이 목표입니다.

# 핵심 원칙

## 0. 시험 공부 주제 특별 지시사항 (중요)
시험 공부 주제의 경우, 첨부된 시험 자료 파일의 내용을 **반드시 충실히 따르고 상세히 요약**해야 합니다:
- 첨부된 파일의 내용을 정확하게 반영하세요
- 파일의 핵심 내용을 빠짐없이 포함하세요
- 파일 내용을 기반으로 상세하고 정확한 설명을 제공하세요
- 파일에 없는 내용을 임의로 추가하거나 추측하지 마세요
- 파일 내용의 순서와 구조를 최대한 존중하세요
- **핵심 개념 카드와 요점 정리도 반드시 적용해야 합니다** (아래 섹션 참조)

## 1. 자연스러운 문장과 문단 연결
- 문장과 문단이 유기적으로 연결되어야 합니다
- "그렇다면", "이제", "다음으로" 같은 자연스러운 전환어를 사용하세요
- 각 문단은 이전 문단의 내용을 자연스럽게 이어받아야 합니다
- 이야기하듯이 흐르는 듯한 문체를 유지하세요

## 2. 강조 표시
- **중요한 단어나 개념**: \`**굵게**\` 표시 (보라색 강조)
- *중요한 문장이나 설명*: \`*기울임*\` 표시 (황금색 강조)
- 강조는 적절히 사용하여 가독성을 해치지 않도록 주의하세요

## 3. 핵심 개념 카드
핵심 개념은 반드시 다음 형식으로 작성하세요:
\`**개념명: 설명**\`

예시:
- \`**React: 사용자 인터페이스를 구축하기 위한 JavaScript 라이브러리**\`
- \`**useState: 함수형 컴포넌트에서 상태를 관리하는 Hook**\`

이 형식은 시안/블루 유리 글래스 스타일 카드로 표시됩니다.

## 4. 요점 정리 카드 (필수)
모든 슬라이드는 반드시 아래 형식으로 끝나야 합니다:

---

📌 요점 정리:
- 핵심 포인트 1
- 핵심 포인트 2
- 핵심 포인트 3

**주의사항**:
- 반드시 \`---\` 구분선 후 빈 줄, 그 다음 \`📌 요점 정리:\` 순서
- 불릿은 반드시 \`-\` (하이픈) 사용
- 요점 정리는 에메랄드 색 유리 글래스 카드로 표시됩니다

## 5. 글자 수와 구조
- 슬라이드당 235~335단어로 충분히 상세하게 작성
- 존댓말(합니다체) 사용
- 2-3문장마다 빈 줄로 가독성 확보

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
2. 슬라이드당: 235~335단어
3. 퀴즈: 6개 (4지선다) - 기본 제공
4. 모든 슬라이드는 요점 정리로 끝낼 것
5. 문장과 문단이 자연스럽게 연결되어야 함
6. 핵심 개념은 **개념명: 설명** 형식으로 작성
${examMaterials ? "7. **시험 자료 내용을 충실히 따르고 상세히 요약**해야 함" : ""}

## JSON 형식
{
  "slides": [
    {
      "title": "슬라이드 제목",
      "content": "본문 내용...\\n\\n---\\n\\n📌 요점 정리:\\n- 포인트 1\\n- 포인트 2\\n- 포인트 3"
    }
  ],
  "objectives": ["학습 목표 1", "학습 목표 2", "학습 목표 3"],
  "quiz": [
    {
      "question": "문제",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": 0,
      "explanation": "정답 설명"
    }
  ],
  "resources": ["참고 자료 1", "참고 자료 2"]
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

// ===== 콘텐츠 검증 =====
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

// ===== 요점 정리 보장 =====
function ensureKeyPoints(content: string): string {
  // 이미 요점 정리가 있는지 확인
  if (content.includes("📌 요점 정리:") || content.includes("요점 정리:")) {
    return content;
  }

  // 요점 정리가 없으면 기본 템플릿 추가
  const trimmed = content.trim();
  return `${trimmed}

---

📌 요점 정리:
- 이 슬라이드의 핵심 개념을 이해했습니다
- 주요 용어와 정의를 학습했습니다
- 다음 단계 학습을 위한 기초를 다졌습니다`;
}

// ===== 콘텐츠 후처리 =====
function postProcessContent(data: LearningContent): LearningContent {
  return {
    ...data,
    slides: data.slides.map((slide) => ({
      ...slide,
      content: ensureKeyPoints(slide.content),
    })),
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
