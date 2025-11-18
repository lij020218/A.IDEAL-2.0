"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MessageSquare, Trash2, ArrowLeft, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/language-context";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface ChatRoom {
  id: string;
  challenge: {
    id: string;
    title: string;
    user: {
      name: string | null;
      email: string;
    };
  };
  createdAt: string;
  _count: {
    members: number;
    messages: number;
  };
}

export default function AdminSpacesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { translate, language } = useLanguage();
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/");
      return;
    }
    fetchChatRooms();
  }, [session, status, router]);

  const fetchChatRooms = async () => {
    try {
      const response = await fetch("/api/admin/spaces");
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.chatRooms);
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(translate("정말 이 채팅방을 삭제하시겠습니까? 모든 메시지가 함께 삭제됩니다."))) {
      return;
    }

    setDeletingId(id);
    try {
      const response = await fetch(`/api/admin/spaces/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setChatRooms(chatRooms.filter((c) => c.id !== id));
      } else {
        alert(translate("삭제에 실패했습니다"));
      }
    } catch (error) {
      console.error("Error deleting chat room:", error);
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
          <MessageSquare className="h-6 w-6 text-purple-500" />
          <h1 className="text-2xl font-bold">{translate("A.IDEAL SPACE 관리")}</h1>
          <span className="text-sm text-muted-foreground">
            ({chatRooms.length}개)
          </span>
        </div>

        {chatRooms.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {translate("생성된 채팅방이 없습니다")}
          </div>
        ) : (
          <div className="space-y-4">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className="p-4 rounded-xl border border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/challengers/${room.challenge.id}/chat`}
                      className="text-lg font-semibold hover:underline block truncate"
                    >
                      {room.challenge.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>{room.challenge.user.name || room.challenge.user.email}</span>
                      <span>
                        {formatDistanceToNow(new Date(room.createdAt), {
                          addSuffix: true,
                          locale: language === "ko" ? ko : enUS,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {room._count.members}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {room._count.messages}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(room.id)}
                    disabled={deletingId === room.id}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {deletingId === room.id ? (
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
