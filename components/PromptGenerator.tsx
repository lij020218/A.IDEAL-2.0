"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GeneratedQuestion, GeneratedPrompt, AIProvider } from "@/types";
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Copy, Check, Save, Wand2, MessageSquare, Rocket, GraduationCap, Users } from "lucide-react";
import { aiTools } from "@/lib/data/ai-tools";
import { useLanguage } from "@/lib/language-context";
import { AIProviderBadge, AI_PROVIDER_LABELS, isAIProvider } from "@/components/AIProviderBadge";

type Step = "topic" | "questions" | "result";

interface ExistingPromptData {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  aiProvider?: string | null;
  aiModel?: string | null;
}

interface PromptGeneratorProps {
  initialTopic?: string;
  existingPromptData?: ExistingPromptData;
  onPromptSaved?: () => void;
  onStepChange?: (step: Step) => void;
  onGeneratingChange?: (isGenerating: boolean) => void;
}

export default function PromptGenerator({ initialTopic = "", existingPromptData, onPromptSaved, onStepChange, onGeneratingChange }: PromptGeneratorProps) {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<Step>("topic");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [generatedPrompt, setGeneratedPrompt] = useState<GeneratedPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [aiProvider, setAiProvider] = useState<AIProvider | null>(null);
  const [aiModel, setAiModel] = useState<string | null>(null);
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [isIconRising, setIsIconRising] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // Notify parent component when step changes
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);

  // 프롬프트 생성 로딩 상태 확인
  const isGeneratingPrompt = isLoading && step === "questions" && currentQuestionIndex === questions.length - 1;

  // 부모에게 로딩 상태 알림 (아이콘 상승 중에도 포함)
  useEffect(() => {
    if (onGeneratingChange) {
      onGeneratingChange(isGeneratingPrompt || isIconRising);
    }
  }, [isGeneratingPrompt, isIconRising, onGeneratingChange]);

  // 아이콘 회전 애니메이션을 위한 ref와 useEffect
  const iconIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // cleanup 함수
    const cleanup = () => {
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
      if (iconIntervalRef.current) {
        clearInterval(iconIntervalRef.current);
        iconIntervalRef.current = null;
      }
    };

    if (!isGeneratingPrompt) {
      cleanup();
      setCurrentIconIndex(0);
      return;
    }

    // 첫 아이콘(Wand2)으로 시작 후 1.5초 뒤에 회전 시작
    startTimeoutRef.current = setTimeout(() => {
      // 이후 2초마다 다음 아이콘으로
      iconIntervalRef.current = setInterval(() => {
        setCurrentIconIndex((prev) => (prev + 1) % 5);
      }, 2000);
    }, 1500);

    return cleanup;
  }, [isGeneratingPrompt]);

  // Restore state from sessionStorage on mount (only if same page)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // lastPage가 /generate인 경우에만 복원 (새로고침 시)
    const lastPage = sessionStorage.getItem("lastPage");
    if (lastPage !== "/generate") {
      // 다른 페이지에서 왔다면 복원하지 않음
      return;
    }
    
    const savedState = sessionStorage.getItem("promptGeneratorState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.step === "result" && parsed.generatedPrompt) {
          setStep("result");
          setGeneratedPrompt(parsed.generatedPrompt);
          setTopic(parsed.topic || "");
          setAnswers(parsed.answers || {});
          setQuestions(parsed.questions || []);
          setAiProvider(parsed.aiProvider || null);
          setAiModel(parsed.aiModel || null);
          return; // Don't run other effects if restoring result
        }
      } catch (e) {
        console.error("Error restoring state:", e);
        sessionStorage.removeItem("promptGeneratorState");
      }
    }
  }, []);

  // Pre-fill topic when editing existing prompt
  useEffect(() => {
    if (existingPromptData) {
      setTopic(existingPromptData.topic);
    }
  }, [existingPromptData]);

  // Auto-submit when initialTopic is provided (but not when editing)
  useEffect(() => {
    if (initialTopic && initialTopic.trim() && !existingPromptData) {
      setTopic(initialTopic);
      // Automatically generate questions
      handleTopicSubmitWithValue(initialTopic);
    }
  }, [initialTopic]);

  const handleTopicSubmitWithValue = async (topicValue: string) => {
    if (!topicValue.trim()) return;

    // Check if user is logged in
    if (!session) {
      router.push("/auth/signin?message=프롬프트를 생성하려면 로그인이 필요합니다");
      return;
    }

    console.log("[PromptGenerator] Starting question generation for topic:", topicValue);
    setIsLoading(true);
    setError("");

    try {
      console.log("[PromptGenerator] Fetching questions from API...");
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicValue,
          existingPrompt: existingPromptData?.prompt
        }),
      });

      console.log("[PromptGenerator] Response status:", response.status);
      console.log("[PromptGenerator] Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[PromptGenerator] Error response:", errorData);
        throw new Error("Failed to generate questions");
      }

      const data = await response.json();
      console.log("[PromptGenerator] Received data:", data);
      console.log("[PromptGenerator] Questions count:", data.questions?.length || 0);

      if (!data.questions || data.questions.length === 0) {
        console.error("[PromptGenerator] No questions in response!");
        throw new Error("No questions received");
      }

      setQuestions(data.questions);
      setStep("questions");
      console.log("[PromptGenerator] Step changed to questions");
    } catch (err) {
      console.error("[PromptGenerator] Error:", err);
      setError(t.generate.error);
      console.error(err);
    } finally {
      setIsLoading(false);
      console.log("[PromptGenerator] Loading finished");
    }
  };

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleTopicSubmitWithValue(topic);
  };

  const handleSavePrompt = async () => {
    if (!generatedPrompt || !session) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/prompts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: existingPromptData?.id, // Include ID if editing
          topic,
          prompt: generatedPrompt.prompt,
          recommendedTools: generatedPrompt.recommendedTools,
          tips: generatedPrompt.tips,
          aiProvider,
          aiModel,
        }),
      });

      if (!response.ok) throw new Error("Failed to save prompt");

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      // Call callback if provided
      if (onPromptSaved) {
        onPromptSaved();
      }

      // Navigate to the prompt detail page after saving
      const data = await response.json();
      if (data.id) {
        router.push(`/prompt/${data.id}`);
      }
    } catch (err) {
      console.error("Error saving prompt:", err);
      setError("프롬프트 저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnswer.trim()) return;

    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({ ...answers, [currentQuestion.question]: currentAnswer });
    setCurrentAnswer("");

    // Move to next question or generate prompt
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, generate prompt
      handleGeneratePrompt();
    }
  };

  const handleGeneratePrompt = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          answers: { ...answers, [questions[currentQuestionIndex].question]: currentAnswer },
          existingPrompt: existingPromptData?.prompt
        }),
      });

      if (!response.ok) throw new Error("Failed to generate prompt");

      const data: GeneratedPrompt = await response.json();
      setGeneratedPrompt(data);
      const provider = isAIProvider(data.aiProvider) ? data.aiProvider : null;
      setAiProvider(provider);
      setAiModel(data.aiModel || null);

      // 아이콘이 Wand2로 돌아올 때까지 대기 후 상승 애니메이션
      setCurrentIconIndex(0);
      setIsIconRising(true);

      // 아이콘 상승 애니메이션 후 결과 표시
      setTimeout(() => {
        setStep("result");
        setShowResult(true);
        setIsIconRising(false);
      }, 800);
      
      // Save state to sessionStorage
      if (typeof window !== "undefined") {
        const stateToSave = {
          step: "result" as Step,
          generatedPrompt: data,
          topic,
          answers: { ...answers, [questions[currentQuestionIndex].question]: currentAnswer },
          questions,
          aiProvider: provider,
          aiModel: data.aiModel || null,
        };
        sessionStorage.setItem("promptGeneratorState", JSON.stringify(stateToSave));
      }
    } catch (err) {
      setError(t.generate.error);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const previousQuestion = questions[currentQuestionIndex - 1];
      setCurrentAnswer(answers[previousQuestion.question] || "");
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      setStep("topic");
    }
  };

  const handleCopy = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setStep("topic");
    setTopic("");
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setCurrentAnswer("");
    setAnswers({});
    setGeneratedPrompt(null);
    setError("");
    setShowResult(false);
    setIsIconRising(false);

    // Clear sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("promptGeneratorState");
    }
  };

  const recommendedToolsData = generatedPrompt?.recommendedTools
    .map((toolId) => aiTools.find((t) => t.id === toolId))
    .filter(Boolean);

  const providerLabel = aiProvider ? AI_PROVIDER_LABELS[aiProvider] : null;
  const cardClass =
    "rounded-2xl border-2 border-white/60 dark:border-white/20 bg-white/70 dark:bg-white/10 backdrop-blur-md shadow-xl shadow-black/10 dark:shadow-black/30";
  const inputClass =
    "w-full px-4 py-3 rounded-xl border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50 dark:focus:ring-[#40f8ff]/40 focus:border-white/60 dark:focus:border-white/30 transition-all";
  const secondaryButtonClass =
    "px-6 py-3 rounded-full border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-black/5 dark:shadow-black/10";

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Indicator - 로딩 중일 때 숨김 */}
      {step !== "result" && !isGeneratingPrompt && (
          <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === "topic" ? "text-foreground" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border-2 ${step === "topic" ? "bg-white/50 dark:bg-white/10 border-white/40 dark:border-white/20 text-foreground shadow-md shadow-black/5 dark:shadow-black/15" : "bg-white/30 dark:bg-white/5 border-white/30 dark:border-white/10 text-foreground"}`}>
              1
            </div>
            <span className="font-medium hidden sm:inline">{t.generate.step1}</span>
          </div>
          <div className="w-12 h-0.5 bg-white/30 dark:bg-white/10"></div>
          <div className={`flex items-center gap-2 ${step === "questions" ? "text-foreground" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border-2 ${step === "questions" ? "bg-white/50 dark:bg-white/10 border-white/40 dark:border-white/20 text-foreground shadow-md shadow-black/5 dark:shadow-black/15" : "bg-white/30 dark:bg-white/5 border-white/30 dark:border-white/10 text-foreground"}`}>
              2
            </div>
            <span className="font-medium hidden sm:inline">{t.generate.step2}</span>
          </div>
          <div className="w-12 h-0.5 bg-white/30 dark:bg-white/10"></div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md border-2 bg-white/30 dark:bg-white/5 border-white/30 dark:border-white/10 text-foreground">
              3
            </div>
            <span className="font-medium hidden sm:inline">{t.generate.step3}</span>
          </div>
        </div>
      </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Topic Input */}
      {step === "topic" && (
        <div className={`${cardClass} p-8 animate-fade-in`}>
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2 text-foreground dark:text-white/90">{t.generate.topicTitle}</h2>
            <p className="text-muted-foreground dark:text-white/80">
              {t.generate.topicSubtitle}
            </p>
          </div>

          <form onSubmit={handleTopicSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium mb-2 text-foreground dark:text-white/90">
                  {t.generate.topicLabel}
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t.generate.topicPlaceholder}
                  className={inputClass}
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !topic.trim()}
                className="w-full px-6 py-3 rounded-2xl border border-rose-200/50 bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md text-rose-500 hover:from-rose-100/80 hover:to-red-100/80 dark:from-rose-500/20 dark:to-red-500/20 dark:border-rose-400/30 dark:text-rose-400 dark:hover:from-rose-500/30 dark:hover:to-red-500/30 transition-all font-semibold shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {t.generate.generating}
                  </>
                ) : (
                  <>
                    {t.generate.continue}
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading Animation - 아이콘 드롭 후 회전 */}
      {(isGeneratingPrompt || isIconRising) && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
          {/* 아이콘 컨테이너 - 드롭/상승 애니메이션 */}
          <div className={`relative w-16 h-16 ${isIconRising ? "animate-rise-up" : "animate-drop-in"}`}>
            {/* 각 아이콘 - 현재 인덱스만 표시 */}
            {[
              // 생성하기 - Wand2
              <div key="wand" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 flex items-center justify-center shadow-lg">
                <Wand2 className="h-8 w-8 text-rose-500" />
              </div>,
              // 프롬프트 모음 - MessageSquare
              <div key="message" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100/70 to-amber-100/70 backdrop-blur-md border border-orange-200/50 flex items-center justify-center shadow-lg">
                <MessageSquare className="h-8 w-8 text-orange-500" />
              </div>,
              // 성장하기 - Rocket
              <div key="rocket" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center shadow-lg">
                <Rocket className="h-8 w-8 text-cyan-500" />
              </div>,
              // 시험 공부하기 - GraduationCap
              <div key="graduation" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100/70 to-cyan-100/70 backdrop-blur-md border border-blue-200/50 flex items-center justify-center shadow-lg">
                <GraduationCap className="h-8 w-8 text-blue-500" />
              </div>,
              // 도전자들 - Users
              <div key="users" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md border border-purple-200/50 flex items-center justify-center shadow-lg">
                <Users className="h-8 w-8 text-purple-500" />
              </div>,
            ].map((icon, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 ease-in-out ${
                  index === currentIconIndex
                    ? "opacity-100 scale-100 rotate-0"
                    : "opacity-0 scale-75 -rotate-90"
                }`}
              >
                {icon}
              </div>
            ))}
          </div>

          {!isIconRising && (
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-bold text-foreground dark:text-white/90">프롬프트 생성 중...</h3>
              <p className="text-lg text-muted-foreground dark:text-white/80">
                AI가 당신만의 프롬프트를 만들고 있어요
              </p>
            </div>
          )}

          {/* CSS 애니메이션 정의 */}
          <style jsx>{`
            @keyframes dropIn {
              0% {
                transform: translateY(-150px);
                opacity: 0;
              }
              60% {
                transform: translateY(15px);
                opacity: 1;
              }
              80% {
                transform: translateY(-5px);
              }
              100% {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes riseUp {
              0% {
                transform: translateY(0);
                opacity: 1;
              }
              100% {
                transform: translateY(-150px);
                opacity: 1;
              }
            }
            .animate-drop-in {
              animation: dropIn 0.7s ease-out forwards;
            }
            .animate-rise-up {
              animation: riseUp 0.6s ease-in forwards;
            }
          `}</style>
        </div>
      )}

      {/* Step 2: Questions */}
      {step === "questions" && questions.length > 0 && !isGeneratingPrompt && (
        <div className={`${cardClass} p-8 animate-fade-in`}>
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                질문 {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span className="text-sm font-medium text-foreground">
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-white/30 dark:bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/20 dark:border-white/10">
              <div
                className="h-full bg-white/60 dark:bg-white/20 transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleNextQuestion}>
            <div className="space-y-4">
              <div>
                <label htmlFor="currentQuestion" className="block text-lg font-semibold mb-3 text-foreground dark:text-white/90">
                  {questions[currentQuestionIndex].question}
                </label>
                {questions[currentQuestionIndex].type === "textarea" ? (
                  <textarea
                    id="currentQuestion"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={questions[currentQuestionIndex].placeholder}
                    className={`${inputClass} resize-none`}
                    rows={4}
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                ) : (
                  <input
                    id="currentQuestion"
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={questions[currentQuestionIndex].placeholder}
                    className={inputClass}
                    disabled={isLoading}
                    required
                    autoFocus
                  />
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handlePreviousQuestion}
                  disabled={isLoading}
                  className={secondaryButtonClass}
                >
                  <ArrowLeft className="h-5 w-5" />
                  {t.generate.back}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !currentAnswer.trim()}
                  className="flex-1 px-6 py-3 rounded-2xl border border-rose-200/50 bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md text-rose-500 hover:from-rose-100/80 hover:to-red-100/80 dark:from-rose-500/20 dark:to-red-500/20 dark:border-rose-400/30 dark:text-rose-400 dark:hover:from-rose-500/30 dark:hover:to-red-500/30 transition-all font-semibold shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {currentQuestionIndex === questions.length - 1 ? t.generate.creatingPrompt : "처리 중..."}
                    </>
                  ) : (
                    <>
                      {currentQuestionIndex === questions.length - 1 ? (
                        <>
                          {t.generate.generatePrompt}
                          <Sparkles className="h-5 w-5" />
                        </>
                      ) : (
                        <>
                          다음
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Result */}
      {step === "result" && generatedPrompt && (
        <div className="space-y-6 animate-fade-in">
          {/* Generated Prompt */}
          <div className={`${cardClass} p-8`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-foreground dark:text-white/90">{t.generate.yourPrompt}</h2>
                  {aiProvider && <AIProviderBadge provider={aiProvider} model={aiModel || undefined} size="sm" />}
                </div>
                {providerLabel && (
                  <p className="text-sm text-muted-foreground dark:text-white/80">
                    {aiProvider === "gpt" ? "GPT-5.1" : providerLabel}
                    {aiModel && aiProvider !== "gpt" ? ` · ${aiModel}` : ""} 모델이 생성한 프롬프트예요.
                  </p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                <button
                  onClick={handleSavePrompt}
                  disabled={isSaving || isSaved}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm rounded-lg border-2 backdrop-blur-md transition-all shadow-lg font-medium bg-purple-200/80 dark:bg-purple-500/50 border-purple-300/60 dark:border-purple-400/70 text-purple-800 dark:text-purple-100 hover:bg-purple-200/90 dark:hover:bg-purple-500/60 shadow-purple-500/20 dark:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaved ? (
                    <>
                      <Check className="h-4 w-4" />
                      저장됨
                    </>
                  ) : isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      저장
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm rounded-lg border-2 backdrop-blur-md transition-all shadow-lg font-medium bg-orange-200/80 dark:bg-blue-500/50 border-orange-300/60 dark:border-blue-400/70 text-orange-800 dark:text-blue-100 hover:bg-orange-200/90 dark:hover:bg-blue-500/60 shadow-orange-500/20 dark:shadow-blue-500/40"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      {t.generate.copied}
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      {t.generate.copy}
                    </>
                  )}
                </button>
              </div>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-white/70 dark:bg-white/10 backdrop-blur-md border-2 border-white/60 dark:border-white/20 rounded-xl p-6 shadow-xl shadow-black/10 dark:shadow-black/30 text-foreground">
              {generatedPrompt.prompt}
            </pre>
          </div>

          {/* Recommended Tools */}
          {recommendedToolsData && recommendedToolsData.length > 0 && (
            <div className={`${cardClass} p-8`}>
                <h3 className="text-xl font-bold mb-4 text-foreground dark:text-white/90">{t.generate.recommendedTools}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedToolsData.map((tool) => (
                  <a
                    key={tool!.id}
                    href={tool!.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-4 rounded-2xl border-2 border-white/60 dark:border-white/20 bg-white/70 dark:bg-white/10 backdrop-blur-md hover:border-white/70 dark:hover:border-white/30 hover:bg-white/80 dark:hover:bg-white/15 transition-all shadow-xl shadow-black/10 dark:shadow-black/30"
                  >
                    <div className="h-10 w-10 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-white/40 dark:border-white/20 text-foreground flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg shadow-black/5 dark:shadow-black/15">
                      {tool!.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground dark:text-white/90">{tool!.name}</h4>
                      <p className="text-sm text-muted-foreground dark:text-white/80 line-clamp-2">
                        {tool!.description}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {generatedPrompt.tips && generatedPrompt.tips.length > 0 && (
            <div className={`${cardClass} p-6`}>
              <h3 className="text-lg font-semibold mb-3 text-foreground dark:text-white/90">{t.generate.tips}</h3>
              <ul className="space-y-2">
                {generatedPrompt.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground dark:text-white/80">
                    • {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className={`${secondaryButtonClass} flex-1 justify-center`}
            >
              {t.generate.createAnother}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
