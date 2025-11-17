/**
 * 고급 프롬프트 엔지니어링 기법
 *
 * 통합된 베스트 프랙티스:
 * - OpenAI GPT-5: Structured prompts, Few-shot, Message roles
 * - Google Gemini: PTCF Framework, Positive patterns, Strategic prefixes
 * - Anthropic Claude: XML tags, Chain of thought, System prompts
 * - Research Papers: Self-consistency, Decomposition, Verification
 */

import { UnifiedMessage } from "../ai-router";

/**
 * Chain of Thought (CoT) 프롬프팅
 *
 * 복잡한 추론 작업에 단계별 사고 과정을 유도
 */
export function addChainOfThought(instruction: string): string {
  return `${instruction}

**Think Step by Step:**
Before providing your final answer, please:
1. Break down the problem into smaller components
2. Explain your reasoning for each step
3. Verify your logic at each stage
4. Then provide the final solution

Let's work through this systematically.`;
}

/**
 * Self-Consistency 검증
 *
 * 여러 번 생성하여 일관성 검증 (고품질 결과)
 */
export interface SelfConsistencyConfig {
  attempts: number; // 생성 횟수 (보통 3-5회)
  temperature: number; // 다양성을 위한 temperature (0.7-1.0)
}

/**
 * Gemini PTCF Framework 적용
 *
 * Persona, Task, Context, Format 구조화
 */
export interface PTCFPrompt {
  persona: string; // "You are an expert..."
  task: string; // "Your task is to..."
  context: string; // "Given this information..."
  format: string; // "Output should be..."
}

export function buildPTCFPrompt(config: PTCFPrompt): string {
  return `# Persona
${config.persona}

# Task
${config.task}

# Context
${config.context}

# Expected Format
${config.format}`;
}

/**
 * Claude XML 태그 구조화
 *
 * XML 태그로 명확한 구분과 파싱
 */
export function wrapWithXMLTags(content: string, tag: string, attributes?: Record<string, string>): string {
  const attrs = attributes
    ? " " + Object.entries(attributes).map(([key, val]) => `${key}="${val}"`).join(" ")
    : "";

  return `<${tag}${attrs}>
${content}
</${tag}>`;
}

/**
 * Response Prefilling (Claude 전용)
 *
 * 응답의 시작 부분을 미리 지정하여 방향 설정
 */
export function createPrefilledResponse(prefill: string): UnifiedMessage {
  return {
    role: "assistant",
    content: prefill,
  };
}

/**
 * 복잡한 작업 분해 (Decomposition)
 *
 * 큰 작업을 작은 단계로 나누기
 */
export interface DecomposedTask {
  steps: Array<{
    id: string;
    description: string;
    dependencies?: string[]; // 의존하는 단계 ID
  }>;
}

export function createDecompositionPrompt(task: string): string {
  return `# Task Decomposition

Break down the following complex task into smaller, manageable steps:

<task>
${task}
</task>

**Requirements:**
1. Identify all necessary sub-tasks
2. Determine dependencies between steps
3. Order steps logically
4. Provide clear success criteria for each step

**Output Format:**
Return a JSON array of steps:
\`\`\`json
[
  {
    "id": "step1",
    "description": "Clear description of what to do",
    "dependencies": [],
    "successCriteria": "How to verify completion"
  }
]
\`\`\``;
}

/**
 * Self-Criticism (자기 비판)
 *
 * 모델이 자신의 답변을 검토하고 개선
 */
export function addSelfCriticism(initialResponse: string): string {
  return `You previously provided this response:

<previous_response>
${initialResponse}
</previous_response>

Now, critically evaluate your response:

**Self-Review Checklist:**
1. **Accuracy**: Are there any factual errors or misconceptions?
2. **Completeness**: Did you address all aspects of the question?
3. **Clarity**: Is the explanation clear and easy to understand?
4. **Examples**: Would adding examples improve the response?
5. **Edge Cases**: Are there important edge cases or caveats to mention?

After your review, provide an **improved version** that addresses any identified issues.`;
}

/**
 * Positive Pattern Examples (Gemini 추천)
 *
 * 부정적 예시 대신 긍정적 예시 사용
 */
export interface PatternExample {
  input: string;
  output: string;
  explanation?: string;
}

export function createPositivePatternPrompt(
  task: string,
  goodExamples: PatternExample[],
  userInput: string
): string {
  const examplesStr = goodExamples
    .map(
      (ex, i) => `<example id="${i + 1}">
<input>${ex.input}</input>
<output>${ex.output}</output>
${ex.explanation ? `<why_this_works>${ex.explanation}</why_this_works>` : ""}
</example>`
    )
    .join("\n\n");

  return `# Task
${task}

# Examples of Excellent Outputs
These examples demonstrate the desired pattern:

${examplesStr}

# Your Task
Apply the same pattern to this input:

<user_input>
${userInput}
</user_input>`;
}

/**
 * Context Window 최적화 (Claude 200K, Gemini 1M 대응)
 *
 * 긴 컨텍스트 활용 시 최적 배치
 */
export interface LongContextStrategy {
  placement: "beginning" | "middle" | "end"; // 중요 정보 위치
  chunking?: boolean; // 청킹 사용 여부
  chunkSize?: number; // 청크 크기
}

export function optimizeLongContext(
  importantInfo: string,
  supplementaryInfo: string[],
  strategy: LongContextStrategy
): string {
  const chunks = supplementaryInfo.join("\n\n---\n\n");

  switch (strategy.placement) {
    case "beginning":
      return `# Critical Information
${importantInfo}

---

# Supporting Information
${chunks}`;

    case "end":
      return `# Supporting Information
${chunks}

---

# Critical Information (READ THIS CAREFULLY)
${importantInfo}`;

    case "middle":
    default:
      const half = Math.floor(supplementaryInfo.length / 2);
      const firstHalf = supplementaryInfo.slice(0, half).join("\n\n---\n\n");
      const secondHalf = supplementaryInfo.slice(half).join("\n\n---\n\n");

      return `# Context Part 1
${firstHalf}

---

# MOST IMPORTANT INFORMATION
${importantInfo}

---

# Context Part 2
${secondHalf}`;
  }
}

/**
 * 멀티샷 vs 제로샷 자동 선택
 *
 * 작업 복잡도에 따라 자동으로 선택
 */
export interface PromptStrategy {
  useExamples: boolean;
  exampleCount: number;
  useChainOfThought: boolean;
  useSelfConsistency: boolean;
}

export function determineStrategy(taskComplexity: "simple" | "medium" | "complex"): PromptStrategy {
  switch (taskComplexity) {
    case "simple":
      return {
        useExamples: false, // Zero-shot
        exampleCount: 0,
        useChainOfThought: false,
        useSelfConsistency: false,
      };

    case "medium":
      return {
        useExamples: true, // Few-shot
        exampleCount: 2,
        useChainOfThought: false,
        useSelfConsistency: false,
      };

    case "complex":
      return {
        useExamples: true, // Few-shot
        exampleCount: 3-5,
        useChainOfThought: true,
        useSelfConsistency: true, // 3-5번 생성 후 가장 일관된 답변 선택
      };
  }
}

/**
 * Prompt Chaining (순차적 프롬프트)
 *
 * 복잡한 작업을 여러 단계로 나누어 처리
 */
export interface ChainStep {
  id: string;
  prompt: string;
  extractOutput?: (response: string) => string; // 다음 단계로 전달할 정보 추출
}

export interface PromptChain {
  steps: ChainStep[];
  aggregateFn?: (results: string[]) => string; // 최종 결과 통합
}

/**
 * Temperature 최적화 전략
 *
 * 작업 유형별 최적 temperature
 */
export function getOptimalTemperature(taskType: string): number {
  const temperatureMap: Record<string, number> = {
    // 창의적 작업
    creative_writing: 1.0,
    brainstorming: 0.9,
    storytelling: 0.8,

    // 균형잡힌 작업
    content_generation: 0.7,
    translation: 0.5,
    summarization: 0.5,

    // 정확성 중요
    code_generation: 0.2,
    data_extraction: 0.1,
    classification: 0.0,
    math_problems: 0.0,
  };

  return temperatureMap[taskType] ?? 0.7; // 기본값
}

/**
 * 통합 프롬프트 빌더
 *
 * 모든 베스트 프랙티스를 자동으로 적용
 */
export interface AdvancedPromptConfig {
  // 작업 정의
  task: string;
  taskComplexity: "simple" | "medium" | "complex";
  taskType?: string; // temperature 최적화용

  // PTCF
  persona?: string;
  context?: string;
  format?: string;

  // 예시
  examples?: PatternExample[];

  // 고급 기법
  useChainOfThought?: boolean;
  useXMLTags?: boolean;
  useSelfCriticism?: boolean;

  // Long context
  supplementaryInfo?: string[];
  contextStrategy?: LongContextStrategy;
}

export function buildAdvancedPrompt(config: AdvancedPromptConfig): {
  messages: UnifiedMessage[];
  temperature: number;
  strategy: PromptStrategy;
} {
  const strategy = determineStrategy(config.taskComplexity);
  const temperature = config.taskType
    ? getOptimalTemperature(config.taskType)
    : 0.7;

  let mainInstruction = config.task;

  // Chain of Thought 적용
  if (strategy.useChainOfThought || config.useChainOfThought) {
    mainInstruction = addChainOfThought(mainInstruction);
  }

  // PTCF 구조 적용
  if (config.persona || config.context || config.format) {
    const ptcf: PTCFPrompt = {
      persona: config.persona || "You are an expert AI assistant.",
      task: mainInstruction,
      context: config.context || "No additional context provided.",
      format: config.format || "Provide a clear, well-structured response.",
    };
    mainInstruction = buildPTCFPrompt(ptcf);
  }

  // XML 태그로 wrapping (Claude용)
  if (config.useXMLTags) {
    if (config.examples) {
      const examplesStr = config.examples
        .map((ex, i) =>
          wrapWithXMLTags(
            `${wrapWithXMLTags(ex.input, "input")}\n${wrapWithXMLTags(ex.output, "output")}`,
            "example",
            { id: (i + 1).toString() }
          )
        )
        .join("\n\n");

      mainInstruction += `\n\n# Examples\n\n${examplesStr}`;
    }

    if (config.context) {
      mainInstruction = mainInstruction.replace(
        config.context,
        wrapWithXMLTags(config.context, "context")
      );
    }
  }

  // Long context 최적화
  if (config.supplementaryInfo && config.contextStrategy) {
    mainInstruction = optimizeLongContext(
      mainInstruction,
      config.supplementaryInfo,
      config.contextStrategy
    );
  }

  const messages: UnifiedMessage[] = [
    {
      role: "developer",
      content: mainInstruction,
    },
  ];

  return {
    messages,
    temperature,
    strategy,
  };
}
