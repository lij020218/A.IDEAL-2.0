"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FileText, Trash2, ArrowLeft, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface Prompt {
  id: string;
  topic: string;
  user: {
    name: string | null;
    email: string;
  };
  createdAt: string;
  _count: {
    comments: number;
  };
}

export default function AdminPromptsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { translate, language } = useLanguage();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/");
      return;
    }
    fetchPrompts();
  }, [session, status, router]);

  const fetchPrompts = async () => {
    try {
      const response = await fetch("/api/admin/prompts");
      if (response.ok) {
        const data = await response.json();
        setPrompts(data.prompts);
      }
    } catch (error) {
      console.error("Error fetching prompts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(translate("정말 이 프롬프트를 삭제하시겠습니까? 관련된 모든 댓글도 함께 삭제됩니다."))) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/prompts/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPrompts(prompts.filter((p) => p.id !== id));
      } else {
        alert(translate("삭제에 실패했습니다"));
      }
    } catch (error) {
      console.error("Error deleting prompt:", error);
      alert(translate("삭제에 실패했습니다"));
    } finally {
      setDeletingId(null);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/admin"
            className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <FileText className="h-6 w-6 text-blue-500" />
          <h1 className="text-2xl font-bold">{translate("프롬프트 관리")}</h1>
          <span className="text-sm text-muted-foreground">
            ({prompts.length}개)
          </span>
        </div>

        {prompts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {translate("등록된 프롬프트가 없습니다")}
          </div>
        ) : (
          <div className="space-y-4">
            {prompts.map((prompt) => (
              <div
                key={prompt.id}
                className="p-4 rounded-xl border border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/prompt/${prompt.id}`}
                      className="text-lg font-semibold hover:underline block truncate"
                    >
                      {prompt.topic}
                    </Link>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{prompt.user.name || prompt.user.email}</span>
                      <span>
                        {formatDistanceToNow(new Date(prompt.createdAt), {
                          addSuffix: true,
                          locale: language === "ko" ? ko : enUS,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {prompt._count.comments}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(prompt.id)}
                    disabled={deletingId === prompt.id}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {deletingId === prompt.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
