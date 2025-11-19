"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, FileText, Upload, X, Rocket, GraduationCap, MessageSquare, Wand2, Users } from "lucide-react";

type Step = "topic" | "questions" | "level" | "duration" | "goal" | "generating" | "exam" | "examDuration";

interface Question {
  question: string;
  context?: string;
}

export default function NewGrowthTopicPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [step, setStep] = useState<Step>("topic");
  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [level, setLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState(30);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // 로딩 애니메이션 관련 state
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const iconIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 시험 공부하기 관련 state
  const [examSubject, setExamSubject] = useState("");
  const [examDuration, setExamDuration] = useState(30);
  const [examFiles, setExamFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; filename: string; size: number }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // 아이콘 회전 애니메이션
  useEffect(() => {
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

    if (step !== "generating") {
      cleanup();
      setCurrentIconIndex(0);
      return;
    }

    // 첫 아이콘(Rocket)으로 시작 후 1.5초 뒤에 회전 시작
    startTimeoutRef.current = setTimeout(() => {
      iconIntervalRef.current = setInterval(() => {
        setCurrentIconIndex((prev) => (prev + 1) % 5);
      }, 2000);
    }, 1500);

    return cleanup;
  }, [step]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const handleTopicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/growth/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) throw new Error("Failed to generate questions");

      const data = await response.json();
      setQuestions(data.questions);
      setStep("questions");
    } catch (err) {
      console.error(err);
      setError("질문 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnswer.trim()) return;

    const currentQuestion = questions[currentQuestionIndex];
    setAnswers((prev) => ({ ...prev, [currentQuestion.question]: currentAnswer }));
    setCurrentAnswer("");

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setStep("level");
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      const prevIdx = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIdx);
      const prevQuestion = questions[prevIdx];
      setCurrentAnswer(answers[prevQuestion.question] || "");
    } else {
      setStep("topic");
    }
  };

  const handleLevelSelect = (selectedLevel: string) => {
    setLevel(selectedLevel);
    setStep("duration");
  };

  const handleDurationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (duration < 1) {
      setError("최소 1일 이상을 선택하셔야 합니다.");
      return;
    }
    if (duration > 365) {
      setError("최대 365일까지 선택 가능합니다.");
      return;
    }
    setError("");
    setStep("goal");
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setStep("generating");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/growth/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: topic,
          goal,
          level,
          duration,
          startDate: new Date().toISOString().split("T")[0],
          questionsAndAnswers: answers,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "학습 주제 생성에 실패했습니다.");
      }

      const data = await response.json();
      router.push(`/grow/${data.topic.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "학습 주제 생성에 실패했습니다.");
      setStep("duration");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");
    
    if (pdfFiles.length === 0 && files.length > 0) {
      setError("PDF 파일만 업로드 가능합니다.");
      return;
    }

    const remainingSlots = 10 - uploadedFiles.length;
    if (pdfFiles.length > remainingSlots) {
      setError(`최대 ${remainingSlots}개까지 업로드 가능합니다.`);
      return;
    }

    setExamFiles((prev) => [...prev, ...pdfFiles.slice(0, remainingSlots)]);
    setError("");
  };

  const handleRemoveFile = (index: number) => {
    setExamFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async (): Promise<Array<{ url: string; filename: string; size: number }>> => {
    if (examFiles.length === 0) return [];

    setIsUploading(true);
    setError("");

    try {
      const uploadPromises = examFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.details || `파일 업로드 실패: ${file.name}`;
          throw new Error(errorMessage);
        }

        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...results]);
      setExamFiles([]);
      return results;
    } catch (err) {
      console.error("File upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "파일 업로드에 실패했습니다.";
      setError(errorMessage);
      return [];
    } finally {
      setIsUploading(false);
    }
  };

  const handleExamFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examSubject.trim()) {
      setError("과목을 입력해주세요.");
      return;
    }

    let finalUploadedFiles = uploadedFiles;
    
    if (uploadedFiles.length === 0 && examFiles.length > 0) {
      // 아직 업로드하지 않은 파일이 있으면 먼저 업로드
      const uploaded = await handleUploadFiles();
      if (uploaded.length === 0) {
        setError("파일 업로드를 완료해주세요.");
        return;
      }
      // 업로드된 파일을 합침
      finalUploadedFiles = [...uploadedFiles, ...uploaded];
    }

    if (finalUploadedFiles.length === 0) {
      setError("최소 1개 이상의 PDF 파일을 업로드해주세요.");
      return;
    }

    setError("");
    setStep("examDuration");
  };

  const handleExamDurationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (examDuration < 1) {
      setError("최소 1일 이상을 선택하셔야 합니다.");
      return;
    }
    if (examDuration > 365) {
      setError("최대 365일까지 선택 가능합니다.");
      return;
    }
    setError("");
    handleExamSubmit();
  };

  const handleExamSubmit = async () => {
    setStep("generating");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/growth/topics/exam", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: examSubject,
          duration: examDuration,
          files: uploadedFiles.map((f) => ({
            url: f.url,
            filename: f.filename,
            size: f.size,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "시험 공부 커리큘럼 생성에 실패했습니다.");
      }

      const data = await response.json();
      router.push(`/grow/${data.topic.id}`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "시험 공부 커리큘럼 생성에 실패했습니다.");
      setStep("examDuration");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Global Background Effects */}
        <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
        <div className="fixed inset-0 hero-grain pointer-events-none"></div>
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-blue-50/30 to-white relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-sky-100/30 rounded-full blur-3xl" />
      </div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Back Button - positioned absolutely to not affect header position */}
        <div className="relative">
          <Link
            href="/grow"
            className="absolute -top-6 left-0 inline-flex items-center gap-2 text-muted-foreground hover:opacity-80 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Link>
        </div>

        {/* Header - generating 중일 때 숨김 */}
        {step !== "generating" && (
          <div className="mb-12">
            <div className="text-center">
              {(step === "exam" || step === "examDuration") ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100/70 to-cyan-100/70 backdrop-blur-md border border-blue-200/50 flex items-center justify-center shadow-lg mx-auto mb-4">
                    <GraduationCap className="h-8 w-8 text-blue-500" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="text-foreground dark:text-white/90">시험 공부하기</span>
                  </h1>
                  <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto">
                    시험 자료를 업로드하면 AI가 맞춤형 학습 계획을 만들어드립니다
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center shadow-lg mx-auto mb-4">
                    <Rocket className="h-8 w-8 text-cyan-500" />
                  </div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-4">
                    <span className="text-foreground dark:text-white/90">새 학습 시작하기</span>
                  </h1>
                  <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto">
                    3~5개의 질문에 답하면 목표·수준·기간에 딱 맞는 학습 계획이 완성됩니다
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className="max-w-3xl mx-auto">
          <div className="card-container rounded-xl p-6 md:p-8">
            {step === "topic" && (
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 dark:text-white/90">무엇을 배우고 싶으신가요?</h2>
                  <p className="text-muted-foreground dark:text-white/80">
                    배우고 싶은 주제나 해결하고 싶은 문제를 자유롭게 적어주세요.
                  </p>
                </div>

                <form onSubmit={handleTopicSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="topic" className="block text-sm font-medium mb-2 dark:text-white/90">
                        학습 주제
                      </label>
                      <input
                        id="topic"
                        type="text"
                        placeholder="예: 데이터 분석 자동화, 브랜드 마케팅 전략, UX 리서치"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        className="input-aurora w-full px-4 py-3 rounded-lg"
                        autoFocus
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!topic.trim() || isLoading}
                      className="w-full px-6 py-3 rounded-2xl border border-cyan-400 bg-gradient-to-br from-cyan-400 to-blue-400 text-white hover:from-cyan-500 hover:to-blue-500 dark:from-cyan-500 dark:to-blue-500 dark:border-cyan-400 dark:text-white dark:hover:from-cyan-600 dark:hover:to-blue-600 transition-all font-semibold shadow-lg shadow-cyan-500/40 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          질문 생성 중...
                        </>
                      ) : (
                        <>
                          다음 단계로
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md border border-red-500/40 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}

                {/* 시험 공부하기 버튼 */}
                <div className="mt-6 pt-6 border-t border-white/20 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setStep("exam")}
                    className="w-full px-6 py-3 rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-100/70 to-cyan-100/70 backdrop-blur-md text-blue-500 hover:from-blue-100/80 hover:to-cyan-100/80 dark:from-blue-500/20 dark:to-cyan-500/20 dark:border-blue-400/30 dark:text-blue-400 dark:hover:from-blue-500/30 dark:hover:to-cyan-500/30 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 font-semibold"
                  >
                    <FileText className="h-5 w-5" />
                    시험 공부하기
                  </button>
                </div>
              </div>
            )}

            {step === "exam" && (
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 dark:text-white/90">무슨 과목을 준비하시나요?</h2>
                  <p className="text-muted-foreground dark:text-white/80">
                    시험 과목과 자료를 업로드하면 AI가 맞춤형 커리큘럼을 만들어드립니다.
                  </p>
                </div>

                <form onSubmit={handleExamFileSubmit}>
                  <div className="space-y-6">
                    <div>
                      <label htmlFor="examSubject" className="block text-sm font-medium mb-2 dark:text-white/90">
                        어떤 과목인가요?
                      </label>
                      <input
                        id="examSubject"
                        type="text"
                        placeholder="예: 컴퓨터 구조, 선형대수학, 미적분학"
                        value={examSubject}
                        onChange={(e) => setExamSubject(e.target.value)}
                        className="input-aurora w-full px-4 py-3 rounded-lg"
                        autoFocus
                        required
                        disabled={isLoading || isUploading}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-white/90">
                        시험 관련 자료 업로드 (PDF 파일, 최대 10개)
                      </label>
                      <p className="text-xs text-muted-foreground dark:text-white/70 mb-3">
                        한 번에 최대 10개까지 업로드 가능하며, 나중에 추가로 업로드할 수 있습니다.
                      </p>

                      {/* 업로드된 파일 목록 */}
                      {uploadedFiles.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <p className="text-sm font-medium dark:text-white/90">업로드된 파일:</p>
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-white/50 dark:bg-white/5 rounded-lg border border-white/20 dark:border-white/10"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-cyan-500" />
                                <span className="text-sm dark:text-white/90">{file.filename}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveUploadedFile(index)}
                                disabled={isLoading || isUploading}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 선택된 파일 목록 (아직 업로드 안 함) */}
                      {examFiles.length > 0 && (
                        <div className="mb-4 space-y-2">
                          <p className="text-sm font-medium dark:text-white/90">업로드 대기 중인 파일:</p>
                          {examFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-yellow-500/10 dark:bg-yellow-500/5 rounded-lg border border-yellow-500/20 dark:border-yellow-500/10"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                <span className="text-sm dark:text-white/90">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                disabled={isLoading || isUploading}
                                className="p-1 hover:bg-red-500/20 rounded transition-colors"
                              >
                                <X className="h-4 w-4 text-red-500" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={handleUploadFiles}
                            disabled={isLoading || isUploading || examFiles.length === 0}
                            className="w-full px-4 py-2 rounded-lg border-2 border-cyan-400/60 dark:border-cyan-400/40 bg-cyan-100/20 dark:bg-cyan-500/10 backdrop-blur-md text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100/30 dark:hover:bg-cyan-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                업로드 중...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                파일 업로드 ({examFiles.length}개)
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* 파일 선택 */}
                      {uploadedFiles.length < 10 && (
                        <div>
                          <input
                            type="file"
                            id="fileInput"
                            accept=".pdf,application/pdf"
                            multiple
                            onChange={handleFileSelect}
                            disabled={isLoading || isUploading || uploadedFiles.length >= 10}
                            className="hidden"
                          />
                          <label
                            htmlFor="fileInput"
                            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                              uploadedFiles.length >= 10 || isLoading || isUploading
                                ? "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                                : "border-cyan-400/40 dark:border-cyan-400/30 bg-cyan-100/10 dark:bg-cyan-500/5 hover:bg-cyan-100/20 dark:hover:bg-cyan-500/10"
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                              <p className="mb-2 text-sm text-muted-foreground dark:text-white/80">
                                <span className="font-semibold">클릭하여 파일 선택</span> 또는 드래그 앤 드롭
                              </p>
                              <p className="text-xs text-muted-foreground dark:text-white/70">
                                PDF 파일만 가능 (최대 {10 - uploadedFiles.length}개 더 업로드 가능)
                              </p>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep("topic")}
                        disabled={isLoading || isUploading}
                        className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 flex items-center gap-2"
                      >
                        <ArrowLeft className="h-5 w-5" />
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || isUploading || !examSubject.trim() || uploadedFiles.length === 0}
                        className="flex-1 px-6 py-3 rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-100/70 to-cyan-100/70 backdrop-blur-md text-blue-500 hover:from-blue-100/80 hover:to-cyan-100/80 dark:from-blue-500/20 dark:to-cyan-500/20 dark:border-blue-400/30 dark:text-blue-400 dark:hover:from-blue-500/30 dark:hover:to-cyan-500/30 transition-all font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        다음 단계로
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md border border-red-500/40 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>
            )}

            {step === "examDuration" && (
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 dark:text-white/90">학습 기간을 선택하세요</h2>
                  <p className="text-muted-foreground dark:text-white/80">
                    일정에 맞춰 최적의 커리큘럼 속도를 조정합니다.
                  </p>
                </div>

                <form onSubmit={handleExamDurationSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-6">
                      <div className="flex items-center justify-center gap-4">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={examDuration}
                          onChange={(e) => {
                            const v = e.target.value;
                            const n = Number(v);
                            setExamDuration(Number.isNaN(n) ? 0 : n);
                          }}
                          className="input-aurora text-5xl font-bold h-24 text-center w-40"
                        />
                        <span className="text-3xl font-bold text-muted-foreground">일</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={365}
                        value={examDuration}
                        onChange={(e) => setExamDuration(Number(e.target.value))}
                        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      {error && (
                        <div className="text-red-600 dark:text-red-400 text-sm text-center">{error}</div>
                      )}
                      <div className="flex justify-between text-sm text-muted-foreground dark:text-white/80">
                        <span>1주</span>
                        <span>약 {Math.round(examDuration / 30)}개월</span>
                        <span>1년</span>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep("exam")}
                        className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2"
                      >
                        <ArrowLeft className="h-5 w-5" />
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 px-6 py-3 rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-100/70 to-cyan-100/70 backdrop-blur-md text-blue-500 hover:from-blue-100/80 hover:to-cyan-100/80 dark:from-blue-500/20 dark:to-cyan-500/20 dark:border-blue-400/30 dark:text-blue-400 dark:hover:from-blue-500/30 dark:hover:to-cyan-500/30 transition-all font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            AI로 커리큘럼 생성
                            <Sparkles className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md border border-red-500/40 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>
            )}

            {step === "questions" && questions.length > 0 && (
              <div className="animate-fade-in">
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground dark:text-white/80">
                      질문 {currentQuestionIndex + 1} / {questions.length}
                    </span>
                    <span className="text-sm font-medium text-cyan-500">
                      {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-cyan-100/30 dark:bg-cyan-500/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>

                <form onSubmit={handleNextQuestion}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="currentQuestion" className="block text-lg font-semibold mb-3 dark:text-white/90">
                        {questions[currentQuestionIndex].question}
                      </label>
                      {questions[currentQuestionIndex].context && (
                        <p className="text-sm text-muted-foreground dark:text-white/80 mb-3">
                          {questions[currentQuestionIndex].context}
                        </p>
                      )}
                      <textarea
                        id="currentQuestion"
                        placeholder="자세히 답변할수록 AI가 더 정확한 커리큘럼을 설계합니다."
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        rows={4}
                        className="input-aurora w-full px-4 py-3 rounded-lg resize-none"
                        autoFocus
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={handlePreviousQuestion}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 flex items-center gap-2"
                      >
                        <ArrowLeft className="h-5 w-5" />
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !currentAnswer.trim()}
                        className="btn-aurora flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            처리 중...
                          </>
                        ) : (
                          <>
                            {currentQuestionIndex < questions.length - 1 ? "다음" : "완료"}
                            <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {step === "level" && (
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 dark:text-white/90">어느 정도 경험이 있나요?</h2>
                  <p className="text-muted-foreground dark:text-white/80">
                    현재 수준을 선택하면 맞춤형 커리큘럼을 제공해드립니다.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { value: "beginner", label: "초급", desc: "기초부터 배우고 싶어요", emoji: "🌱" },
                      { value: "intermediate", label: "중급", desc: "기본은 알고 있어요", emoji: "🚀" },
                      { value: "advanced", label: "고급", desc: "실무 경험이 있어요", emoji: "⚡" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleLevelSelect(option.value)}
                        className={`rounded-lg border-2 p-6 text-left transition-all hover:scale-105 ${
                          level === option.value
                            ? "border-cyan-400/60 dark:border-cyan-400/40 bg-cyan-100/30 dark:bg-cyan-500/20 backdrop-blur-md shadow-lg shadow-cyan-500/20 dark:shadow-cyan-500/30"
                            : "border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:border-cyan-400/50 dark:hover:border-cyan-400/30 hover:bg-white/60 dark:hover:bg-white/10 shadow-lg shadow-black/5 dark:shadow-black/15"
                        }`}
                      >
                        <div className="text-3xl mb-2">{option.emoji}</div>
                        <p className="font-bold text-xl mb-1 dark:text-white/90">{option.label}</p>
                        <p className="text-sm text-muted-foreground dark:text-white/80">{option.desc}</p>
                      </button>
                    ))}
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => setStep("questions")}
                      className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      이전
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "duration" && (
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 dark:text-white/90">학습 기간을 선택하세요</h2>
                  <p className="text-muted-foreground dark:text-white/80">
                    일정에 맞춰 최적의 커리큘럼 속도를 조정합니다.
                  </p>
                </div>

                <form onSubmit={handleDurationSubmit}>
                  <div className="space-y-4">
                    <div className="space-y-6">
                      <div className="flex items-center justify-center gap-4">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={duration}
                          onChange={(e) => {
                            const v = e.target.value;
                            const n = Number(v);
                            setDuration(Number.isNaN(n) ? 0 : n);
                          }}
                          className="input-aurora text-5xl font-bold h-24 text-center w-40"
                        />
                        <span className="text-3xl font-bold text-muted-foreground">일</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={365}
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                        className="w-full h-2 bg-border rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      {error && (
                        <div className="text-red-600 dark:text-red-400 text-sm text-center">{error}</div>
                      )}
                      <div className="flex justify-between text-sm text-muted-foreground dark:text-white/80">
                        <span>1주</span>
                        <span>약 {Math.round(duration / 30)}개월</span>
                        <span>1년</span>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep("level")}
                        className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2"
                      >
                        <ArrowLeft className="h-5 w-5" />
                        이전
                      </button>
                      <button
                        type="submit"
                        className="btn-aurora flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
                      >
                        다음 단계로
                        <ArrowRight className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {step === "goal" && (
              <div className="animate-fade-in">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2 dark:text-white/90">어떤 결과를 기대하시나요?</h2>
                  <p className="text-muted-foreground dark:text-white/80">
                    구체적인 목표를 설정하면 더욱 효과적인 커리큘럼을 제공합니다.
                  </p>
                </div>

                <form onSubmit={handleFinalSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="goal" className="block text-sm font-medium mb-2 dark:text-white/90">
                        학습 목표
                      </label>
                      <textarea
                        id="goal"
                        value={goal}
                        onChange={(e) => setGoal(e.target.value)}
                        rows={4}
                        className="input-aurora w-full px-4 py-3 rounded-lg resize-none"
                        placeholder="예: 3개월 안에 AI 마케터 포트폴리오 2개 완성하고, 주니어 포지션에 지원할 수 있는 실력 갖추기"
                        autoFocus
                        required
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="button"
                        onClick={() => setStep("duration")}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 flex items-center gap-2"
                      >
                        <ArrowLeft className="h-5 w-5" />
                        이전
                      </button>
                      <button
                        type="submit"
                        disabled={isLoading || !goal.trim()}
                        className="btn-aurora flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            생성 중...
                          </>
                        ) : (
                          <>
                            AI로 커리큘럼 생성
                            <Sparkles className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>

                {error && (
                  <div className="mt-4 p-4 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md border border-red-500/40 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
                    {error}
                  </div>
                )}
              </div>
            )}

            {step === "generating" && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                {/* 아이콘 컨테이너 - 드롭 애니메이션 */}
                <div className="relative w-16 h-16 animate-drop-in">
                  {/* 각 아이콘 - 현재 인덱스만 표시 */}
                  {[
                    // 성장하기 - Rocket
                    <div key="rocket" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center shadow-lg">
                      <Rocket className="h-8 w-8 text-cyan-500" />
                    </div>,
                    // 프롬프트 모음 - MessageSquare
                    <div key="message" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100/70 to-amber-100/70 backdrop-blur-md border border-orange-200/50 flex items-center justify-center shadow-lg">
                      <MessageSquare className="h-8 w-8 text-orange-500" />
                    </div>,
                    // 생성하기 - Wand2
                    <div key="wand" className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 flex items-center justify-center shadow-lg">
                      <Wand2 className="h-8 w-8 text-rose-500" />
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

                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold dark:text-white/90">커리큘럼 생성 중...</h3>
                  <p className="text-lg text-muted-foreground dark:text-white/80">
                    AI가 맞춤형 학습 계획을 설계하고 있어요
                  </p>
                </div>

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
                  .animate-drop-in {
                    animation: dropIn 0.7s ease-out forwards;
                  }
                `}</style>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

