"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { GeneratedQuestion, GeneratedPrompt } from "@/types";
import { Loader2, Sparkles, ArrowRight, ArrowLeft, Copy, Check, Save } from "lucide-react";
import { aiTools } from "@/lib/data/ai-tools";
import { useLanguage } from "@/lib/language-context";

type Step = "topic" | "questions" | "result";

interface PromptGeneratorProps {
  initialTopic?: string;
  existingPrompt?: string;
  onPromptSaved?: () => void;
}

export default function PromptGenerator({ initialTopic = "", existingPrompt, onPromptSaved }: PromptGeneratorProps) {
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

  // Auto-submit when initialTopic is provided
  useEffect(() => {
    if (initialTopic && initialTopic.trim()) {
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

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topicValue,
          existingPrompt: existingPrompt
        }),
      });

      if (!response.ok) throw new Error("Failed to generate questions");

      const data = await response.json();
      setQuestions(data.questions);
      setStep("questions");
    } catch (err) {
      setError(t.generate.error);
      console.error(err);
    } finally {
      setIsLoading(false);
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
          topic,
          prompt: generatedPrompt.prompt,
          recommendedTools: generatedPrompt.recommendedTools,
          tips: generatedPrompt.tips,
        }),
      });

      if (!response.ok) throw new Error("Failed to save prompt");

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);

      // Call callback if provided
      if (onPromptSaved) {
        onPromptSaved();
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
          existingPrompt: existingPrompt
        }),
      });

      if (!response.ok) throw new Error("Failed to generate prompt");

      const data: GeneratedPrompt = await response.json();
      setGeneratedPrompt(data);
      setStep("result");
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
  };

  const recommendedToolsData = generatedPrompt?.recommendedTools
    .map((toolId) => aiTools.find((t) => t.id === toolId))
    .filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === "topic" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "topic" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              1
            </div>
            <span className="font-medium hidden sm:inline">{t.generate.step1}</span>
          </div>
          <div className="w-12 h-0.5 bg-border"></div>
          <div className={`flex items-center gap-2 ${step === "questions" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "questions" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              2
            </div>
            <span className="font-medium hidden sm:inline">{t.generate.step2}</span>
          </div>
          <div className="w-12 h-0.5 bg-border"></div>
          <div className={`flex items-center gap-2 ${step === "result" ? "text-primary" : "text-muted-foreground"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "result" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              3
            </div>
            <span className="font-medium hidden sm:inline">{t.generate.step3}</span>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      )}

      {/* Step 1: Topic Input */}
      {step === "topic" && (
        <div className="bg-card border rounded-lg p-8 animate-fade-in">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">{t.generate.topicTitle}</h2>
            <p className="text-muted-foreground">
              {t.generate.topicSubtitle}
            </p>
          </div>

          <form onSubmit={handleTopicSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="topic" className="block text-sm font-medium mb-2">
                  {t.generate.topicLabel}
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder={t.generate.topicPlaceholder}
                  className="input-aurora w-full px-4 py-3 rounded-lg"
                  disabled={isLoading}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !topic.trim()}
                className="btn-aurora w-full px-6 py-3 rounded-lg flex items-center justify-center gap-2"
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

      {/* Step 2: Questions */}
      {step === "questions" && questions.length > 0 && (
        <div className="bg-card border rounded-lg p-8 animate-fade-in">
          {/* Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                질문 {currentQuestionIndex + 1} / {questions.length}
              </span>
              <span className="text-sm font-medium text-primary">
                {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
              </span>
            </div>
            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleNextQuestion}>
            <div className="space-y-4">
              <div>
                <label htmlFor="currentQuestion" className="block text-lg font-semibold mb-3">
                  {questions[currentQuestionIndex].question}
                </label>
                {questions[currentQuestionIndex].type === "textarea" ? (
                  <textarea
                    id="currentQuestion"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder={questions[currentQuestionIndex].placeholder}
                    className="input-aurora w-full px-4 py-3 rounded-lg resize-none"
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
                    className="input-aurora w-full px-4 py-3 rounded-lg"
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
                  className="px-6 py-3 border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  {t.generate.back}
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !currentAnswer.trim()}
                  className="btn-aurora flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
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
          <div className="bg-card border rounded-lg p-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{t.generate.yourPrompt}</h2>
              <div className="flex gap-2">
                <button
                  onClick={handleSavePrompt}
                  disabled={isSaving || isSaved}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50"
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
                  className="btn-aurora px-4 py-2 rounded-lg flex items-center gap-2"
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
            <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/50 p-6 rounded-md">
              {generatedPrompt.prompt}
            </pre>
          </div>

          {/* Recommended Tools */}
          {recommendedToolsData && recommendedToolsData.length > 0 && (
            <div className="bg-card border rounded-lg p-8">
              <h3 className="text-xl font-bold mb-4">{t.generate.recommendedTools}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendedToolsData.map((tool) => (
                  <a
                    key={tool!.id}
                    href={tool!.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 p-4 border rounded-lg hover:border-primary transition-colors"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                      {tool!.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold">{tool!.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
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
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">{t.generate.tips}</h3>
              <ul className="space-y-2">
                {generatedPrompt.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-muted-foreground">
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
              className="flex-1 px-6 py-3 border rounded-lg hover:bg-secondary transition-colors"
            >
              {t.generate.createAnother}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
