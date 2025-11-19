"use client";

import { useState } from "react";
import { Play, Loader2, Copy, Check, Sparkles, Brain, Zap, Save } from "lucide-react";
import { AIProviderBadge, isAIProvider } from "./AIProviderBadge";
import { useSession } from "next-auth/react";

interface PromptExecutorProps {
  promptId: string;
  promptText: string;
  defaultProvider?: string | null;
  defaultModel?: string | null;
}

export default function PromptExecutor({
  promptId,
  promptText,
  defaultProvider,
  defaultModel,
}: PromptExecutorProps) {
  const [userInput, setUserInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<"gpt" | "claude" | "grok" | "gemini">(
    (defaultProvider && isAIProvider(defaultProvider) ? defaultProvider : "gpt") as "gpt" | "claude" | "grok" | "gemini"
  );
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const { data: session } = useSession();

  const handleExecute = async () => {
    setIsExecuting(true);
    setResult(null);
    setExecutionTime(null);

    try {
      const response = await fetch(`/api/prompts/${promptId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInput: userInput || undefined,
          aiProvider: selectedProvider,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[PromptExecutor] Response data:", data);
        
        if (!data.result) {
          console.warn("[PromptExecutor] Empty result received");
          setResult("응답이 비어있습니다. 서버 로그를 확인해주세요.");
        } else {
          setResult(data.result);
          setExecutionTime(data.executionTime);
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: "알 수 없는 오류" }));
        const errorMessage = errorData.details 
          ? `${errorData.error}\n\n상세: ${errorData.details}`
          : errorData.error || "프롬프트 실행에 실패했습니다";
        setResult(`오류: ${errorMessage}`);
      }
    } catch (error) {
      console.error("Error executing prompt:", error);
      const errorMessage = error instanceof Error 
        ? `프롬프트 실행 중 오류가 발생했습니다: ${error.message}`
        : "프롬프트 실행 중 오류가 발생했습니다";
      setResult(errorMessage);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyResult = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveResult = async () => {
    if (!result || !session) {
      alert("로그인이 필요합니다");
      return;
    }

    try {
      // 결과를 프롬프트로 저장
      const response = await fetch("/api/prompts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: `실행 결과: ${promptText.substring(0, 50)}...`,
          prompt: result,
          isPublic: false,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert("저장에 실패했습니다");
      }
    } catch (error) {
      console.error("Error saving result:", error);
      alert("저장에 실패했습니다");
    }
  };

  // AI Provider 색상 매핑 (배경색 hex 코드)
  const getAIProviderBgColor = (provider: string): string => {
    switch (provider) {
      case "gpt":
        return "#9ca3af"; // gray-400
      case "claude":
        return "#fdba74"; // orange-300
      case "grok":
        return "#000000"; // black
      case "gemini":
        return "#4285f4"; // Google blue
      default:
        return "#d1d5db"; // gray-300
    }
  };

  return (
    <div className="card-aurora rounded-xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-foreground" />
          프롬프트 실행
        </h2>
      </div>

      {/* AI Provider Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-foreground">AI 제공자 선택</label>
        <div className="flex gap-2 flex-wrap">
          {(["gpt", "gemini", "claude", "grok"] as const).map((provider) => {
            const bgColor = getAIProviderBgColor(provider);
            const isSelected = selectedProvider === provider;
            const config = {
              gpt: { name: "GPT-5.1", icon: Sparkles, iconColor: "ai-icon-gpt" },
              gemini: { name: "Gemini", icon: Sparkles, iconColor: "ai-icon-gemini" },
              claude: { name: "Claude", icon: Brain, iconColor: "ai-icon-claude" },
              grok: { name: "Grok", icon: Zap, iconColor: "ai-icon-grok" },
            }[provider];
            const Icon = config.icon;
            
            const getSelectedStyle = () => {
              if (!isSelected) {
                return "bg-white/50 dark:bg-white/5 border-white/40 dark:border-white/20 hover:bg-white/60 dark:hover:bg-white/10 shadow-black/8 dark:shadow-black/15";
              }

              switch (provider) {
                case "gpt":
                  return "bg-gradient-to-r from-[#F3D4DB] via-[#D0DFFC] to-[#E7D5F7] dark:from-[#F3D4DB]/40 dark:via-[#D0DFFC]/40 dark:to-[#E7D5F7]/40 border-[#E7D5F7] dark:border-[#E7D5F7]/60 shadow-[#E7D5F7]/30 dark:shadow-[#D0DFFC]/40";
                case "gemini":
                  return "bg-blue-500/30 dark:bg-blue-500/20 border-blue-500/50 dark:border-blue-500/40 shadow-blue-500/20 dark:shadow-blue-500/30";
                case "claude":
                  return "bg-orange-500/30 dark:bg-orange-500/20 border-orange-500/50 dark:border-orange-500/40 shadow-orange-500/20 dark:shadow-orange-500/30";
                case "grok":
                  return "bg-black/60 dark:bg-black/40 border-black/70 dark:border-black/50 shadow-black/20 dark:shadow-black/30";
                default:
                  return "bg-white/60 dark:bg-white/10 border-white/50 dark:border-white/30 shadow-black/10 dark:shadow-black/20";
              }
            };

            const getTextColor = () => {
              if (!isSelected) return "text-foreground";

              switch (provider) {
                case "gpt":
                  return "text-black dark:text-white";
                case "gemini":
                  return "text-blue-700 dark:text-blue-300";
                case "claude":
                  return "text-orange-700 dark:text-orange-300";
                case "grok":
                  return "text-white";
                default:
                  return "text-foreground";
              }
            };

            return (
              <button
                key={provider}
                onClick={() => setSelectedProvider(provider)}
                className={`px-4 py-2 rounded-lg border-2 backdrop-blur-md transition-all flex items-center gap-2 shadow-lg ${getSelectedStyle()}`}
              >
                <Icon size={14} className={isSelected ? (provider === "grok" ? "text-white" : provider === "gemini" ? "text-blue-600 dark:text-blue-300" : config.iconColor) : config.iconColor} />
                <span className={`text-sm font-medium ${getTextColor()}`}>
                  {config.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* User Input (Optional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2 text-foreground">
          추가 입력 (선택사항)
        </label>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="프롬프트에 추가할 내용을 입력하세요 (예: 'Python으로 작성해주세요')"
          className="input-aurora w-full px-4 py-3 rounded-lg resize-none focus-visible:ring-2 focus:ring-orange-500/50"
          rows={3}
        />
      </div>

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={isExecuting}
        className="w-full px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExecuting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            실행 중...
          </>
        ) : (
          <>
            <Play className="h-5 w-5" />
            프롬프트 실행하기
          </>
        )}
      </button>

      {/* Result */}
      {result && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-foreground dark:text-white/90">실행 결과</h3>
            <div className="flex items-center gap-2">
              {executionTime && (
                <span className="text-xs text-muted-foreground dark:text-white/80">
                  {executionTime}ms
                </span>
              )}
              <button
                onClick={handleSaveResult}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm rounded-lg border-2 backdrop-blur-md transition-all shadow-lg font-medium bg-purple-200/80 dark:bg-purple-500/50 border-purple-300/60 dark:border-purple-400/70 text-purple-800 dark:text-purple-100 hover:bg-purple-200/90 dark:hover:bg-purple-500/60 shadow-purple-500/20 dark:shadow-purple-500/40"
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" />
                    저장됨
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    저장
                  </>
                )}
              </button>
              <button
                onClick={handleCopyResult}
                className="inline-flex items-center gap-1 px-4 py-2 text-sm rounded-lg border-2 backdrop-blur-md transition-all shadow-lg font-medium bg-orange-200/80 dark:bg-blue-500/50 border-orange-300/60 dark:border-blue-400/70 text-orange-800 dark:text-blue-100 hover:bg-orange-200/90 dark:hover:bg-blue-500/60 shadow-orange-500/20 dark:shadow-blue-500/40"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4" />
                    복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    복사
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-lg p-4 shadow-lg shadow-black/5 dark:shadow-black/15">
            <pre className="whitespace-pre-wrap text-sm font-mono text-foreground">
              {result}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

