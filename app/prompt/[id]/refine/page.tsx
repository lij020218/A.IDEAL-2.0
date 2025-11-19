"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Send, Loader2, Sparkles, ArrowLeft, Copy, Check, Save } from "lucide-react";
import { aiTools } from "@/lib/data/ai-tools";
import { GeneratedPrompt } from "@/types";
import { AIProviderBadge, isAIProvider, AI_PROVIDER_LABELS } from "@/components/AIProviderBadge";

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  createdAt: string;
  aiProvider?: string | null;
  aiModel?: string | null;
}

interface Message {
  role: "assistant" | "user";
  content: string;
}

export default function RefinePromptPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState<SavedPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [refinedPrompt, setRefinedPrompt] = useState<GeneratedPrompt | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (session && params.id) {
      fetchPrompt();
    } else if (!session) {
      router.push("/auth/signin");
    }
  }, [session, params.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchPrompt = async () => {
    try {
      const response = await fetch(`/api/prompts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPrompt(data);
        // Initialize conversation with AI's first message
        initializeConversation(data);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Error fetching prompt:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const initializeConversation = async (promptData: SavedPrompt) => {
    setIsSending(true);
    try {
      const response = await fetch("/api/chat/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingPrompt: promptData.prompt,
          topic: promptData.topic,
          messages: [],
          isInitial: true,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([{ role: "assistant", content: data.message }]);
      }
    } catch (error) {
      console.error("Error initializing conversation:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !prompt) return;

    const userMessage = input.trim();
    setInput("");
    setMessages([...messages, { role: "user", content: userMessage }]);
    setIsSending(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    try {
      const response = await fetch("/api/chat/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingPrompt: prompt.prompt,
          topic: prompt.topic,
          messages: [...messages, { role: "user", content: userMessage }],
          isInitial: false,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
      } else {
        alert("메시지 전송에 실패했습니다");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("메시지 전송에 실패했습니다");
    } finally {
      setIsSending(false);
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

  const handleGenerateRefinedPrompt = async () => {
    if (!prompt || messages.length === 0) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/prompts/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          existingPrompt: prompt.prompt,
          topic: prompt.topic,
          conversation: messages,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setRefinedPrompt(data);
      } else {
        alert("프롬프트 생성에 실패했습니다");
      }
    } catch (error) {
      console.error("Error generating refined prompt:", error);
      alert("프롬프트 생성에 실패했습니다");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!refinedPrompt || !prompt) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/prompts/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: prompt.topic,
          prompt: refinedPrompt.prompt,
          recommendedTools: refinedPrompt.recommendedTools,
          tips: refinedPrompt.tips,
          parentId: prompt.id, // Link to parent prompt
          aiProvider: refinedPrompt.aiProvider ?? prompt.aiProvider ?? null,
          aiModel: refinedPrompt.aiModel ?? prompt.aiModel ?? null,
        }),
      });

      if (!response.ok) throw new Error("Failed to save prompt");

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Error saving prompt:", err);
      alert("프롬프트 저장에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    if (refinedPrompt) {
      navigator.clipboard.writeText(refinedPrompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setRefinedPrompt(null);
    setMessages([]);
    if (prompt) {
      initializeConversation(prompt);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const recommendedToolsData = refinedPrompt?.recommendedTools
    .map((toolId) => aiTools.find((t) => t.id === toolId))
    .filter(Boolean);
  const refinedProvider = refinedPrompt?.aiProvider && isAIProvider(refinedPrompt.aiProvider)
    ? refinedPrompt.aiProvider
    : null;
  const refinedProviderLabel = refinedProvider ? AI_PROVIDER_LABELS[refinedProvider] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-red-50/30 to-white relative">
        {/* Global Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-red-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl" />
        </div>

        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh] relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!prompt) {
    return null;
  }

  const originalProvider = prompt.aiProvider && isAIProvider(prompt.aiProvider) ? prompt.aiProvider : null;
  const originalProviderLabel = originalProvider ? AI_PROVIDER_LABELS[originalProvider] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/50 via-red-50/30 to-white relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-red-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-pink-100/30 rounded-full blur-3xl" />
      </div>

      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Back Button */}
        <div className="relative">
          <button
            onClick={() => router.push(`/prompt/${params.id}`)}
            className="absolute -top-2 left-0 inline-flex items-center gap-2 text-muted-foreground hover:opacity-80 transition-colors text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </button>
        </div>

        {/* Header with Icon */}
        <div className="mb-8 mt-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 flex items-center justify-center shadow-lg mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-rose-500" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              <span className="text-foreground dark:text-white/90">프롬프트 개선하기</span>
            </h1>
            <p className="text-lg text-muted-foreground dark:text-white max-w-2xl mx-auto">
              AI와 대화하며 프롬프트를 더욱 효과적으로 개선하세요
            </p>
          </div>
        </div>

        {!refinedPrompt ? (
          /* Two Column Layout - Chat Interface */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Left Panel - Existing Prompt (Collapsible) */}
            <div className="bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-xl p-4 md:p-6 shadow-lg shadow-black/5 dark:shadow-black/15 max-h-[300px] md:max-h-[400px] overflow-y-auto scrollbar-hide">
              <div className="space-y-2 mb-3 md:mb-4">
                <div className="flex items-center gap-2 md:gap-3">
                  <h2 className="text-lg md:text-xl font-bold">기존 프롬프트</h2>
                  {originalProvider && (
                    <AIProviderBadge provider={originalProvider} model={prompt.aiModel || undefined} size="sm" />
                  )}
                </div>
                {originalProviderLabel && (
                  <p className="text-sm text-muted-foreground">
                    {originalProviderLabel}
                    {prompt.aiModel ? ` · ${prompt.aiModel}` : ""} 모델이 생성했습니다.
                  </p>
                )}
              </div>
              <pre className="whitespace-pre-wrap font-mono text-xs md:text-sm bg-white/30 dark:bg-black/20 p-3 md:p-4 rounded-md border border-white/30 dark:border-white/10 leading-relaxed">
                {prompt.prompt}
              </pre>
            </div>

            {/* Right Panel - Chat Interface */}
            <div className="bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-xl p-4 md:p-6 shadow-lg shadow-black/5 dark:shadow-black/15 flex flex-col min-h-[400px] md:min-h-[500px]" style={{ height: "60vh" }}>
              <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">AI와 대화하기</h2>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 scrollbar-hide">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-4 transition-all ${
                        message.role === "user"
                          ? "bg-gradient-to-br from-rose-100/70 to-red-100/70 backdrop-blur-md border border-rose-200/50 text-rose-900 dark:text-rose-100 hover:shadow-lg hover:shadow-rose-500/20"
                          : "bg-secondary hover:bg-gradient-to-br hover:from-[#F3D4DB]/20 hover:via-[#D0DFFC]/20 hover:to-[#E7D5F7]/20 hover:shadow-lg"
                      }`}
                    >
                      <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isSending && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-lg p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Generate Button (shows when there are user messages) */}
              {messages.some(m => m.role === "user") && (
                <div className="mb-4">
                  <button
                    onClick={handleGenerateRefinedPrompt}
                    disabled={isGenerating}
                    className="w-full px-6 py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-rose-500/90 to-red-500/90 hover:from-rose-500 hover:to-red-500 text-white transition-all shadow-lg hover:shadow-xl hover:shadow-rose-500/30"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        생성 중...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        추가 프롬프트 생성
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Input Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/70 dark:bg-black/30 border border-white/40 dark:border-white/20 focus:outline-none focus:ring-2 focus:ring-rose-500/50 resize-none overflow-y-auto scrollbar-hide"
                  style={{ minHeight: "48px", maxHeight: "120px" }}
                  rows={1}
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={isSending || !input.trim()}
                  className="h-[52px] px-6 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-white/60 dark:bg-white/10 backdrop-blur-md border-2 border-white/40 dark:border-white/20 text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Result View - Same as PromptGenerator */
          <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
            {/* Generated Prompt */}
            <div className="bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-xl p-8 shadow-lg shadow-black/5 dark:shadow-black/15">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">개선된 프롬프트</h2>
                    {refinedProvider && (
                      <AIProviderBadge
                        provider={refinedProvider}
                        model={refinedPrompt.aiModel || undefined}
                        size="sm"
                      />
                    )}
                  </div>
                  {refinedProviderLabel && (
                    <p className="text-sm text-muted-foreground">
                      {refinedProviderLabel}
                      {refinedPrompt.aiModel ? ` · ${refinedPrompt.aiModel}` : ""} 모델이 생성했습니다.
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSavePrompt}
                    disabled={isSaving || isSaved}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg hover:shadow-xl"
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
                    className="px-4 py-2 rounded-lg flex items-center gap-2 bg-gradient-to-r from-primary/80 to-primary hover:from-primary hover:to-primary/80 text-white transition-all shadow-lg hover:shadow-xl"
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
              <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/50 p-6 rounded-md">
                {refinedPrompt.prompt}
              </pre>
            </div>

            {/* Recommended Tools */}
            {recommendedToolsData && recommendedToolsData.length > 0 && (
              <div className="bg-white/50 dark:bg-black/30 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-xl p-8 shadow-lg shadow-black/5 dark:shadow-black/15">
                <h3 className="text-xl font-bold mb-4">추천 AI 도구</h3>
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
            {refinedPrompt.tips && refinedPrompt.tips.length > 0 && (
              <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">💡 사용 팁</h3>
                <ul className="space-y-2">
                  {refinedPrompt.tips.map((tip, index) => (
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
                className="flex-1 px-6 py-3 border border-white/40 dark:border-white/20 rounded-lg hover:bg-white/30 dark:hover:bg-white/10 transition-colors backdrop-blur-sm"
              >
                다시 개선하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
