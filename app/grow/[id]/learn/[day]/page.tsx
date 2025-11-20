"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
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
  CheckCircle2,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Rocket,
  MessageSquare,
  Wand2,
  GraduationCap,
  Users,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface Slide {
  title: string;
  content: string;
  summary?: string;
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

interface Topic {
  id: string;
  title: string;
  description: string | null;
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
  const [topic, setTopic] = useState<Topic | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [quiz, setQuiz] = useState<Quiz[]>([]);
  const [resources, setResources] = useState<string[]>([]);
  const [aiProvider, setAiProvider] = useState<string>("");
  const [aiModel, setAiModel] = useState<string>("");
  const [quizPage, setQuizPage] = useState(0);
  const QUIZ_PAGE_SIZE = 3;
  const [isAddingQuiz, setIsAddingQuiz] = useState(false);

  // 시험 공부 주제인지 확인
  const isExamTopic = topic?.description ? (() => {
    try {
      const parsed = JSON.parse(topic.description);
      return Array.isArray(parsed) && parsed.length > 0 && parsed[0].url;
    } catch {
      return false;
    }
  })() : false;

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quiz addition via chat
  const [isWaitingForQuizCount, setIsWaitingForQuizCount] = useState(false);

  // Time tracking
  const [startTime, setStartTime] = useState<number | null>(null);

  // 로딩 애니메이션 관련 state
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const iconIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 아이콘 회전 애니메이션
  useEffect(() => {
    const cleanup = () => {
      if (iconIntervalRef.current) {
        clearInterval(iconIntervalRef.current);
        iconIntervalRef.current = null;
      }
    };

    if (isGeneratingContent) {
      setCurrentIconIndex(0);
      iconIntervalRef.current = setInterval(() => {
        setCurrentIconIndex((prev) => (prev + 1) % 5);
      }, 800);
    } else {
      cleanup();
    }

    return cleanup;
  }, [isGeneratingContent]);

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
      setTopic({
        id: topicData.topic.id,
        title: topicData.topic.title,
        description: topicData.topic.description,
      });

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
            setQuizAnswers(Array((savedQuiz || []).length).fill(-1));
            setQuizPage(0);
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
        setQuizAnswers(Array((data.quiz || []).length).fill(-1));
        setQuizPage(0);
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
        setQuizAnswers(Array((data.quiz || []).length).fill(-1));
        setQuizPage(0);
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

  const handleAddQuizzes = () => {
    if (isAddingQuiz || quiz.length >= 12) return;

    // AI 튜터에게 질문하도록 메시지 추가
    const maxAddable = 12 - quiz.length;
    const tutorMessage: Message = {
      role: "assistant",
      content: `몇 문제를 추가할까요? 현재 ${quiz.length}문제가 있고, 최대 ${maxAddable}문제까지 추가할 수 있습니다. (예: "6문제" 또는 숫자만 입력)`,
    };
    setMessages(prev => [...prev, tutorMessage]);
    setIsWaitingForQuizCount(true);
  };

  const generateAdditionalQuizzes = async (count: number) => {
    if (isAddingQuiz) return;

    const actualCount = Math.min(count, 12 - quiz.length);
    if (actualCount <= 0) return;

    setIsAddingQuiz(true);
    setShowQuizResults(false);

    // AI 튜터 응답
    const processingMessage: Message = {
      role: "assistant",
      content: `${actualCount}문제를 추가 생성하고 있습니다... 잠시만 기다려주세요.`,
    };
    setMessages(prev => [...prev, processingMessage]);

    try {
      // 퀴즈만 생성하는 전용 API 사용 (빠름)
      const response = await fetch("/api/growth/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topicId: params.id,
          dayNumber: parseInt(params.day),
          existingQuizCount: quiz.length,
          additionalCount: actualCount,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const additionalQuiz = data.quiz || [];

        // 기존 퀴즈에 새 퀴즈 추가
        const mergedQuiz = [...quiz, ...additionalQuiz];
        setQuiz(mergedQuiz);
        setQuizAnswers(prev => [...prev, ...Array(additionalQuiz.length).fill(-1)]);

        // 새 퀴즈가 있는 페이지로 이동
        const newQuizPage = Math.floor(quiz.length / QUIZ_PAGE_SIZE);
        setQuizPage(newQuizPage);
        setShowQuiz(true);

        // 완료 메시지
        const completedMessage: Message = {
          role: "assistant",
          content: `✅ ${additionalQuiz.length}문제가 추가되었습니다! 총 ${mergedQuiz.length}문제가 되었어요. (${Math.ceil(mergedQuiz.length / 3)}개의 슬라이드)`,
        };
        setMessages(prev => [...prev, completedMessage]);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage: Message = {
          role: "assistant",
          content: `❌ 퀴즈 추가에 실패했습니다: ${errorData.error || "알 수 없는 오류"}`,
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error("Error adding quizzes:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "❌ 퀴즈 추가 중 오류가 발생했습니다. 다시 시도해주세요.",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAddingQuiz(false);
      setIsWaitingForQuizCount(false);
    }
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      // Show quiz after last slide
      setShowQuiz(true);
      setQuizPage(0);
      setShowQuizResults(false);
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

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    const lineHeight = 24; // approximate line height in pixels
    const maxLines = 5;
    const maxHeight = lineHeight * maxLines;
    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsSending(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // 퀴즈 추가 대기 상태일 때 숫자 파싱
    if (isWaitingForQuizCount) {
      const numberMatch = currentInput.match(/(\d+)/);
      if (numberMatch) {
        const count = parseInt(numberMatch[1]);
        const maxAddable = 12 - quiz.length;

        if (count <= 0) {
          const errorMessage: Message = {
            role: "assistant",
            content: "1 이상의 숫자를 입력해주세요.",
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsSending(false);
          return;
        }

        if (count > maxAddable) {
          const errorMessage: Message = {
            role: "assistant",
            content: `최대 ${maxAddable}문제까지만 추가할 수 있습니다. 다시 입력해주세요.`,
          };
          setMessages(prev => [...prev, errorMessage]);
          setIsSending(false);
          return;
        }

        setIsSending(false);
        generateAdditionalQuizzes(count);
        return;
      } else {
        const errorMessage: Message = {
          role: "assistant",
          content: "숫자를 입력해주세요. (예: \"6\" 또는 \"6문제\")",
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsSending(false);
        return;
      }
    }

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
    <div className={`min-h-screen ${isExamTopic ? 'bg-gradient-to-b from-blue-50/50 via-cyan-50/30 to-white' : 'bg-gradient-to-b from-cyan-50/50 via-blue-50/30 to-white'} relative`}>
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {isExamTopic ? (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
          </>
        ) : (
          <>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
            <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-sky-100/30 rounded-full blur-3xl" />
          </>
        )}
      </div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="container mx-auto px-4 py-12 max-w-7xl relative z-10">
        {!sessionStarted ? (
          /* Start Screen */
          <div className="max-w-2xl mx-auto">
            <div className="card-aurora rounded-xl p-12 text-center">
              <div className="flex flex-col items-center gap-6">
                {/* 아이콘 박스 - 로딩 중일 때 회전 애니메이션 */}
                <div className="relative w-20 h-20">
                  {isGeneratingContent ? (
                    <>
                      {/* 각 아이콘 - 현재 인덱스만 표시 */}
                      {[
                        // 첫 번째 아이콘은 주제 타입에 따라 결정
                        isExamTopic ? (
                          <div key="graduation" className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100/70 to-cyan-100/70 backdrop-blur-md border border-blue-200/50 flex items-center justify-center shadow-lg">
                            <GraduationCap className="h-10 w-10 text-blue-500" />
                          </div>
                        ) : (
                          <div key="rocket" className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center shadow-lg">
                            <Rocket className="h-10 w-10 text-cyan-500" />
                          </div>
                        ),
                        // 프롬프트 모음 - MessageSquare
                        <div key="message" className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-100/70 to-amber-100/70 backdrop-blur-md border border-orange-200/50 flex items-center justify-center shadow-lg">
                          <MessageSquare className="h-10 w-10 text-orange-500" />
                        </div>,
                        // 생성하기 - Wand2
                        <div key="wand" className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 flex items-center justify-center shadow-lg">
                          <Wand2 className="h-10 w-10 text-rose-500" />
                        </div>,
                        // 시험 공부하기 - GraduationCap
                        <div key="graduation" className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100/70 to-cyan-100/70 backdrop-blur-md border border-blue-200/50 flex items-center justify-center shadow-lg">
                          <GraduationCap className="h-10 w-10 text-blue-500" />
                        </div>,
                        // 도전자들 - Users
                        <div key="users" className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md border border-purple-200/50 flex items-center justify-center shadow-lg">
                          <Users className="h-10 w-10 text-purple-500" />
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
                    </>
                  ) : (
                    <div className={`w-20 h-20 rounded-2xl ${isExamTopic ? 'bg-gradient-to-br from-blue-100/70 to-cyan-100/70 border-blue-200/50' : 'bg-gradient-to-br from-cyan-100/70 to-blue-100/70 border-cyan-200/50'} backdrop-blur-md border flex items-center justify-center shadow-lg`}>
                      {isExamTopic ? (
                        <GraduationCap className="h-10 w-10 text-blue-500" />
                      ) : (
                        <Rocket className="h-10 w-10 text-cyan-500" />
                      )}
                    </div>
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
                  <div className="text-center space-y-2">
                    <p className="text-lg font-medium dark:text-white/90">AI가 학습 내용을 생성하고 있습니다</p>
                    <p className="text-sm text-muted-foreground dark:text-white/70">
                      약 {isExamTopic ? "3~4" : curriculum.estimatedTime >= 60 ? "3" : "2"}분 정도 소요됩니다
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={startSession}
                    className={`w-full px-6 py-4 rounded-2xl border ${isExamTopic ? 'border-blue-200/50 bg-gradient-to-br from-blue-100/70 to-cyan-100/70 text-blue-500 hover:from-blue-100/80 hover:to-cyan-100/80 dark:from-blue-500/20 dark:to-cyan-500/20 dark:border-blue-400/30 dark:text-blue-400 dark:hover:from-blue-500/30 dark:hover:to-cyan-500/30 shadow-lg shadow-blue-500/20' : 'border-cyan-200/50 bg-gradient-to-br from-cyan-100/70 to-blue-100/70 text-cyan-500 hover:from-cyan-100/80 hover:to-blue-100/80 dark:from-cyan-500/20 dark:to-blue-500/20 dark:border-cyan-400/30 dark:text-cyan-400 dark:hover:from-cyan-500/30 dark:hover:to-blue-500/30 shadow-lg shadow-cyan-500/20'} backdrop-blur-md transition-all font-semibold text-lg flex items-center justify-center gap-3`}
                  >
                    {isExamTopic ? (
                      <GraduationCap className="h-5 w-5" />
                    ) : (
                      <Rocket className="h-5 w-5" />
                    )}
                    학습 시작하기
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content - Slides */}
            <div className="lg:col-span-2">
              <div className="card-aurora rounded-xl p-8 min-h-[600px] flex flex-col">
                {/* Toolbar - 캘린더로 돌아가기 & 다시 생성 */}
                <div className="flex items-center justify-between mb-4">
                  <Link
                    href={`/grow/${params.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-muted-foreground dark:text-white/80 hover:bg-white/60 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-white transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    캘린더로 돌아가기
                  </Link>
                  <button
                    onClick={regenerateContent}
                    disabled={isRegenerating}
                    title="이 날의 학습 내용을 다시 생성합니다"
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${isExamTopic ? 'border-blue-200/50 bg-gradient-to-br from-blue-100/70 to-cyan-100/70 text-blue-500 hover:from-blue-100/80 hover:to-cyan-100/80 dark:from-blue-500/20 dark:to-cyan-500/20 dark:border-blue-400/30 dark:text-blue-400 dark:hover:from-blue-500/30 dark:hover:to-cyan-500/30 shadow-lg shadow-blue-500/20' : 'border-cyan-200/50 bg-gradient-to-br from-cyan-100/70 to-blue-100/70 text-cyan-500 hover:from-cyan-100/80 hover:to-blue-100/80 dark:from-cyan-500/20 dark:to-blue-500/20 dark:border-cyan-400/30 dark:text-cyan-400 dark:hover:from-cyan-500/30 dark:hover:to-blue-500/30 shadow-lg shadow-cyan-500/20'} backdrop-blur-md transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isRegenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    다시 생성
                  </button>
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
                                  ? isExamTopic ? "w-8 bg-blue-500" : "w-8 bg-cyan-500"
                                  : idx < currentSlide
                                  ? isExamTopic ? "w-1.5 bg-blue-500/50" : "w-1.5 bg-cyan-500/50"
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
                        // Preprocess content to extract key points
                        const raw = slides[currentSlide]?.content || '';

                        // Split content by horizontal rule (---) - more flexible matching
                        // Match --- with optional whitespace before/after and newlines
                        const hrSplit = raw.split(/\n+\s*---\s*\n+/);
                        const mainContent = hrSplit[0] || '';
                        const keyPointsSection = hrSplit.length > 1 ? hrSplit.slice(1).join('\n---\n') : '';

                        // Extract key points if they exist (look for 📌 요점 정리: with optional ** markdown)
                        let keyPoints: string[] = [];
                        let contentToRender = mainContent;

                        // More flexible matching - handle **📌 요점 정리:** or 📌 요점 정리:
                        if (keyPointsSection.includes('요점 정리') || keyPointsSection.includes('📌')) {
                          // Extract the key points content - handle both **📌 요점 정리:** and plain format
                          const keyPointsMatch = keyPointsSection.match(/\*?\*?📌\s*요점\s*정리\*?\*?[:\s]*\n([\s\S]*)/);
                          if (keyPointsMatch) {
                            const keyPointsText = keyPointsMatch[1].trim();
                            // Split by middle dot (·) or bullet points
                            keyPoints = keyPointsText
                              .split(/\n/)
                              .map(line => line.trim())
                              .filter(line => line.startsWith('·') || line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))
                              .map(line => line.replace(/^[·•\-\*]\s*/, '').trim())
                              .filter(Boolean);
                          }
                        }

                        // If no key points found in section after ---, check the whole content
                        if (keyPoints.length === 0 && raw.includes('요점 정리')) {
                          const fullMatch = raw.match(/\*?\*?📌\s*요점\s*정리\*?\*?[:\s]*\n([\s\S]*?)$/);
                          if (fullMatch) {
                            const keyPointsText = fullMatch[1].trim();
                            keyPoints = keyPointsText
                              .split(/\n/)
                              .map(line => line.trim())
                              .filter(line => line.startsWith('·') || line.startsWith('•') || line.startsWith('-') || line.startsWith('*'))
                              .map(line => line.replace(/^[·•\-\*]\s*/, '').trim())
                              .filter(Boolean);
                            // Remove key points section from main content
                            contentToRender = raw.replace(/\n+\s*---\s*\n+[\s\S]*$/, '').replace(/\n+\*?\*?📌\s*요점\s*정리\*?\*?[:\s]*\n[\s\S]*$/, '');
                          }
                        }

                        if (keyPoints.length === 0) {
                          // No key points found, render all as main content
                          contentToRender = raw;
                        }
                        
                        // Readability formatting: keep markdown emphasis and reflow sentences into short paragraphs
                        const formatForReadability = (text: string) => {
                          // keep code blocks untouched (강조 마크다운은 유지)
                          if (/```[\s\S]*?```/.test(text)) return text;
                          // Split by sentence terminators while retaining delimiters (no lookbehind)
                          const parts = text.split(/([\.!\?…][""']?)/);
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

                        const content = formatForReadability(contentToRender);

                        // Render content normally (no image processing)
                        return (
                          <>
                            <ReactMarkdown
                                components={{
                                  ul: ({ node, ...props }: any) => {
                                    const children = props.children;
                                    // 리스트 항목들을 가운뎃점으로 연결된 형태로 렌더링
                                    if (Array.isArray(children)) {
                                      const items = children.filter((child: any) => child?.type === 'li');
                                      if (items.length > 0 && items.length <= 5) {
                                        // 짧은 리스트(5개 이하)는 가운뎃점으로 연결
                                        return (
                                          <div className="my-4">
                                            <p className="text-base leading-7 text-foreground/90 dark:text-white/80">
                                              {items.map((item: any, idx: number) => {
                                                const text = typeof item.props?.children === 'string' 
                                                  ? item.props.children 
                                                  : typeof item.props?.children?.[0] === 'string'
                                                  ? item.props.children[0]
                                                  : '';
                                                return (
                                                  <span key={idx}>
                                                    {text.replace(/^[-*•]\s*/, '').trim()}
                                                    {idx < items.length - 1 && <span className="mx-2 text-primary/60 dark:text-primary/40">·</span>}
                                                  </span>
                                                );
                                              })}
                                            </p>
                                          </div>
                                        );
                                      }
                                    }
                                    // 긴 리스트나 복잡한 구조는 기본 ul 사용
                                    return <ul className="space-y-3 my-4" {...props} />;
                                  },
                                  li: ({ node, ...props }: any) => {
                                    // 기본 li 렌더링 (ul에서 처리되지 않은 경우)
                                    const children = props.children;
                                    const text = typeof children === 'string' 
                                      ? children 
                                      : typeof children?.[0] === 'string'
                                      ? children[0]
                                      : '';
                                    
                                    // 짧은 항목은 인라인으로, 긴 항목은 블록으로
                                    if (text && text.length < 100) {
                                      return (
                                        <li className="leading-relaxed inline" {...props} />
                                      );
                                    }
                                    return <li className="leading-relaxed" {...props} />;
                                  },
                                  strong: ({ node, ...props }: any) => {
                                    const content = typeof props.children === 'string' 
                                      ? props.children 
                                      : props.children?.[0] || '';
                                    
                                    // "개념: 설명" 형식인지 확인
                                    if (content && content.includes(':')) {
                                      const parts = content.split(':');
                                      if (parts.length >= 2) {
                                        const concept = parts[0].trim();
                                        const explanation = parts.slice(1).join(':').trim();
                                        // 사례/예제가 아닌 경우에만 핵심 개념으로 처리
                                        if (concept.length > 0 && explanation.length > 0 && !/^(사례|예제|예시)$/.test(concept)) {
                                          return (
                                            <div className="my-3 p-3 rounded-lg border-2 bg-sky-50/80 dark:bg-sky-900/20 border-sky-200/60 dark:border-sky-700/40 shadow-sm">
                                              <div className="text-xs font-semibold text-sky-700 dark:text-sky-300 mb-1 uppercase tracking-wide">
                                                핵심 개념
                                              </div>
                                              <div className="text-sm">
                                                <span className="text-sky-900 dark:text-sky-100 font-bold">{concept}</span>
                                                <span className="text-sky-700 dark:text-sky-200 mx-2">:</span>
                                                <span className="text-sky-800 dark:text-sky-100">{explanation}</span>
                                              </div>
                                            </div>
                                          );
                                        }
                                      }
                                    }
                                    
                                    // 일반 강조는 기본 스타일
                                    return (
                                      <strong className="text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded" {...props} />
                                    );
                                  },
                                  em: ({ node, ...props }) => (
                                    <em className="text-amber-400 font-semibold not-italic bg-amber-400/10 px-1.5 py-0.5 rounded" {...props} />
                                  ),
                                  code: ({ node, inline, ...props }: any) => {
                                    if (inline) {
                                      return (
                                        <code
                                          className="bg-primary/10 text-primary px-2 py-0.5 rounded text-sm"
                                          {...props}
                                        />
                                      );
                                    }
                                    // 코드 블록을 카드 형태로 표시
                                    const codeContent = typeof props.children === 'string' 
                                      ? props.children 
                                      : props.children?.[0] || '';
                                    return (
                                      <div className="my-4 p-4 rounded-lg border-2 bg-sky-50/80 dark:bg-sky-900/20 border-sky-200/60 dark:border-sky-700/40 shadow-sm">
                                        <div className="text-xs font-semibold text-sky-700 dark:text-sky-300 mb-2 uppercase tracking-wide">
                                          코드 예시
                                        </div>
                                        <code className="block text-sm text-sky-900 dark:text-sky-100 font-mono bg-sky-100/50 dark:bg-sky-900/30 p-2 rounded">
                                          {codeContent}
                                        </code>
                                      </div>
                                    );
                                  },
                                  hr: ({ node, ...props }) => (
                                    <hr className="my-6 border-primary/20" {...props} />
                                  ),
                                  p: ({ node, ...props }: any) => {
                                    const children = props.children;
                                    const text = typeof children === 'string' 
                                      ? children 
                                      : typeof children?.[0] === 'string'
                                      ? children[0]
                                      : '';
                                    
                                    // 가운뎃점이 있더라도 단어를 쪼개지 않도록, 불릿 형태(앞뒤 공백)일 때만 분리
                                    if (text && /\s·\s/.test(text)) {
                                      const parts = text.split(/\s·\s/);
                                      return (
                                        <p className="my-3 leading-6 tracking-wide text-sm text-foreground/90 dark:text-white/80">
                                          {parts.map((part: string, idx: number) => {
                                            const trimmed = part.trim();
                                            if (!trimmed) return null;
                                            return (
                                              <span key={idx} className="block">
                                                {idx > 0 && <span className="text-primary/60 dark:text-primary/40 mr-2">·</span>}
                                                {trimmed}
                                              </span>
                                            );
                                          })}
                                        </p>
                                      );
                                    }
                                    
                                    // 짧은 문장들이 연속되어 있을 때 가운뎃점으로 연결
                                    if (text && text.length < 200) {
                                      // 문장이 2-3개로 나뉘어 있고 짧을 때
                                      const sentences = text.split(/[\.!?…]/).filter((s: string) => s.trim().length > 10 && s.trim().length < 80);
                                      if (sentences.length >= 2 && sentences.length <= 4) {
                                        return (
                                          <p className="my-3 leading-6 tracking-wide text-sm text-foreground/90 dark:text-white/80">
                                            {sentences.map((sentence: string, idx: number) => (
                                              <span key={idx} className="block">
                                                {idx > 0 && <span className="text-primary/60 dark:text-primary/40 mr-2">·</span>}
                                                {sentence.trim()}
                                              </span>
                                            ))}
                                          </p>
                                        );
                                      }
                                    }
                                    
                                    // 기본 렌더링
                                    return <p className="my-3 leading-6 tracking-wide whitespace-pre-line text-sm" {...props} />;
                                  },
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

                                    // 긴 텍스트는 카드 형태로 표시
                                    return (
                                      <div className="my-4 p-4 rounded-lg border-2 bg-sky-50/80 dark:bg-sky-900/20 border-sky-200/60 dark:border-sky-700/40 shadow-sm">
                                        <div className="text-xs font-semibold text-sky-700 dark:text-sky-300 mb-2 uppercase tracking-wide">
                                          중요 내용
                                        </div>
                                        <div className="text-base text-sky-900 dark:text-sky-100 italic">
                                          {textStr}
                                        </div>
                                      </div>
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

                              {/* 요점 정리 섹션 - 에메랄드 카드 */}
                              {keyPoints.length > 0 && (
                                <>
                                  <hr className="my-6 border-t-2 border-primary/30 dark:border-white/20" />
                                  <div className="my-6 p-5 rounded-lg border-2 bg-emerald-50/90 dark:bg-emerald-900/20 border-emerald-300/70 dark:border-emerald-700/50 shadow-md">
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="text-lg">📌</span>
                                      <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                                        요점 정리
                                      </h3>
                                    </div>
                                    <div className="space-y-2">
                                      {keyPoints.map((point, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-sm leading-relaxed">
                                          <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">·</span>
                                          <span className="text-emerald-800 dark:text-emerald-100 flex-1">{point}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
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
                    {/* Quiz Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold dark:text-white/90">학습 확인 퀴즈</h2>
                        <p className="text-sm text-muted-foreground dark:text-white/70 mt-1">
                          총 {quiz.length}문제 · 페이지 {quizPage + 1} / {Math.ceil(quiz.length / QUIZ_PAGE_SIZE)}
                        </p>
                      </div>
                    </div>

                    {/* Quiz List - Paginated */}
                    <div className="flex-1 overflow-y-auto space-y-6 mb-8">
                      {quiz.slice(quizPage * QUIZ_PAGE_SIZE, quizPage * QUIZ_PAGE_SIZE + QUIZ_PAGE_SIZE).map((q, idx) => {
                        const absoluteIndex = quizPage * QUIZ_PAGE_SIZE + idx;
                        return (
                          <div key={absoluteIndex} className="space-y-3">
                            <p className="font-semibold dark:text-white/90">
                              {absoluteIndex + 1}. {q.question}
                            </p>
                            <div className="space-y-2">
                              {q.options.map((option, oIdx) => (
                                <button
                                  key={oIdx}
                                  onClick={() => handleQuizAnswer(absoluteIndex, oIdx)}
                                  className={`w-full p-3 rounded-lg border-2 text-left transition-all backdrop-blur-md ${
                                    quizAnswers[absoluteIndex] === oIdx
                                      ? "border-primary/60 dark:border-primary/40 bg-primary/20 dark:bg-primary/10 shadow-lg shadow-primary/20 dark:shadow-primary/30"
                                      : "border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 hover:border-primary/50 dark:hover:border-primary/30 hover:bg-white/60 dark:hover:bg-white/10 shadow-lg shadow-black/5 dark:shadow-black/15"
                                  } ${
                                    showQuizResults
                                      ? oIdx === q.answer
                                        ? "border-green-500/60 dark:border-green-500/40 bg-green-500/20 dark:bg-green-500/10"
                                        : quizAnswers[absoluteIndex] === oIdx
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
                        );
                      })}
                    </div>

                    {/* Quiz Navigation */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        {quizPage === 0 ? (
                          <Button
                            variant="outline"
                            onClick={prevSlide}
                            className="gap-2 border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            슬라이드로
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setQuizPage(quizPage - 1)}
                            className="gap-2 border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                          >
                            <ChevronLeft className="h-4 w-4" />
                            이전 페이지
                          </Button>
                        )}

                        {quizPage < Math.ceil(quiz.length / QUIZ_PAGE_SIZE) - 1 ? (
                          <Button
                            onClick={() => setQuizPage(quizPage + 1)}
                            className="gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                          >
                            다음 페이지
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        ) : !showQuizResults ? (
                          <div className="flex items-center gap-2">
                            {quiz.length < 12 && (
                              <Button
                                variant="outline"
                                onClick={handleAddQuizzes}
                                disabled={isAddingQuiz}
                                className="gap-2 border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50"
                              >
                                {isAddingQuiz ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Sparkles className="h-4 w-4" />
                                )}
                                퀴즈 추가
                              </Button>
                            )}
                            <Button
                              onClick={submitQuiz}
                              disabled={quizAnswers.some(a => a === -1)}
                              className="gap-2 bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50"
                            >
                              제출하기
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
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
                <div className="flex gap-2 items-end">
                  <Textarea
                    ref={textareaRef}
                    placeholder="질문을 입력하세요... (Shift+Enter로 줄바꿈)"
                    value={input}
                    onChange={handleTextareaChange}
                    onKeyPress={handleKeyPress}
                    rows={1}
                    className={`resize-none text-sm overflow-y-auto bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/20 focus:outline-none focus:ring-2 ${isExamTopic ? 'focus:ring-blue-500/50' : 'focus:ring-cyan-500/50'} text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60`}
                    style={{ minHeight: "48px", maxHeight: "120px" }}
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
