import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { PromptGenerationRequest, GeneratedPrompt } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { topic, answers, existingPrompt }: PromptGenerationRequest & { existingPrompt?: string } = await req.json();

    if (!topic || !answers) {
      return NextResponse.json(
        { error: "Topic and answers are required" },
        { status: 400 }
      );
    }

    // Format the Q&A for the prompt
    const qaContext = Object.entries(answers)
      .map(([question, answer]) => `Q: ${question}\nA: ${answer}`)
      .join("\n\n");

    const systemContent = existingPrompt
      ? `You are an expert AI prompt engineer who REFINES and IMPROVES existing AI prompts.

Your task is to:
1. Analyze the existing prompt and the user's additional requirements
2. Create an IMPROVED version of the prompt that:
   - Incorporates the new requirements from the Q&A
   - Maintains the core purpose of the original prompt
   - Adds more detail, clarity, or structure where needed
   - Addresses any gaps or limitations in the original
   - Keeps what works well in the original prompt

3. Update tool recommendations if needed
4. Provide 3-5 practical tips for using the refined prompt

Return ONLY a valid JSON object in this exact format:
{
  "prompt": "The improved AI prompt text here...",
  "recommendedTools": ["tool-id-1", "tool-id-2"],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Available tool IDs: chatgpt, claude, gemini, midjourney, dall-e, github-copilot, perplexity, stable-diffusion, eleven-labs, runway

Do not include any markdown formatting, code blocks, or explanations. Return only the raw JSON object.`
      : `You are an expert AI prompt engineer who creates highly effective, detailed prompts for various AI tools.

Your task is to:
1. Analyze the user's topic and their answers to specific questions
2. Create a premium, production-ready AI prompt that is:
   - Clear and specific
   - Well-structured with sections
   - Includes context, requirements, and expected output format
   - Professional yet accessible
   - Optimized for best results from AI tools

3. Recommend the most suitable AI tools for this specific use case
4. Provide 3-5 practical tips for using the prompt effectively

Return ONLY a valid JSON object in this exact format:
{
  "prompt": "The full AI prompt text here...",
  "recommendedTools": ["tool-id-1", "tool-id-2"],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Available tool IDs: chatgpt, claude, gemini, midjourney, dall-e, github-copilot, perplexity, stable-diffusion, eleven-labs, runway

Do not include any markdown formatting, code blocks, or explanations. Return only the raw JSON object.`;

    const userContent = existingPrompt
      ? `User's goal: "${topic}"

EXISTING PROMPT:
${existingPrompt}

User's additional requirements for improvement:
${qaContext}

Generate an improved version of the prompt that incorporates these new requirements.`
      : `User's goal: "${topic}"

User's specific requirements:
${qaContext}

Generate a premium AI prompt based on this information.`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: systemContent,
        },
        {
          role: "user",
          content: userContent,
        },
      ],
      temperature: 1,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Parse the JSON response
    let result: GeneratedPrompt;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid response format from AI");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating prompt:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}
