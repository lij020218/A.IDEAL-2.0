import { NextRequest, NextResponse } from "next/server";
import { GeneratedQuestion } from "@/types";
import { generateForTask } from "@/lib/ai-router";
import { createQuestionGenerationPrompt } from "@/lib/prompts/prompt-templates";

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
    console.log("[generate-questions] Request received");
    const { topic, existingPrompt } = await req.json();
    console.log("[generate-questions] Topic:", topic);
    console.log("[generate-questions] Existing prompt:", existingPrompt ? "Yes" : "No");

    if (!topic || topic.trim().length === 0) {
      console.log("[generate-questions] Error: Topic is empty");
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Use the optimized multi-AI router
    // QUESTION_GENERATION automatically routes to GPT-5
    // GPT-5는 항상 temperature 1로 고정, max_tokens는 설정하지 않음
    console.log("[generate-questions] Creating prompt messages...");
    const messages = createQuestionGenerationPrompt(topic, existingPrompt);
    console.log("[generate-questions] Messages created, calling AI...");

    const response = await generateForTask(
      "QUESTION_GENERATION",
      messages,
      {
        // temperature는 GPT-5에서 무시됨 (항상 1로 고정)
        jsonMode: true
      }
    );

    console.log("[generate-questions] AI response received");
    console.log("[generate-questions] Provider:", response.provider);
    console.log("[generate-questions] Model:", response.model);
    console.log("[generate-questions] Content length:", response.content?.length || 0);

    const content = response.content;
    if (!content) {
      console.log("[generate-questions] Error: No content in response");
      throw new Error("No content received from AI");
    }

    // Parse the JSON response with robust error handling
    let questions: GeneratedQuestion[];
    try {
      console.log("[generate-questions] Parsing JSON response...");
      const parsed = parseAIJsonResponse(content);
      console.log("[generate-questions] Parsed type:", typeof parsed);
      console.log("[generate-questions] Is array:", Array.isArray(parsed));
      console.log("[generate-questions] Parsed data:", JSON.stringify(parsed, null, 2));

      // Handle both array and object with questions property
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed.questions && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      } else {
        console.error("[generate-questions] Unexpected format - not an array or object with questions array");
        console.error("[generate-questions] Full response:", content);
        throw new Error("Invalid response format from AI: expected array or object with questions property");
      }

      console.log("[generate-questions] Successfully parsed", questions.length, "questions");
    } catch (parseError) {
      console.error("[generate-questions] Failed to parse AI response");
      console.error("[generate-questions] Parse error:", parseError);
      console.error("[generate-questions] Original content:", content);
      const errorMsg = parseError instanceof Error ? parseError.message : String(parseError);
      throw new Error(`Failed to parse AI response: ${errorMsg}`);
    }

    return NextResponse.json({
      questions,
      aiProvider: response.provider,
      aiModel: response.model
    });
  } catch (error) {
    console.error("[generate-questions] Error:", error);
    if (error instanceof Error) {
      console.error("[generate-questions] Error message:", error.message);
      console.error("[generate-questions] Error stack:", error.stack);
    }
    return NextResponse.json(
      {
        error: "Failed to generate questions",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined,
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    );
  }
}
