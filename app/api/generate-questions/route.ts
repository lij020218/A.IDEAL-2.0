import { NextRequest, NextResponse } from "next/server";
import { GeneratedQuestion } from "@/types";
import { generateForTask } from "@/lib/ai-router";
import { createQuestionGenerationPrompt } from "@/lib/prompts/prompt-templates";

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

    // Parse the JSON response
    let questions: GeneratedQuestion[];
    try {
      console.log("[generate-questions] Parsing JSON response...");
      const parsed = JSON.parse(content);
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
        throw new Error("Invalid response format from AI");
      }

      console.log("[generate-questions] Successfully parsed", questions.length, "questions");
    } catch (parseError) {
      console.error("[generate-questions] Failed to parse AI response:", content);
      throw new Error("Invalid response format from AI");
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
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
