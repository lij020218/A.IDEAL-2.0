import { NextRequest, NextResponse } from "next/server";
import { PromptGenerationRequest, GeneratedPrompt } from "@/types";
import { generateForTask } from "@/lib/ai-router";
import { createPromptGenerationPrompt } from "@/lib/prompts/prompt-templates";

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

    // Parse the JSON response
    let result: GeneratedPrompt;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid response format from AI");
    }

    return NextResponse.json({
      ...result,
      aiProvider: response.provider,
      aiModel: response.model
    });
  } catch (error) {
    console.error("Error generating prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
