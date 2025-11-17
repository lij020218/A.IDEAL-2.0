"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { ArrowLeft, UserCircle, Check, X, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

interface JoinRequest {
  id: string;
  role: string;
  experience: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

export default function JoinRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (session && params.id) {
      fetchRequests();
    } else if (!session) {
      router.push("/auth/signin");
    }
  }, [session, params.id]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`/api/challenges/${params.id}/requests`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests);
      } else {
        alert("참가 신청 목록을 볼 수 없습니다");
        router.push(`/challengers/${params.id}`);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      router.push(`/challengers/${params.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (requestId: string, action: "approve" | "reject") => {
    setProcessingId(requestId);

    try {
      const response = await fetch(`/api/challenges/${params.id}/requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });

      if (response.ok) {
        alert(action === "approve" ? "참가 신청이 승인되었습니다" : "참가 신청이 거절되었습니다");
        fetchRequests();
      } else {
        alert("처리 중 오류가 발생했습니다");
      }
    } catch (error) {
      console.error("Error processing request:", error);
      alert("처리 중 오류가 발생했습니다");
    } finally {
      setProcessingId(null);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background relative">
        {/* Global Background Effects */}
        <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
        <div className="fixed inset-0 hero-grain pointer-events-none"></div>
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 text-center relative z-10">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground dark:text-white/80 mt-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/challengers/${params.id}`)}
          className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
        >
          <ArrowLeft className="h-4 w-4" />
          도전 상세로 돌아가기
        </button>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-6 text-foreground dark:text-white/90">
          참가 신청 관리
        </h1>

        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 text-foreground dark:text-white/90">대기 중인 신청 ({pendingRequests.length})</h2>
          {pendingRequests.length === 0 ? (
            <div className="card-aurora rounded-xl p-8 text-center text-muted-foreground dark:text-white/80">
              대기 중인 참가 신청이 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="card-aurora rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <UserCircle className="h-12 w-12 text-muted-foreground dark:text-white/80 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground dark:text-white/90">
                          {request.user.name || "익명"}
                        </h3>
                        <span className="px-3 py-1 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/20 text-foreground dark:text-white/80 text-sm rounded-lg shadow-md shadow-black/5 dark:shadow-black/10">
                          {request.role === "designer" ? "디자이너" : "개발자"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-white/80 mb-1">
                        {request.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground dark:text-white/80 mb-3">
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                      <div className="bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-lg p-4 mb-4 shadow-lg shadow-black/5 dark:shadow-black/15">
                        <p className="text-sm font-semibold mb-1 text-foreground dark:text-white/90">경력 사항:</p>
                        <p className="text-sm text-muted-foreground dark:text-white/80 whitespace-pre-wrap">
                          {request.experience}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(request.id, "approve")}
                          disabled={processingId === request.id}
                          className="px-4 py-2 rounded-lg border-2 border-green-500/40 dark:border-green-500/30 bg-green-500/20 dark:bg-green-500/10 backdrop-blur-md text-green-600 dark:text-green-400 hover:bg-green-500/30 dark:hover:bg-green-500/20 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                          승인
                        </button>
                        <button
                          onClick={() => handleAction(request.id, "reject")}
                          disabled={processingId === request.id}
                          className="px-4 py-2 rounded-lg border-2 border-red-500/40 dark:border-red-500/30 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md text-red-600 dark:text-red-400 hover:bg-red-500/30 dark:hover:bg-red-500/20 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingId === request.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                          거절
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Processed Requests */}
        {processedRequests.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-4 text-foreground dark:text-white/90">처리된 신청 ({processedRequests.length})</h2>
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <div key={request.id} className="card-aurora rounded-xl p-6 opacity-70">
                  <div className="flex items-start gap-4">
                    <UserCircle className="h-12 w-12 text-muted-foreground dark:text-white/60 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-foreground dark:text-white/70">
                          {request.user.name || "익명"}
                        </h3>
                        <span className="px-3 py-1 bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-white/40 dark:border-white/20 text-foreground dark:text-white/60 text-sm rounded-lg shadow-md shadow-black/5 dark:shadow-black/10">
                          {request.role === "designer" ? "디자이너" : "개발자"}
                        </span>
                        <span
                          className={`px-3 py-1 text-sm rounded-lg backdrop-blur-sm border shadow-md shadow-black/5 dark:shadow-black/10 ${
                            request.status === "approved"
                              ? "bg-green-500/20 dark:bg-green-500/10 border-green-500/40 dark:border-green-500/30 text-green-600 dark:text-green-400"
                              : "bg-red-500/20 dark:bg-red-500/10 border-red-500/40 dark:border-red-500/30 text-red-600 dark:text-red-400"
                          }`}
                        >
                          {request.status === "approved" ? "승인됨" : "거절됨"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground dark:text-white/60">
                        {request.user.email}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
