import { NextRequest, NextResponse } from "next/server";
import { generateForTask } from "@/lib/ai-router";
import { createPromptAnalysisPrompt } from "@/lib/prompts/prompt-templates";

export interface PromptAnalysisResult {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  clarity: number; // 0-100
  specificity: number; // 0-100
  structure: number; // 0-100
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Use Claude for detailed prompt analysis
    // PROMPT_ANALYSIS automatically routes to Claude with optimal settings
    const messages = createPromptAnalysisPrompt(prompt);

    const response = await generateForTask(
      "PROMPT_ANALYSIS",
      messages,
      {
        temperature: 0.7, // Balanced for analytical tasks
        jsonMode: true
      }
    );

    const content = response.content;
    if (!content) {
      throw new Error("No content received from AI");
    }

    // Parse the JSON response
    let analysis: PromptAnalysisResult;
    try {
      analysis = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid response format from AI");
    }

    return NextResponse.json({
      analysis,
      provider: response.provider, // Show which AI was used
      model: response.model
    });
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    return NextResponse.json(
      { error: "Failed to analyze prompt" },
      { status: 500 }
    );
  }
}
