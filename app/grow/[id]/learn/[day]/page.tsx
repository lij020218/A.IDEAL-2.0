"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Play,
  CheckCircle2,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Slide {
  title: string;
  content: string;
}

interface Quiz {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Curriculum {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  estimatedTime: number;
}

export default function LearnSessionPage({
  params,
}: {
  params: { id: string; day: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Data states
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [quiz, setQuiz] = useState<Quiz[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [aiProvider, setAiProvider] = useState<string>("");
  const [aiModel, setAiModel] = useState<string>("");

  // UI states
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Chat states
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Time tracking
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router, params.id, params.day]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  const fetchData = async () => {
    try {
      const topicResponse = await fetch(`/api/growth/topics/${params.id}`);
      if (!topicResponse.ok) {
        router.push("/grow");
        return;
      }

      const topicData = await topicResponse.json();
      const dayNumber = parseInt(params.day);
      const curriculumItem = topicData.topic.curriculum.find(
        (c: any) => c.dayNumber === dayNumber
      );

      if (!curriculumItem) {
        router.push(`/grow/${params.id}`);
        return;
      }

      setCurriculum(curriculumItem);

      // Check if content already exists (previously generated)
      // content 필드가 API 응답에 포함되지 않을 수 있으므로 직접 확인
      const curriculumWithContent = curriculumItem as any;
      const existingContent = curriculumWithContent.content;
      
      console.log("[Learn Session] ========== CONTENT CHECK START ==========");
      console.log("[Learn Session] Curriculum item:", curriculumItem);
      console.log("[Learn Session] Content field:", existingContent);
      console.log("[Learn Session] Content type:", typeof existingContent);
      console.log("[Learn Session] Content exists:", !!existingContent);
      console.log("[Learn Session] Content length:", existingContent?.length || 0);
      console.log("[Learn Session] Content preview:", existingContent?.substring(0, 100) || "N/A");
      
      if (existingContent && typeof existingContent === "string" && existingContent.trim()) {
        try {
          console.log("[Learn Session] Attempting to parse saved content...");
          const savedSlides = JSON.parse(existingContent);
          const savedObjectives = curriculumItem.objectives
            ? JSON.parse(curriculumItem.objectives)
            : [];
          const savedQuiz = curriculumItem.exercises
            ? JSON.parse(curriculumItem.exercises)
            : [];
          const savedResources = curriculumWithContent.resources
            ? JSON.parse(curriculumWithContent.resources)
            : [];

          console.log("[Learn Session] Parsed slides:", savedSlides?.length || 0);
          console.log("[Learn Session] Parsed objectives:", savedObjectives?.length || 0);
          console.log("[Learn Session] Parsed quiz:", savedQuiz?.length || 0);

          // If slides exist, load them and mark session as started
          if (savedSlides && Array.isArray(savedSlides) && savedSlides.length > 0) {
            console.log("[Learn Session] ✅ Loading saved content:", savedSlides.length, "slides");
            setSlides(savedSlides);
            setObjectives(savedObjectives);
            setQuiz(savedQuiz);
            setResources(savedResources);
            // AI 정보는 저장되지 않았을 수 있으므로 기본값 사용
            setAiProvider("Stored");
            setAiModel("");
            setSessionStarted(true);
            setStartTime(Date.now());
            console.log("[Learn Session] ✅ Session started with saved content");
            console.log("[Learn Session] ========== CONTENT CHECK END (SAVED) ==========");
            return; // 저장된 내용을 불러왔으므로 여기서 종료
          } else {
            console.log("[Learn Session] ❌ Saved content is empty or invalid");
            console.log("[Learn Session] Slides array:", savedSlides);
          }
        } catch (parseError) {
          console.error("[Learn Session] ❌ Error parsing saved content:", parseError);
          console.error("[Learn Session] Content that failed to parse:", existingContent?.substring(0, 200));
          // If parsing fails, user will need to regenerate
        }
      } else {
        console.log("[Learn Session] ❌ No saved content found");
        console.log("[Learn Session] Content value:", existingContent);
      }
      console.log("[Learn Session] ========== CONTENT CHECK END (NO SAVED) ==========");
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const startSession = async () => {
    setIsGeneratingContent(true);
    setStartTime(Date.now());

    try {
      // Generate content
      const response = await fetch("/api/growth/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: params.id,
          dayNumber: parseInt(params.day),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("[Learn Session] Generated content:", data);
        setSlides(data.slides || []);
        setObjectives(data.objectives || []);
        setQuiz(data.quiz || []);
        setResources(data.resources || []);
        setAiProvider(data.aiProvider || "GPT");
        setAiModel(data.aiModel || "gpt-5.1-2025-11-13");
        setSessionStarted(true);

        // Update progress
        await fetch("/api/growth/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topicId: params.id,
            dayNumber: parseInt(params.day),
            status: "in_progress",
            timeSpent: 0,
          }),
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("[Learn Session] Error response:", response.status, errorData);
        alert(`학습 내용 생성에 실패했습니다.\n상태: ${response.status}\n에러: ${errorData.error || "알 수 없는 오류"}\n세부사항: ${errorData.details || "없음"}`);
      }
    } catch (error) {
      console.error("Error starting session:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const regenerateContent = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    try {
      const response = await fetch("/api/growth/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: params.id,
          dayNumber: parseInt(params.day),
          force: true,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setSlides(data.slides || []);
        setObjectives(data.objectives || []);
        setQuiz(data.quiz || []);
        setResources(data.resources || []);
        setAiProvider(data.aiProvider || aiProvider);
        setAiModel(data.aiModel || aiModel);
        setShowQuiz(false);
        setCurrentSlide(0);
        setSessionStarted(true);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`다시 생성에 실패했습니다.\n상태: ${response.status}\n에러: ${errorData.error || "알 수 없는 오류"}\n세부사항: ${errorData.details || "없음"}`);
      }
    } catch (error) {
      console.error("Error regenerating content:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Show quiz after last slide
      setShowQuiz(true);
    }
  };

  const prevSlide = () => {
    if (showQuiz) {
      setShowQuiz(false);
      setCurrentSlide(slides.length - 1);
    } else if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleQuizAnswer = (quizIndex: number, answerIndex: number) => {
    const newAnswers = [...quizAnswers];
    newAnswers[quizIndex] = answerIndex;
    setQuizAnswers(newAnswers);
  };

  const submitQuiz = () => {
    setShowQuizResults(true);
  };

  const completeSession = async () => {
    if (!startTime) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 60000);

    try {
      await fetch("/api/growth/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: params.id,
          dayNumber: parseInt(params.day),
          status: "completed",
          timeSpent,
          chatHistory: messages,
        }),
      });

      alert("학습을 완료했습니다! 수고하셨습니다.");
      router.push(`/grow/${params.id}`);
    } catch (error) {
      console.error("Error completing session:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/growth/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          curriculum: curriculum,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          role: "assistant",
          content: data.message,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Global Background Effects */}
        <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
        <div className="fixed inset-0 hero-grain pointer-events-none"></div>
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/grow/${params.id}`}
            className="inline-flex items-center gap-2 text-muted-foreground dark:text-white/80 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            캘린더로 돌아가기
          </Link>
        </div>

        {!sessionStarted ? (
          /* Start Screen */
          <div className="max-w-2xl mx-auto">
            <div className="card-aurora rounded-xl p-12 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#ADD8E6]/30 via-[#DDA0DD]/30 to-[#FFDAB9]/30 dark:from-[rgba(0,255,200,0.3)] dark:via-[rgba(255,0,153,0.3)] dark:to-[rgba(0,150,255,0.3)] backdrop-blur-md border-2 border-[#ADD8E6]/40 dark:border-[rgba(0,255,200,0.4)] shadow-lg shadow-[#ADD8E6]/20 dark:shadow-[rgba(0,255,200,0.2)] flex items-center justify-center">
                  {isGeneratingContent ? (
                    <Loader2 className="h-10 w-10 animate-spin text-[#ADD8E6] dark:text-[rgba(0,255,200,1)]" />
                  ) : (
                    <Play className="h-10 w-10 text-[#ADD8E6] dark:text-[rgba(0,255,200,1)]" />
                  )}
                </div>

                <div>
                  <div className="text-sm text-muted-foreground dark:text-white/80 mb-2">
                    Day {curriculum.dayNumber}
                  </div>
                  <h1 className="text-3xl font-bold mb-3 dark:text-white/90">{curriculum.title}</h1>
                  <p className="text-muted-foreground dark:text-white/80 text-lg mb-4">
                    {curriculum.description}
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground dark:text-white/80">
                    <Sparkles className="h-4 w-4" />
                    <span>약 {curriculum.estimatedTime}분 소요</span>
                  </div>
                </div>

                {isGeneratingContent ? (
                  <div className="space-y-3">
                    <p className="text-lg font-medium dark:text-white/90">AI가 학습 내용을 생성하고 있습니다...</p>
                    <div className="flex gap-2 justify-center">
                      <div className="w-2 h-2 bg-[#ADD8E6] dark:bg-[rgba(0,255,200,1)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-[#DDA0DD] dark:bg-[rgba(255,0,153,1)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-[#FFDAB9] dark:bg-[rgba(0,150,255,1)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                ) : (
                  <Button 
                    size="lg" 
                    className="gap-2 mt-4 bg-gradient-to-r from-[#ADD8E6]/40 via-[#DDA0DD]/40 to-[#FFDAB9]/40 dark:from-[rgba(0,255,200,0.4)] dark:via-[rgba(255,0,153,0.4)] dark:to-[rgba(0,150,255,0.4)] backdrop-blur-md border-2 border-[#ADD8E6]/50 dark:border-[rgba(0,255,200,0.5)] text-foreground dark:text-white hover:from-[#ADD8E6]/50 hover:via-[#DDA0DD]/50 hover:to-[#FFDAB9]/50 dark:hover:from-[rgba(0,255,200,0.5)] dark:hover:via-[rgba(255,0,153,0.5)] dark:hover:to-[rgba(0,150,255,0.5)] transition-all shadow-lg shadow-[#ADD8E6]/20 dark:shadow-[rgba(0,255,200,0.3)]" 
                    onClick={startSession}
                  >
                    <Play className="h-5 w-5" />
                    학습 시작하기
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Slides */}
            <div className="lg:col-span-2">
              <div className="card-aurora rounded-xl p-8 min-h-[600px] flex flex-col">
                {/* Regenerate toolbar */}
                <div className="flex items-center justify-end mb-4">
                  <Button
                    variant="outline"
                    className="gap-2 border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                    onClick={regenerateContent}
                    disabled={isRegenerating}
                    title="이 날의 학습 내용을 다시 생성합니다"
                  >
                    {isRegenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    다시 생성
                  </Button>
                </div>
                {!showQuiz ? (
                  /* Slide View */
                  <>
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground dark:text-white/80">
                          슬라이드 {currentSlide + 1} / {slides.length}
                        </span>
                        <div className="flex gap-2">
                          {slides.map((_, idx) => (
                            <div
                              key={idx}
                              className={`h-1.5 rounded-full transition-all ${
                                idx === currentSlide
                                  ? "w-8 bg-primary"
                                  : idx < currentSlide
                                  ? "w-1.5 bg-primary/50"
                                  : "w-1.5 bg-secondary"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <h2 className="text-2xl font-bold mb-4 dark:text-white/90">
                        {slides[currentSlide]?.title}
                      </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto prose prose-invert max-w-none prose-lg">
                      {(() => {
                        // Preprocess content to extract image descriptions
                        const raw = slides[currentSlide]?.content || '';
                        
                        // Readability formatting: keep markdown emphasis and reflow sentences into short paragraphs
                        const formatForReadability = (text: string) => {
                          // keep code blocks untouched (강조 마크다운은 유지)
                          if (/```[\s\S]*?```/.test(text)) return text;
                          // Split by sentence terminators while retaining delimiters (no lookbehind)
                          const parts = text.split(/([\.!\?…]["”']?)/);
                          const sentences: string[] = [];
                          for (let i = 0; i < parts.length; i += 2) {
                            const body = (parts[i] || "").trim();
                            const end = parts[i + 1] || "";
                            if (body) sentences.push((body + end).trim());
                          }
                          const chunks: string[] = [];
                          for (let i = 0; i < sentences.length; i += 2) {
                            const chunk = [sentences[i], sentences[i + 1]].filter(Boolean).join(" ");
                            chunks.push(chunk);
                          }
                          return chunks.join("\n\n");
                        };
                        
                        const content = formatForReadability(raw);
                        
                        // Split content by lines and process
                        const lines = content.split('\n');
                        const parts: Array<{ type: 'text' | 'image'; content: string }> = [];
                        let currentText: string[] = [];
                        
                        for (let i = 0; i < lines.length; i++) {
                          const line = lines[i];
                          // Check if line contains image description (more flexible matching)
                          const imageMatch = line.match(/이미지:\s*(.+)$/i);
                          if (imageMatch) {
                            // Save accumulated text
                            if (currentText.length > 0) {
                              parts.push({
                                type: 'text',
                                content: currentText.join('\n'),
                              });
                              currentText = [];
                            }
                            // Add image description (can span multiple lines if next lines don't start with bullet)
                            let imageDesc = imageMatch[1].trim();
                            // Check if next lines are part of image description (until bullet point or empty line)
                            let j = i + 1;
                            while (j < lines.length && lines[j].trim() && !lines[j].trim().match(/^[•\-\*]/)) {
                              imageDesc += ' ' + lines[j].trim();
                              j++;
                            }
                            if (imageDesc) {
                              parts.push({
                                type: 'image',
                                content: imageDesc.trim(),
                              });
                            }
                            // Skip lines that were part of image description
                            i = j - 1;
                          } else {
                            // Accumulate text lines
                            currentText.push(line);
                          }
                        }
                        
                        // Add remaining text
                        if (currentText.length > 0) {
                          parts.push({
                            type: 'text',
                            content: currentText.join('\n'),
                          });
                        }

                        // If no images found, render normally
                        if (parts.length === 0 || parts.every(p => p.type === 'text')) {
                          return (
                            <ReactMarkdown
                              components={{
                                ul: ({ node, ...props }) => (
                                  <ul className="space-y-3 my-4" {...props} />
                                ),
                                li: ({ node, ...props }) => (
                                  <li className="leading-relaxed" {...props} />
                                ),
                                strong: ({ node, ...props }) => (
                                  <strong className="text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded" {...props} />
                                ),
                                em: ({ node, ...props }) => (
                                  <em className="text-amber-400 font-semibold not-italic bg-amber-400/10 px-1.5 py-0.5 rounded" {...props} />
                                ),
                                code: ({ node, inline, ...props }: any) =>
                                  inline ? (
                                    <code
                                      className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm"
                                      {...props}
                                    />
                                  ) : (
                                    <code
                                      className="block bg-secondary/50 p-4 rounded-lg my-4"
                                      {...props}
                                    />
                                  ),
                                hr: ({ node, ...props }) => (
                                  <hr className="my-6 border-primary/20" {...props} />
                                ),
                                p: ({ node, ...props }) => (
                                  <p className="my-4 leading-7 tracking-wide whitespace-pre-line text-base" {...props} />
                                ),
                                blockquote: ({ node, ...props }: any) => {
                                  const content = props.children;
                                  const text = typeof content === 'string'
                                    ? content
                                    : content?.props?.children || '';
                                  const textStr = typeof text === 'string' ? text : text?.toString() || '';
                                  const isVeryShort = textStr.length < 20; // 매우 짧은 텍스트 (단어나 짧은 구)

                                  // 매우 짧은 텍스트는 인라인 강조만 (박스 없음)
                                  if (isVeryShort) {
                                    return (
                                      <span
                                        className="inline text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded"
                                        {...props}
                                      />
                                    );
                                  }

                                  // 긴 텍스트는 약간 큰 폰트와 색상으로
                                  return (
                                    <span
                                      className="inline text-base font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded"
                                      {...props}
                                    />
                                  );
                                },
                                img: ({ node, ...props }: any) => {
                                  return (
                                    <img
                                      {...props}
                                      className="my-4 rounded-lg max-w-full h-auto"
                                      alt={props.alt || ''}
                                    />
                                  );
                                },
                              }}
                            >
                              {content}
                            </ReactMarkdown>
                          );
                        }

                        // Render with image descriptions
                        return (
                          <>
                            {parts.map((part, idx) => {
                              if (part.type === 'image') {
                                return (
                                  <div
                                    key={idx}
                                    className="my-4 p-4 bg-secondary/30 rounded-lg border border-primary/20"
                                  >
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                      <span className="text-primary">🖼️</span>
                                      <span>이미지 설명</span>
                                    </div>
                                    <p className="text-base text-foreground/90 italic">
                                      {part.content}
                                    </p>
                                  </div>
                                );
                              }
                              return (
                                <ReactMarkdown
                                  key={idx}
                                  components={{
                                    ul: ({ node, ...props }) => (
                                      <ul className="space-y-3 my-4" {...props} />
                                    ),
                                    li: ({ node, ...props }) => (
                                      <li className="leading-relaxed" {...props} />
                                    ),
                                    strong: ({ node, ...props }) => (
                                      <strong className="text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded" {...props} />
                                    ),
                                    em: ({ node, ...props }) => (
                                      <em className="text-amber-400 font-semibold not-italic bg-amber-400/10 px-1.5 py-0.5 rounded" {...props} />
                                    ),
                                    code: ({ node, inline, ...props }: any) =>
                                      inline ? (
                                        <code
                                          className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm"
                                          {...props}
                                        />
                                      ) : (
                                        <code
                                          className="block bg-secondary/50 p-4 rounded-lg my-4"
                                          {...props}
                                        />
                                      ),
                                    hr: ({ node, ...props }) => (
                                      <hr className="my-6 border-primary/20" {...props} />
                                    ),
                                    p: ({ node, ...props }) => (
                                      <p className="my-4 leading-7 tracking-wide whitespace-pre-line text-base" {...props} />
                                    ),
                                    blockquote: ({ node, ...props }: any) => {
                                      const content = props.children;
                                      const text = typeof content === 'string'
                                        ? content
                                        : content?.props?.children || '';
                                      const textStr = typeof text === 'string' ? text : text?.toString() || '';
                                      const isShort = textStr.length < 100;

                                      return (
                                        <span
                                          className={`inline font-bold ${
                                            isShort
                                              ? 'text-lg text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded'
                                              : 'text-base text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded'
                                          }`}
                                          {...props}
                                        />
                                      );
                                    },
                                    img: ({ node, ...props }: any) => {
                                      return (
                                        <img
                                          {...props}
                                          className="my-4 rounded-lg max-w-full h-auto"
                                          alt={props.alt || ''}
                                        />
                                      );
                                    },
                                  }}
                                >
                                  {part.content}
                                </ReactMarkdown>
                              );
                            })}
                          </>
                        );
                      })()}
                    </div>

                    <div className="flex justify-between items-center mt-6 pt-6 border-t border-border/50 dark:border-white/10">
                      <Button
                        variant="outline"
                        onClick={prevSlide}
                        disabled={currentSlide === 0}
                        className="gap-2 border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        이전
                      </Button>
                      <Button 
                        onClick={nextSlide} 
                        className="gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                      >
                        {currentSlide === slides.length - 1 ? "퀴즈 풀기" : "다음"}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  /* Quiz View */
                  <>
                    <h2 className="text-2xl font-bold mb-6 dark:text-white/90">학습 확인 퀴즈</h2>

                    <div className="flex-1 overflow-y-auto space-y-6 mb-8">
                      {quiz.map((q, qIdx) => (
                        <div key={qIdx} className="space-y-3">
                          <p className="font-semibold dark:text-white/90">
                            {qIdx + 1}. {q.question}
                          </p>
                          <div className="space-y-2">
                            {q.options.map((option, oIdx) => (
                              <button
                                key={oIdx}
                                onClick={() => handleQuizAnswer(qIdx, oIdx)}
                                className={`w-full p-3 rounded-lg border-2 text-left transition-all backdrop-blur-md ${
                                  quizAnswers[qIdx] === oIdx
                                    ? "border-primary/60 dark:border-primary/40 bg-primary/20 dark:bg-primary/10 shadow-lg shadow-primary/20 dark:shadow-primary/30"
                                    : "border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 hover:border-primary/50 dark:hover:border-primary/30 hover:bg-white/60 dark:hover:bg-white/10 shadow-lg shadow-black/5 dark:shadow-black/15"
                                } ${
                                  showQuizResults
                                    ? oIdx === q.answer
                                      ? "border-green-500/60 dark:border-green-500/40 bg-green-500/20 dark:bg-green-500/10"
                                      : quizAnswers[qIdx] === oIdx
                                      ? "border-red-500/60 dark:border-red-500/40 bg-red-500/20 dark:bg-red-500/10"
                                      : ""
                                    : ""
                                }`}
                                disabled={showQuizResults}
                              >
                                <span className="dark:text-white/90">{option}</span>
                              </button>
                            ))}
                          </div>
                          {showQuizResults && (
                            <p className="text-sm text-muted-foreground dark:text-white/80 mt-2">
                              ✓ {q.explanation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <Button 
                          variant="outline" 
                          onClick={prevSlide} 
                          className="gap-2 border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          돌아가기
                        </Button>
                        {!showQuizResults ? (
                          <Button
                            onClick={submitQuiz}
                            disabled={quizAnswers.length !== quiz.length}
                            className="gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                          >
                            제출하기
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button 
                            onClick={completeSession} 
                            className="gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                          >
                            학습 완료
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Sidebar - AI Tutor */}
            <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
              <div className="card-aurora rounded-xl p-6 flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 dark:text-white/90">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI 튜터
                </h3>

                {/* Messages */}
                <div className="h-[450px] overflow-y-auto mb-4 space-y-3 pr-2">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground dark:text-white/80 text-sm py-8">
                      궁금한 점이 있으면 언제든 질문하세요!
                    </div>
                  )}
                  {messages.map((message, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        message.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 text-sm backdrop-blur-md ${
                          message.role === "user"
                            ? "bg-white/60 dark:bg-white/10 border border-white/40 dark:border-white/20 text-foreground dark:text-white shadow-lg shadow-black/5 dark:shadow-black/15"
                            : "bg-white/40 dark:bg-white/5 border border-white/30 dark:border-white/10 text-foreground dark:text-white/90 shadow-md shadow-black/5 dark:shadow-black/10"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))}
                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-lg p-3 shadow-md shadow-black/5 dark:shadow-black/10">
                        <Loader2 className="h-4 w-4 animate-spin dark:text-white/90" />
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="질문을 입력하세요..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={2}
                    className="resize-none text-sm input-aurora text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60"
                  />
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={!input.trim() || isSending}
                    className="flex-shrink-0 bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
