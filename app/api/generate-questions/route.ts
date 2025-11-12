import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { GeneratedQuestion } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { topic, existingPrompt } = await req.json();

    if (!topic || topic.trim().length === 0) {
      return NextResponse.json(
        { error: "Topic is required" },
        { status: 400 }
      );
    }

    // Different system prompt based on whether we're continuing from existing prompt
    const systemContent = existingPrompt
      ? `You are an expert AI prompt engineer. Your task is to generate exactly 5 targeted questions that will help REFINE and IMPROVE an existing AI prompt.

The user already has a prompt and wants to add more details or improve it. Your questions should:
1. Focus on aspects that might be missing or could be enhanced
2. Ask about additional requirements, edge cases, or refinements
3. Help expand or improve specific sections of the existing prompt
4. Be progressive and build upon what already exists

Return ONLY a valid JSON array of questions in this exact format:
[
  {
    "id": "q1",
    "question": "Question text here?",
    "placeholder": "Example answer...",
    "type": "text"
  }
]

Do not include any markdown formatting, code blocks, or explanations. Return only the raw JSON array.`
      : `You are an expert AI prompt engineer. Your task is to generate exactly 5 targeted questions that will help create the perfect AI prompt for a user's specific need.

The questions should be:
1. Specific and relevant to the topic
2. Designed to extract key details needed for a high-quality prompt
3. Progressive (building on each other)
4. Include questions about target audience, tone, specific requirements, constraints, and desired outcomes

Return ONLY a valid JSON array of questions in this exact format:
[
  {
    "id": "q1",
    "question": "Question text here?",
    "placeholder": "Example answer...",
    "type": "text"
  }
]

Do not include any markdown formatting, code blocks, or explanations. Return only the raw JSON array.`;

    const userContent = existingPrompt
      ? `The user wants to refine/improve this existing prompt for "${topic}":

EXISTING PROMPT:
${existingPrompt}

Generate 5 questions to help them enhance or add details to this prompt.`
      : `Generate 5 essential questions for someone who wants to: "${topic}"`;

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
    let questions: GeneratedQuestion[];
    try {
      questions = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      throw new Error("Invalid response format from AI");
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
