"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Copy, Check, Edit, ArrowLeft, Tag, User, Clock, Sparkles, ExternalLink, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { aiTools } from "@/lib/data/ai-tools";
import Image from "next/image";

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  imageUrl?: string | null;
  createdAt: string;
  user?: {
    name?: string;
    email: string;
  };
}

export default function PromptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [prompt, setPrompt] = useState<SavedPrompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (session && params.id) {
      fetchPrompt();
    } else if (!session) {
      router.push("/auth/signin");
    }
  }, [session, params.id]);

  const fetchPrompt = async () => {
    try {
      const response = await fetch(`/api/prompts/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setPrompt(data);
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

  const handleCopy = () => {
    if (prompt) {
      navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinue = () => {
    if (prompt) {
      // Navigate to refine page for conversational refinement
      router.push(`/prompt/${params.id}/refine`);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!prompt) {
    return null;
  }

  // Get full tool details for recommended tools
  const recommendedToolDetails = prompt.recommendedTools
    .map((toolName) => aiTools.find((t) => t.name === toolName))
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          프롬프트 목록으로
        </button>

        {/* Image Header (if available) */}
        {prompt.imageUrl && (
          <div className="relative w-full h-64 md:h-96 rounded-xl overflow-hidden mb-6">
            <Image
              src={prompt.imageUrl}
              alt={prompt.topic}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        {/* Header */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{prompt.topic}</h1>
              {prompt.user && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{prompt.user.name || prompt.user.email.split("@")[0]}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(prompt.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prompt Content */}
        <div className="bg-card border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">프롬프트 내용</h2>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  복사됨!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  프롬프트 복사
                </>
              )}
            </button>
          </div>
          <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/50 p-4 rounded-md">
            {prompt.prompt}
          </pre>
        </div>

        {/* Recommended AI Tools */}
        {recommendedToolDetails.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">추천 AI 도구</h2>
            <p className="text-muted-foreground mb-6">
              이 프롬프트에 가장 적합한 AI 도구들입니다.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedToolDetails.map((tool: any) => (
                <a
                  key={tool.id}
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 p-4 border rounded-lg hover:border-primary transition-colors bg-card"
                >
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                    {tool.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {tool.description}
                    </p>
                    <span className="inline-block mt-2 text-xs bg-secondary px-2 py-0.5 rounded">
                      {tool.category}
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {prompt.tips && prompt.tips.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-3">💡 사용 팁</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {prompt.tips.map((tip, index) => (
                <li key={index}>• {tip}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Default Tips if none provided */}
        {(!prompt.tips || prompt.tips.length === 0) && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-3">💡 사용 팁</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• 프롬프트를 복사하여 원하는 AI 도구에 붙여넣으세요</li>
              <li>• 필요에 따라 프롬프트 내용을 수정하여 사용할 수 있습니다</li>
              <li>• 여러 AI 도구에서 테스트하여 최상의 결과를 찾아보세요</li>
              <li>• 성공적인 결과를 얻으면 추가로 작업하여 더 개선할 수 있습니다</li>
            </ul>
          </div>
        )}

        {/* Action Button */}
        <div className="flex gap-4">
          <button
            onClick={handleContinue}
            className="btn-aurora flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Edit className="h-5 w-5" />
            추가로 작업하기
          </button>
        </div>
      </div>
    </div>
  );
}
