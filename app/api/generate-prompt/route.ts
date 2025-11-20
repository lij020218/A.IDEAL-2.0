import { NextRequest, NextResponse } from "next/server";
import { PromptGenerationRequest, GeneratedPrompt } from "@/types";
import { generateForTask } from "@/lib/ai-router";
import { createPromptGenerationPrompt } from "@/lib/prompts/prompt-templates";

/**
 * Robust JSON parser that handles common AI response formats:
 * - JSON wrapped in markdown code blocks (```json ... ```)
 * - JSON with explanatory text before/after
 * - Multiple JSON formats (array or object with questions property)
 */
function parseAIJsonResponse(content: string): any {
  console.log("[parseAIJsonResponse] Original content:", content);

  // Step 1: Try to extract JSON from markdown code blocks
  const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    console.log("[parseAIJsonResponse] Found markdown code block, extracting...");
    content = codeBlockMatch[1].trim();
  }

  // Step 2: Find JSON object or array in the content
  // Look for the first { or [ and the last } or ]
  const jsonStart = Math.min(
    content.indexOf('{') !== -1 ? content.indexOf('{') : Infinity,
    content.indexOf('[') !== -1 ? content.indexOf('[') : Infinity
  );

  const jsonEnd = Math.max(
    content.lastIndexOf('}'),
    content.lastIndexOf(']')
  );

  if (jsonStart !== Infinity && jsonEnd !== -1 && jsonStart < jsonEnd) {
    console.log("[parseAIJsonResponse] Extracting JSON from position", jsonStart, "to", jsonEnd);
    content = content.substring(jsonStart, jsonEnd + 1);
  }

  console.log("[parseAIJsonResponse] Cleaned content:", content);

  // Step 3: Parse the JSON
  return JSON.parse(content);
}

export async function POST(req: NextRequest) {
  try {
    const { topic, answers, existingPrompt }: PromptGenerationRequest & { existingPrompt?: string } = await req.json();

    if (!topic || !answers) {
      return NextResponse.json(
        { error: "Topic and answers are required" },
        { status: 400 }
      );
    }

    // Use the optimized multi-AI router
    // PROMPT_GENERATION automatically routes to GPT-5
    // GPT-5는 항상 temperature 1로 고정, max_tokens는 설정하지 않음
    const messages = createPromptGenerationPrompt(topic, answers, existingPrompt);

    const response = await generateForTask(
      "PROMPT_GENERATION",
      messages,
      {
        // temperature는 GPT-5에서 무시됨 (항상 1로 고정)
        jsonMode: true
      }
    );

    const content = response.content;
    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse the JSON response with robust error handling
    let result: GeneratedPrompt;
    try {
      result = parseAIJsonResponse(content);
    } catch (parseError) {
      console.error("[generate-prompt] Failed to parse AI response");
      console.error("[generate-prompt] Parse error:", parseError);
      console.error("[generate-prompt] Original content:", content);
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Failed to parse AI response: ${errorMsg}`);
    }

    return NextResponse.json({
      ...result,
      aiProvider: response.provider,
      aiModel: response.model
    });
  } catch (error) {
    console.error("[generate-prompt] Error:", error);
    if (error instanceof Error) {
      console.error("[generate-prompt] Error message:", error.message);
      console.error("[generate-prompt] Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to generate prompt",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
