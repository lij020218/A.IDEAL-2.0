"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Copy, Check, Edit, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  createdAt: string;
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
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!prompt) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">{prompt.topic}</h1>
          <p className="text-muted-foreground">
            {formatDistanceToNow(new Date(prompt.createdAt), {
              addSuffix: true,
              locale: ko,
            })}
          </p>
        </div>

        {/* Prompt Content */}
        <div className="card-aurora rounded-xl p-8 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">생성된 프롬프트</h2>
            <button
              onClick={handleCopy}
              className="btn-aurora px-4 py-2 rounded-lg flex items-center gap-2"
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
          <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/50 p-6 rounded-md">
            {prompt.prompt}
          </pre>
        </div>

        {/* Recommended Tools */}
        {prompt.recommendedTools && prompt.recommendedTools.length > 0 && (
          <div className="card-aurora rounded-xl p-8 mb-6">
            <h3 className="text-xl font-bold mb-4">추천 도구</h3>
            <div className="flex flex-wrap gap-2">
              {prompt.recommendedTools.map((tool, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium"
                >
                  {tool}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        {prompt.tips && prompt.tips.length > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-3">💡 팁</h3>
            <ul className="space-y-2">
              {prompt.tips.map((tip, index) => (
                <li key={index} className="text-sm text-muted-foreground">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleContinue}
            className="btn-aurora flex-1 px-6 py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Edit className="h-5 w-5" />
            추가로 작업하기
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 border rounded-lg hover:bg-secondary transition-colors"
          >
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
}
