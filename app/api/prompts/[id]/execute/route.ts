import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    const { userInput, aiProvider } = await req.json();

    // Get prompt
    const prompt = await prisma.prompt.findUnique({
      where: { id: params.id },
    });

    if (!prompt) {
      return NextResponse.json(
        { error: "프롬프트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Build messages
    if (!prompt.prompt || prompt.prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "프롬프트 내용이 비어있습니다" },
        { status: 400 }
      );
    }

    // 프롬프트 최적화: 응답 속도 향상을 위해
    // 1. 프롬프트가 너무 길면 핵심만 추출하거나 요약
    // 2. 응답 길이 제한 지시 추가
    let optimizedPrompt = prompt.prompt;
    
    // 프롬프트가 2000자 이상이면 응답 길이 제한 지시 추가
    if (optimizedPrompt.length > 2000) {
      console.log("[Prompt Execute] Long prompt detected, adding response length limit");
      optimizedPrompt = `${optimizedPrompt}\n\n[중요] 응답은 간결하고 핵심만 포함하여 최대 500단어로 제한하세요.`;
    } else {
      // 짧은 프롬프트에도 간결성 지시 추가 (응답 속도 향상)
      optimizedPrompt = `${optimizedPrompt}\n\n[지시] 응답은 간결하고 핵심만 포함하세요.`;
    }

    const messages: UnifiedMessage[] = [
      {
        role: "system",
        content: optimizedPrompt,
      },
    ];

    if (userInput && userInput.trim().length > 0) {
      messages.push({
        role: "user",
        content: userInput.trim(),
      });
    }

    // Determine AI provider
    let provider: "gpt" | "claude" | "grok" | "gemini" = "gpt";
    if (aiProvider) {
      provider = aiProvider as "gpt" | "claude" | "grok" | "gemini";
    } else if (prompt.aiProvider) {
      provider = prompt.aiProvider as "gpt" | "claude" | "grok" | "gemini";
    }

    // Execute prompt
    // Note: GPT-5는 항상 temperature 1로 고정되며, max_tokens는 설정하지 않음
    console.log("[Prompt Execute] Starting execution");
    console.log("[Prompt Execute] Provider:", provider);
    console.log("[Prompt Execute] Messages count:", messages.length);
    console.log("[Prompt Execute] First message role:", messages[0]?.role);
    console.log("[Prompt Execute] First message length:", messages[0]?.content?.length || 0);
    
    const startTime = Date.now();
    try {
      // 프롬프트 실행 시 응답 시간 단축을 위한 최적화:
      // 1. 프롬프트 최적화 (이미 위에서 수행)
      // 2. max_tokens 설정 (Claude/Grok만, GPT-5는 일단 제외)
      // 3. 프롬프트 길이에 따라 동적으로 조정
      
      // 프롬프트 길이에 따라 max_tokens 조정
      const promptLength = messages[0]?.content?.length || 0;
      console.log("[Prompt Execute] Prompt length:", promptLength);
      
      // GPT-5는 일단 max_completion_tokens를 사용하지 않음 (에러 방지)
      // 대신 프롬프트 최적화로 응답 길이 제한
      // Claude나 Grok이 없으면 자동으로 GPT로 폴백됨
      let response;
      try {
        response = await generateWithAI(provider, messages, {
          // temperature 옵션은 GPT-5에서는 무시됨 (항상 1로 고정)
          // Claude, Grok, Gemini를 사용할 때만 적용됨
          ...(provider !== "gpt" && { temperature: 0.7 }),
          // GPT-5는 max_completion_tokens를 사용하지 않음 (응답 시간은 길어질 수 있음)
          // Claude, Grok, Gemini만 max_tokens 설정
          ...(provider === "claude" && { maxTokens: 8192 }),
          ...(provider === "grok" && { maxTokens: 3072 }),
          ...(provider === "gemini" && { maxTokens: 8192 }),
        });
        console.log("[Prompt Execute] Generated with provider:", response.provider);
      } catch (aiError) {
        console.error("[Prompt Execute] AI generation error:", aiError);
        // Grok, Claude, Gemini가 실패하면 GPT로 폴백
        if (provider === "grok" || provider === "claude" || provider === "gemini") {
          console.log("[Prompt Execute] Retrying with GPT as fallback...");
          response = await generateWithAI("gpt", messages, {
            temperature: 1, // GPT-5는 항상 1로 고정
          });
          console.log("[Prompt Execute] Fallback to GPT successful");
        } else {
          throw aiError;
        }
      }
      const executionTime = Date.now() - startTime;
      
      console.log("[Prompt Execute] Success");
      console.log("[Prompt Execute] Response length:", response.content?.length || 0);
      console.log("[Prompt Execute] Response content preview:", response.content?.substring(0, 100) || "EMPTY");
      console.log("[Prompt Execute] Execution time:", executionTime, "ms");

      // 응답이 비어있는지 확인
      if (!response.content || response.content.trim().length === 0) {
        console.error("[Prompt Execute] Empty response content!");
        console.error("[Prompt Execute] Full response object:", JSON.stringify(response, null, 2));
        return NextResponse.json(
          { 
            error: "AI 응답이 비어있습니다",
            details: "응답을 받았지만 내용이 없습니다. 프롬프트를 확인하거나 다시 시도해주세요."
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        result: response.content,
        provider: response.provider,
        model: response.model,
        executionTime,
      });
    } catch (aiError) {
      console.error("[Prompt Execute] AI generation error:", aiError);
      if (aiError instanceof Error) {
        console.error("[Prompt Execute] AI error message:", aiError.message);
        console.error("[Prompt Execute] AI error stack:", aiError.stack);
      }
      // AI 에러를 더 자세히 반환
      return NextResponse.json(
        { 
          error: "AI 응답 생성 중 오류가 발생했습니다",
          details: process.env.NODE_ENV === "development" 
            ? (aiError instanceof Error ? aiError.message : String(aiError))
            : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[Prompt Execute] Unexpected error:", error);
    if (error instanceof Error) {
      console.error("[Prompt Execute] Error message:", error.message);
      console.error("[Prompt Execute] Error stack:", error.stack);
      return NextResponse.json(
        { 
          error: "프롬프트 실행 중 오류가 발생했습니다",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: "프롬프트 실행 중 오류가 발생했습니다",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

