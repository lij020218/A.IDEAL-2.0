import { NextRequest, NextResponse } from "next/server";
import { openai, OPENAI_MODEL } from "@/lib/openai";
import { GeneratedPrompt } from "@/types";

interface Message {
  role: "assistant" | "user";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { existingPrompt, topic, conversation } = await req.json();

    if (!existingPrompt || !topic || !conversation) {
      return NextResponse.json(
        { error: "Existing prompt, topic, and conversation are required" },
        { status: 400 }
      );
    }

    // Format the conversation for context
    const conversationContext = conversation
      .map((msg: Message) => `${msg.role === "user" ? "User" : "AI"}: ${msg.content}`)
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content: `You are an expert AI prompt engineer who REFINES and IMPROVES existing AI prompts based on conversational feedback.

Your task is to:
1. Analyze the existing prompt and the conversation between the user and AI
2. Create an IMPROVED version of the prompt that:
   - Incorporates all the requirements and improvements discussed in the conversation
   - Maintains the core purpose of the original prompt
   - Adds more detail, clarity, or structure based on the conversation
   - Addresses any gaps or limitations mentioned
   - Keeps what works well in the original prompt

3. Recommend the most suitable AI tools for this refined prompt
4. Provide 3-5 practical tips for using the refined prompt effectively

Return ONLY a valid JSON object in this exact format:
{
  "prompt": "The improved AI prompt text here...",
  "recommendedTools": ["tool-id-1", "tool-id-2"],
  "tips": ["tip 1", "tip 2", "tip 3"]
}

Available tool IDs: chatgpt, claude, gemini, midjourney, dall-e, github-copilot, perplexity, stable-diffusion, eleven-labs, runway

Do not include any markdown formatting, code blocks, or explanations. Return only the raw JSON object.`,
        },
        {
          role: "user",
          content: `User's goal: "${topic}"

EXISTING PROMPT:
${existingPrompt}

CONVERSATION ABOUT IMPROVEMENTS:
${conversationContext}

Generate an improved version of the prompt that incorporates all the improvements discussed in the conversation.`,
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
    console.error("Error refining prompt:", error);
    return NextResponse.json(
      { error: "Failed to refine prompt" },
      { status: 500 }
    );
  }
}
