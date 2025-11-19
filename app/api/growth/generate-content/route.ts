import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureGrowthContentAllowed } from "@/lib/plan";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";
import { aiLimiter } from "@/lib/rate-limiter";

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-5-20250929";
const MAX_AI_ATTEMPTS = 2;
const FALLBACK_MODEL_NAME = "structured-fallback";

const AI_SYSTEM_PROMPT = `너는 세계 최고 수준의 교수(Professor)이자 커리큘럼 디자이너다.

# 핵심 원칙
- 학습자의 수준과 목표를 고려해 내용을 '연결된 흐름'으로 설계한다. (도입 → 핵심 개념 → 설명 → 적용 → 마무리)
- 각 슬라이드는 235~335단어로 충분히 상세하고 깊이 있는 내용을 제공한다.
- 존댓말(합니다체)로 정중하고 명확하게 설명한다.
- 문단은 자연스럽게 흐르도록 작성하되, 2-3문장마다 빈 줄을 두어 가독성을 높인다.

# 마크다운 강조 규칙
- **중요 단어**: 굵게 표시 → **단어** (프론트엔드에서 보라색으로 강조)
- *중요 문장*: 기울임 표시 → *문장* (프론트엔드에서 황금색으로 강조)

# 개념 카드 규칙 (매우 중요)
- 핵심 개념을 설명할 때는 반드시 별도 줄에 **개념명: 완전한 설명 문장** 형식으로 작성
- 이렇게 작성하면 프론트엔드에서 파란색 카드로 표시됨
- 예시: "**디지털 마케팅: 디지털 채널을 활용해 고객을 발견·획득·유지하며, 데이터를 기반으로 마케팅 활동을 최적화하는 전체 활동을 의미합니다**"
- 단순 강조 단어는 굵게만 처리하고 콜론(:)을 사용하지 않음

# [절대 금지] 가운뎃점(·) 사용 규칙
- **일반 문장이나 설명에 가운뎃점을 사용하는 것은 절대 금지**
- 가운뎃점은 오직 명시적인 리스트(목록) 나열 시에만 사용
- 잘못된 예: "마케팅은 · 고객을 발견하고 · 획득하는 활동입니다" (X - 절대 금지)
- 올바른 예: "마케팅은 고객을 발견하고, 획득하는 활동입니다" (O)
- 리스트 나열 예시:

  핵심 요소는 다음과 같습니다.

  · 고객 데이터 수집 및 분석
  · 디지털 채널 활용
  · 실시간 성과 측정

# [절대 필수] 요점 정리 규칙
- **모든 슬라이드는 100% 반드시 요점 정리로 끝나야 함 (예외 없음)**
- **요점 정리가 없는 슬라이드는 불합격 처리됨**
- 본문 끝에 구분선(---)을 긋고 "📌 요점 정리:" 섹션 추가
- 핵심 내용을 가운뎃점 리스트로 2-4개 정리
- 프론트엔드에서 초록색 카드로 강조 표시됨
- 반드시 이 형식을 따라야 함:

  ---

  **📌 요점 정리:**
  · 핵심 개념 1
  · 핵심 개념 2
  · 핵심 개념 3

# 기타 규칙
- 결과물은 항상 JSON 객체 하나이며, 코드 블록이나 주석을 추가하지 않음
- 한국어로 작성하되 필요한 기술 용어는 영문 원문 병기`;

type TopicRecord = NonNullable<Awaited<ReturnType<typeof fetchTopic>>>;
type CurriculumRecord = NonNullable<Awaited<ReturnType<typeof fetchCurriculum>>>;
type PreviousRecord = Awaited<ReturnType<typeof fetchPreviousCurriculum>>;

type LearningContext = {
  topic: TopicRecord;
  curriculum: CurriculumRecord;
  previous: PreviousRecord;
  dayNumber: number;
};

type GenerationResult = {
  data: LearningContentPayload;
  aiProvider: string;
  aiModel: string;
  reason?: string;
};

const CODE_KEYWORDS: string[] = [
  "코드",
  "프로그래밍",
  "개발",
  "자바스크립트",
  "javascript",
  "타입스크립트",
  "typescript",
  "파이썬",
  "python",
  "자바",
  "java",
  "c#",
  "c++",
  "go",
  "rust",
  "코딩",
  "알고리즘",
  "자료구조",
  "react",
  "node",
  "api",
  "sql",
  "데이터베이스",
];

type LearningContentPayload = {
  slides: Array<{ title: string; content: string }>;
  objectives: string[];
  quiz: Array<{
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  }>;
  resources: string[];
};

function normalizeJsonPayload(raw: string) {
  if (!raw) return raw;

  const trimmed = raw.trim();
  let jsonCandidate = trimmed;

  // 1) Prefer ```json ... ``` block (some models return multiple blocks, take the first)
  const jsonBlockRegex = /```json\s*([\s\S]*?)```/gi;
  const blockMatch = jsonBlockRegex.exec(trimmed);
  if (blockMatch && blockMatch[1]) {
    jsonCandidate = blockMatch[1].trim();
  } else {
    // 2) Remove any ```lang fences``` but keep inner content
    if (trimmed.startsWith("```")) {
      const genericMatch = trimmed.match(/```\w*\s*([\s\S]*?)```/);
      if (genericMatch && genericMatch[1]) {
        jsonCandidate = genericMatch[1].trim();
      }
    }

    // 3) Fallback to substring between first { and last }
    const firstBrace = jsonCandidate.indexOf("{");
    const lastBrace = jsonCandidate.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      jsonCandidate = jsonCandidate.substring(firstBrace, lastBrace + 1);
    }
  }

  return jsonCandidate;
}

function truncateToMaxWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ");
}

function enforceSlideLengthCap(data: LearningContentPayload, cap = 500): LearningContentPayload {
  const adjustedSlides = data.slides.map((s) => ({
    title: s.title,
    content: truncateToMaxWords(s.content, cap),
  }));
  return { ...data, slides: adjustedSlides };
}

async function ensureCurriculumColumns() {
  try {
    await prisma.$executeRaw`ALTER TABLE Curriculum ADD COLUMN content TEXT;`;
    console.log("[Generate Content] Added content column");
  } catch (error) {
    // ignore when column already exists
  }

  try {
    await prisma.$executeRaw`ALTER TABLE Curriculum ADD COLUMN resources TEXT;`;
    console.log("[Generate Content] Added resources column");
  } catch (error) {
    // ignore when column already exists
  }
}

async function fetchTopic(userId: string, topicId: string) {
  return prisma.growthTopic.findFirst({
    where: { id: topicId, userId },
  });
}

async function fetchCurriculum(topicId: string, dayNumber: number) {
  return prisma.curriculum.findFirst({
    where: { topicId, dayNumber },
  });
}

async function fetchPreviousCurriculum(topicId: string, dayNumber: number) {
  if (dayNumber <= 1) return null;
  return prisma.curriculum.findFirst({
    where: { topicId, dayNumber: dayNumber - 1 },
  });
}

function buildPrompt(params: {
  topic: { title: string; goal: string; level: string; description?: string | null };
  current: { title: string; description: string; estimatedTime: number };
  previous?: { title: string; description: string } | null;
  dayNumber: number;
  examFiles?: Array<{ url: string; filename: string; size: number }> | null;
}) {
  const { topic, current, previous, dayNumber, examFiles } = params;
  // 최소 장수: 60분 기준 13장 (시간 비례 최소치), 기본 추정: 1페이지 ≈ 4분
  const minSlides = Math.max(13, Math.ceil((current.estimatedTime * 13) / 60));
  const estimatedSlides = Math.max(minSlides, Math.min(20, Math.round(current.estimatedTime / 4)));

  // description에서 파일 정보 파싱 (시험 공부하기의 경우)
  let parsedFiles: Array<{ url: string; filename: string; size: number }> | null = examFiles || null;
  if (!parsedFiles && topic.description) {
    try {
      const parsed = JSON.parse(topic.description);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].url) {
        parsedFiles = parsed;
      }
    } catch (e) {
      // description이 JSON이 아니면 무시
    }
  }

  const filesSection = parsedFiles && parsedFiles.length > 0
    ? `\n\n**중요: 시험 자료 파일**
다음 PDF 파일들을 반드시 참고하여 학습 내용을 생성하세요:
${parsedFiles.map((f, idx) => `${idx + 1}. ${f.filename}`).join("\n")}

이 파일들의 내용을 바탕으로 학습 내용을 구성하고, 파일에 있는 핵심 개념, 예제, 문제 등을 반영하세요.`
    : "";

  return `당신은 세계 최고 수준의 프리미엄 온라인 강의를 만드는 전문 강사입니다. 논리적 흐름과 가독성을 최우선으로 하여 깊이 있는 학습 자료를 설계하세요.

학습 주제: ${topic.title}
전체 목표: ${topic.goal}
현재 수준: ${
    topic.level === "beginner" ? "초급" : topic.level === "intermediate" ? "중급" : "고급"
  }

오늘의 학습 (Day ${dayNumber})
- 제목: ${current.title}
- 설명: ${current.description}
- 학습 시간: ${current.estimatedTime}분 (슬라이드 약 ${estimatedSlides}개, ±2장 허용)

${
  previous
    ? `이전 학습 (Day ${dayNumber - 1})\n- ${previous.title}\n- ${previous.description}\n이전 내용을 자연스럽게 연결하세요.`
    : "첫 학습이므로 핵심 개념을 단단히 잡도록 설계하세요."
}${filesSection}

### 작성 규칙
1. **슬라이드 수**: 최소 13장(60분 기준), 가능하면 ${estimatedSlides}장을 맞추되 ±2장 범위에서 조정

2. **슬라이드당 단어 수**: 235~335단어로 충분히 상세하고 깊이 있는 내용 제공

3. **구조**: 도입 → 핵심 개념 → 설명 → 적용 흐름으로 연결

4. **금지 표현**: "X는 뭘까? X는 X야" 같은 반복, 과도한 감탄사, 표면적 설명

5. **마크다운 강조**:
   - 중요 단어: **단어** (보라색 강조)
   - 중요 문장: *문장* (황금색 강조)

6. **개념 카드 작성 (매우 중요)**:
   - 핵심 개념은 별도 줄에 "**개념명: 완전한 설명 문장**" 형식으로 작성
   - 예: "**디지털 마케팅: 디지털 채널을 활용해 고객을 발견·획득·유지하며, 데이터를 기반으로 마케팅 활동을 최적화하는 전체 활동을 의미합니다**"
   - 이렇게 작성하면 파란 카드로 표시됨
   - 단순 강조는 굵게만 처리하고 콜론 사용 안 함

7. **[절대 금지] 가운뎃점(·) 사용 규칙**:
   - **일반 문장이나 설명에는 절대 가운뎃점을 사용하지 마세요**
   - 가운뎃점은 오직 명시적인 리스트(목록) 나열할 때만 사용
   - 잘못된 예: "디지털 마케팅은 · 고객을 발견하고 · 획득하며 · 유지하는 활동입니다" (X)
   - 올바른 예: "디지털 마케팅은 고객을 발견하고, 획득하며, 유지하는 활동입니다" (O)
   - 리스트 나열 시에만 사용:

     핵심 요소는 다음과 같습니다.

     · 고객 데이터 수집
     · 채널 활용
     · 성과 측정

8. **[절대 필수] 요점 정리**:
   - **모든 슬라이드는 100% 반드시 요점 정리로 끝나야 합니다**
   - **요점 정리가 없는 슬라이드는 불합격입니다**
   - 본문 끝에 구분선(---)을 긋고 "📌 요점 정리:" 섹션 추가
   - 핵심을 가운뎃점 리스트로 2-4개 정리
   - 반드시 이 형식을 따르세요:

     ---

     **📌 요점 정리:**
     · 핵심 개념 1
     · 핵심 개념 2
     · 핵심 개념 3

9. **퀴즈**: 2~3개, 각 4개 보기, 정답 인덱스와 설명 포함

10. **참고 자료**: 2개 이상, 자료명 + 한줄 설명

### 반드시 JSON으로만 응답
{
  "slides": [
    {
      "title": "슬라이드 제목",
      "content": "도입 문장으로 시작합니다. 자연스럽게 2-3문장을 이어서 작성합니다. 문단을 나눌 때는 빈 줄을 둡니다.

**핵심 개념명: 핵심 개념에 대한 완전한 설명 문장을 여기에 작성합니다. 이렇게 작성하면 파란 카드로 표시됩니다.**

본문 설명을 계속 이어갑니다. *중요한 문장은 이렇게 기울임으로 강조합니다.* **중요 단어**는 굵게 표시합니다.

리스트가 필요한 경우에만 가운뎃점을 사용합니다.

· 첫 번째 항목에 대한 설명
· 두 번째 항목에 대한 설명
· 세 번째 항목에 대한 설명

마무리 문장으로 내용을 정리합니다. 다음 내용으로 자연스럽게 연결합니다.

---

**📌 요점 정리:**
· 핵심 개념 1
· 핵심 개념 2
· 핵심 개념 3"
    }
  ],
  "objectives": ["학습 목표1", "학습 목표2"],
  "quiz": [
    {
      "question": "깊이 있는 질문",
      "options": ["선택지1", "선택지2", "선택지3", "선택지4"],
      "answer": 0,
      "explanation": "정답 이유와 오답 이유 설명"
    }
  ],
  "resources": ["자료1", "자료2"]
}

!!! 절대 규칙 !!!
- JSON 객체만 출력하세요. 코드 블록(\`\`\`)이나 자연어 문장을 추가하면 작업이 실패합니다.
- 키 이름과 배열 구조를 임의로 바꾸지 마세요.
- **[필수] 모든 슬라이드는 100% 반드시 "---\\n\\n**📌 요점 정리:**\\n· 항목1\\n· 항목2\\n· 항목3" 형식으로 끝나야 합니다. 요점 정리가 없으면 불합격입니다.**
- **[금지] 가운뎃점(·)을 일반 문장에 사용하지 마세요. 오직 리스트(목록) 나열할 때만 사용하세요.**
- 잘못된 예: "마케팅은 · 고객을 발견하고 · 데이터를 분석하는 활동입니다" (절대 금지)
- 올바른 예: "마케팅은 고객을 발견하고, 데이터를 분석하는 활동입니다"
- 개념 카드는 "**개념명: 완전한 설명 문장**" 형식으로 별도 줄에 작성하세요.`;
}

function buildMessages(context: LearningContext): UnifiedMessage[] {
  const { topic, curriculum, previous, dayNumber } = context;
  const prompt = buildPrompt({
    topic: {
      title: topic.title,
      goal: topic.goal,
      level: topic.level,
      description: topic.description,
    },
    current: {
      title: curriculum.title,
      description: curriculum.description,
      estimatedTime: curriculum.estimatedTime,
    },
    previous: previous
      ? { title: previous.title, description: previous.description }
      : null,
    dayNumber,
  });

  return [
    { role: "system", content: AI_SYSTEM_PROMPT },
    {
      role: "user",
      content: `${prompt}\n\nSTRICT FORMAT REMINDER: Return ONLY the JSON object described above. Do not include triple backticks or explanations. Include concrete real-world examples in slides.`,
    },
  ];
}

function tryParseLearningContent(raw: string): LearningContentPayload {
  if (!raw || !raw.trim()) {
    throw new Error("AI 응답이 비어있습니다");
  }

  const parsedContent = normalizeJsonPayload(raw);
  try {
    const data = JSON.parse(parsedContent);
    validatePayload(data);
    return data;
  } catch (error) {
    throw new Error(
      `AI 응답 JSON 변환 실패: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function requestContentFromClaude(context: LearningContext, opts?: { regenerate?: boolean }): Promise<GenerationResult> {
  let messages = buildMessages(context);
  if (opts?.regenerate) {
    messages = [
      ...messages.slice(0, -1),
      {
        ...messages[messages.length - 1],
        content:
          messages[messages.length - 1].content +
          "\n\nREGENERATION DIRECTIVE: 이전 버전과 겹치지 않도록 새로운 예시/사례와 설명 구성을 사용하고, 핵심 개념의 깊이를 한 단계 더 높이십시오. 슬라이드 간 연결성을 강화하고, 실무 적용 체크리스트를 명시하세요.",
      },
    ];
  }
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_AI_ATTEMPTS; attempt++) {
    try {
      const response = await generateWithAI("claude", messages, {
        temperature: attempt === 1 ? 0.65 : 0.85,
        jsonMode: true,
        maxTokens: 6000,
      });

      if (!response?.content) {
        throw new Error("Claude 응답이 비어있습니다");
      }

      const data = tryParseLearningContent(response.content);

      if (looksLikePromptEcho(data)) {
        throw new Error("Claude가 프롬프트 템플릿을 그대로 반환했습니다");
      }

      return {
        data,
        aiProvider: "Claude",
        aiModel: response.model || CLAUDE_MODEL,
      };
    } catch (error) {
      lastError = error;
      console.error(`[Generate Content] Claude 시도 ${attempt} 실패:`, error);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Claude 응답을 가져오지 못했습니다");
}

async function requestContentFromGPT(context: LearningContext, opts?: { regenerate?: boolean }): Promise<GenerationResult> {
  let messages = buildMessages(context);
  if (opts?.regenerate) {
    messages = [
      ...messages.slice(0, -1),
      {
        ...messages[messages.length - 1],
        content:
          messages[messages.length - 1].content +
          "\n\nREGENERATION DIRECTIVE: 직전 생성본과 중복을 피하고, 새로운 사례와 질문, 그리고 더 정교한 적용 단계(체크리스트 형태)를 포함하세요. 핵심 개념을 더 깊이 설명하되冗長하지 않게 구성하세요.",
      },
    ];
  }
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= MAX_AI_ATTEMPTS; attempt++) {
    try {
      const response = await generateWithAI("gpt", messages, {
        temperature: attempt === 1 ? 1 : 0.9, // 라우터가 고정 처리
        jsonMode: true,
      });
      if (!response?.content) {
        throw new Error("GPT 응답이 비어있습니다");
      }
      const data = tryParseLearningContent(response.content);
      if (looksLikePromptEcho(data)) {
        throw new Error("GPT가 프롬프트 템플릿을 그대로 반환했습니다");
      }
      return {
        data,
        aiProvider: "GPT",
        aiModel: response.model || process.env.OPENAI_MODEL || "gpt-5.1-2025-11-13",
      };
    } catch (error) {
      lastError = error;
      console.error(`[Generate Content] GPT 시도 ${attempt} 실패:`, error);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("GPT 응답을 가져오지 못했습니다");
}

function looksLikePromptEcho(data: LearningContentPayload) {
  const serialized = JSON.stringify(data);
  const suspiciousPatterns = [
    "슬라이드 제목",
    "마크다운 본문",
    "학습 목표1",
    "깊이 있는 질문",
    "선택지1",
    "자료1",
    "JSON으로만 응답",
    "**학습 주제**",
  ];

  return suspiciousPatterns.some((pattern) => serialized.includes(pattern));
}

function buildFallbackContent(params: {
  topic: { title: string; goal: string; level: string; description?: string | null };
  current: { title: string; description: string; estimatedTime: number };
  previous?: { title: string; description: string } | null;
  dayNumber: number;
}): LearningContentPayload {
  const { topic, current, previous, dayNumber } = params;
  const continuityText = previous
    ? `이전 Day ${dayNumber - 1}에서 다뤘던 "${previous.title}" 내용을 토대로 `
    : "";
  const slides = [
    {
      title: `${current.title} 개요`,
      content: `${continuityText}**${topic.title}** 여정 중 **Day ${dayNumber}** 학습을 위한 핵심 맥락을 정리합니다.

*목표는 "${topic.goal}"을 향해 나아가면서 ${current.description} 내용을 명확히 이해하는 것입니다.*

> 학습 전 자신의 현재 지식 수준을 확인하고, 구체적인 목표를 세워보세요.`,
    },
    {
      title: "핵심 개념 정리",
      content: `**${current.title}**를 수행할 때 *반드시 알아야 하는 주요 개념*과 용어를 3~4개로 나누어 설명합니다.

각 **핵심 개념**이 전체 학습 목표와 어떻게 연결되는지 문장으로 풀어쓰세요.

> 개념을 단순히 암기하지 말고, 실제 상황에서 어떻게 적용되는지 항상 생각하세요.`,
    },
    {
      title: "실무 적용 아이디어",
      content: `개념을 *실제 업무나 프로젝트*에 옮기는 과정을 단계별로 설명합니다.

**${current.estimatedTime}분** 학습 시간을 기준으로:
- **준비**: 필요한 자료와 환경 설정
- **실행**: 단계별 실습 진행
- **리뷰**: 결과 검토 및 개선점 파악

> 이론만으로는 부족합니다. 반드시 직접 실습하며 체득하세요.`,
    },
    {
      title: "미니 실습",
      content: `**${topic.title}**을(를) 다루는 *짧은 실습 시나리오*를 제시하고, 예상 결과와 체크리스트를 제공합니다.

실습 후 다음을 확인하세요:
- 의도한 결과가 나왔는가?
- 어떤 부분이 어려웠는가?
- 실무에 어떻게 응용할 수 있는가?

> 실습은 여러 번 반복해도 좋습니다. 완벽할 때까지 연습하세요.`,
    },
    {
      title: "리플렉션 질문",
      content: `*오늘 학습이 **${topic.goal}** 달성과 어떤 관련이 있는지* 스스로 점검할 수 있는 질문 3가지를 제공합니다.

**자기 점검 질문**:
1. 오늘 배운 핵심 개념을 내 언어로 설명할 수 있는가?
2. 실무에서 바로 적용 가능한 부분은 무엇인가?
3. 더 깊이 공부해야 할 영역은 어디인가?

> 매 학습 후 반드시 자신만의 정리 노트를 작성하세요.`,
    },
    {
      title: "마무리 및 다음 단계",
      content: `**Day ${dayNumber + 1}**을 준비할 때 도움이 될 *사전 지식이나 자료*를 2가지 이상 제안합니다.

**다음 학습 준비**:
- 오늘 배운 내용을 복습하고 정리
- 실습 결과물을 포트폴리오로 정리
- 궁금한 점이나 어려웠던 부분 메모

> 꾸준함이 실력을 만듭니다. 매일 조금씩이라도 학습을 이어가세요.`,
    },
  ];

  const objectives = [
    `${current.title}의 핵심 개념과 용어를 정리할 수 있다.`,
    `${topic.goal} 달성을 위한 실무 적용 아이디어를 말할 수 있다.`,
    `다음 학습 단계에서 필요한 준비 요소를 스스로 정의한다.`,
  ];

  const quiz = [
    {
      question: `${current.title} 세션의 첫 단계에서 가장 중요한 활동은 무엇인가요?`,
      options: [
        "결과물을 완성하는 것",
        "맥락과 목표를 재확인하는 것",
        "모든 참고 자료를 암기하는 것",
        "이전 학습 내용을 모두 반복하는 것",
      ],
      answer: 1,
      explanation:
        "Day별 학습은 항상 전체 목표와 연결된 맥락을 명확히 해야 합니다. 나머지 선택지는 준비 없이 실행하거나 비효율적인 학습 순서를 초래합니다.",
    },
    {
      question: `"${topic.title}" 여정을 실무에 연결하는 가장 좋은 방법은?`,
      options: [
        "모든 개념을 이론적으로만 정리한다",
        "새로운 도구를 무조건 도입한다",
        "업무나 프로젝트에 맞춘 단계별 실행 플랜을 만든다",
        "관련 없는 최신 트렌드를 조사한다",
      ],
      answer: 2,
      explanation:
        "실행 플랜을 만들어야 학습이 실제 성과로 이어집니다. 나머지 선택지는 집중력을 분산시키거나 목표와 무관할 수 있습니다.",
    },
  ];

  const resources = [
    `${topic.title} 기본 가이드 - ${topic.description || "핵심 개념을 빠르게 복습할 수 있는 정리"}`,
    `${current.title} 실무 체크리스트 - 바로 적용 가능한 단계별 질문`,
  ];

  return {
    slides,
    objectives,
    quiz,
    resources,
  };
}

function buildFallbackResult(context: LearningContext, reason: string): GenerationResult {
  console.warn("[Generate Content] Fallback content 사용:", reason);

  const data = buildFallbackContent({
    topic: {
      title: context.topic.title,
      goal: context.topic.goal,
      level: context.topic.level,
      description: context.topic.description,
    },
    current: {
      title: context.curriculum.title,
      description: context.curriculum.description,
      estimatedTime: context.curriculum.estimatedTime,
    },
    previous: context.previous
      ? { title: context.previous.title, description: context.previous.description }
      : null,
    dayNumber: context.dayNumber,
  });

  return {
    data,
    aiProvider: "Local",
    aiModel: FALLBACK_MODEL_NAME,
    reason,
  };
}

function extractSavedContent(curriculum: CurriculumRecord): LearningContentPayload | null {
  const rawSlides = (curriculum as any).content;
  if (!rawSlides || typeof rawSlides !== "string" || !rawSlides.trim()) {
    return null;
  }

  try {
    const slides = JSON.parse(rawSlides);
    if (!Array.isArray(slides) || slides.length === 0) {
      return null;
    }

    const objectives = curriculum.objectives ? JSON.parse(curriculum.objectives) : [];
    const quiz = curriculum.exercises ? JSON.parse(curriculum.exercises) : [];
    const resources = (curriculum as any).resources
      ? JSON.parse((curriculum as any).resources)
      : [];

    return {
      slides,
      objectives,
      quiz,
      resources,
    };
  } catch (error) {
    console.warn("[Generate Content] Saved content parse error:", error);
    return null;
  }
}

async function saveLearningContent(curriculumId: string, data: LearningContentPayload) {
  const slidesStr = JSON.stringify(data.slides);
  const objectivesStr = JSON.stringify(Array.isArray(data.objectives) ? data.objectives : []);
  const quizStr = data.quiz?.length ? JSON.stringify(data.quiz) : null;
  const resourcesStr = data.resources?.length ? JSON.stringify(data.resources) : null;

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

function validatePayload(data: any) {
  if (!data || typeof data !== "object") {
    throw new Error("AI 응답이 객체 형태가 아닙니다");
  }

  if (!Array.isArray(data.slides) || data.slides.length === 0) {
    throw new Error("AI 응답에 slides 배열이 없습니다");
  }

  data.slides.forEach((slide: any, index: number) => {
    if (typeof slide.title !== "string" || typeof slide.content !== "string") {
      throw new Error(`슬라이드 ${index + 1}에 title 또는 content가 없습니다`);
    }
  });

  if (data.objectives && !Array.isArray(data.objectives)) {
    throw new Error("objectives 필드는 배열이어야 합니다");
  }

  if (data.quiz) {
    if (!Array.isArray(data.quiz)) {
      throw new Error("quiz 필드가 배열이 아닙니다");
    }
    data.quiz.forEach((item: any, index: number) => {
      if (
        !item.question ||
        !Array.isArray(item.options) ||
        typeof item.answer !== "number"
      ) {
        throw new Error(`퀴즈 ${index + 1} 구조가 올바르지 않습니다`);
      }
    });
  }

  if (data.resources && !Array.isArray(data.resources)) {
    throw new Error("resources 필드는 배열이어야 합니다");
  }
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

    // Rate limiting for AI requests
    const rateLimitResult = await aiLimiter.check(`ai:${user.id}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "AI 요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const { topicId, dayNumber, force } = await req.json();
    if (!topicId || !dayNumber) {
      return NextResponse.json(
        { error: "Topic ID와 dayNumber는 필수입니다" },
        { status: 400 },
      );
    }

    await ensureGrowthContentAllowed(user.id);

    const topic = await fetchTopic(user.id, topicId);
    if (!topic) {
      return NextResponse.json({ error: "학습 주제를 찾을 수 없습니다" }, { status: 404 });
    }

    const currentCurriculum = await fetchCurriculum(topicId, dayNumber);
    if (!currentCurriculum) {
      return NextResponse.json({ error: "해당 일차 커리큘럼이 없습니다" }, { status: 404 });
    }

    const cached = extractSavedContent(currentCurriculum);
    if (!force && cached) {
      return NextResponse.json({
        slides: cached.slides,
        objectives: cached.objectives || [],
        quiz: cached.quiz || [],
        resources: cached.resources || [],
        aiProvider: "Stored",
        aiModel: (currentCurriculum as any).aiModel || CLAUDE_MODEL,
        cached: true,
      });
    }

    const previous = await fetchPreviousCurriculum(topicId, dayNumber);
    const context: LearningContext = {
      topic,
      curriculum: currentCurriculum,
      previous,
      dayNumber,
    };

    let generationResult: GenerationResult;
    const isCodeRelated =
      [context.topic.title, context.topic.description, context.curriculum.title, context.curriculum.description]
        .filter(Boolean)
        .some((t) =>
          CODE_KEYWORDS.some((kw) => String(t).toLowerCase().includes(kw.toLowerCase())),
        );

    try {
      if (isCodeRelated && process.env.CLAUDE_API_KEY) {
        // 코드 관련 수업: Claude 우선
        generationResult = await requestContentFromClaude(context, { regenerate: Boolean(force) });
      } else {
        // 일반 수업: GPT-5.1 우선
        generationResult = await requestContentFromGPT(context, { regenerate: Boolean(force) });
      }
    } catch (primaryError) {
      console.warn("[Generate Content] 1차 생성 실패, 대체 모델 시도:", primaryError);
      try {
        // 대체 모델로 재시도 (GPT ↔ Claude 전환)
        generationResult = isCodeRelated
          ? await requestContentFromGPT(context, { regenerate: Boolean(force) })
          : await requestContentFromClaude(context, { regenerate: Boolean(force) });
      } catch (secondaryError) {
        generationResult = buildFallbackResult(
          context,
          secondaryError instanceof Error ? secondaryError.message : String(secondaryError),
        );
      }
    }

    // 슬라이드 길이 상한(500단어) 강제
    const cappedData = enforceSlideLengthCap(generationResult.data, 500);

    await ensureCurriculumColumns();
    await saveLearningContent(currentCurriculum.id, cappedData);

    return NextResponse.json({
      slides: cappedData.slides,
      objectives: cappedData.objectives || [],
      quiz: cappedData.quiz || [],
      resources: cappedData.resources || [],
      aiProvider: generationResult.aiProvider,
      aiModel: generationResult.aiModel,
      fallbackReason: generationResult.reason,
    });
  } catch (error) {
    console.error("[Generate Content] Error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "학습 내용 생성에 실패했습니다",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 },
    );
  }
}
