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
      <div className="min-h-screen bg-background">
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground mt-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/challengers/${params.id}`)}
          className="mb-4 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          도전 상세로 돌아가기
        </button>

        {/* Header */}
        <h1 className="text-3xl font-bold mb-6">
          참가 <span className="gradient-text">신청 관리</span>
        </h1>

        {/* Pending Requests */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">대기 중인 신청 ({pendingRequests.length})</h2>
          {pendingRequests.length === 0 ? (
            <div className="card-aurora rounded-xl p-8 text-center text-muted-foreground">
              대기 중인 참가 신청이 없습니다
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="card-aurora rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <UserCircle className="h-12 w-12 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {request.user.name || "익명"}
                        </h3>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-sm rounded">
                          {request.role === "designer" ? "디자이너" : "개발자"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {request.user.email}
                      </p>
                      <p className="text-sm text-muted-foreground mb-3">
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                      <div className="bg-secondary/50 rounded-lg p-4 mb-4">
                        <p className="text-sm font-semibold mb-1">경력 사항:</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {request.experience}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(request.id, "approve")}
                          disabled={processingId === request.id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <h2 className="text-xl font-bold mb-4">처리된 신청 ({processedRequests.length})</h2>
            <div className="space-y-4">
              {processedRequests.map((request) => (
                <div key={request.id} className="card-aurora rounded-xl p-6 opacity-70">
                  <div className="flex items-start gap-4">
                    <UserCircle className="h-12 w-12 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">
                          {request.user.name || "익명"}
                        </h3>
                        <span className="px-2 py-1 bg-primary/10 text-primary text-sm rounded">
                          {request.role === "designer" ? "디자이너" : "개발자"}
                        </span>
                        <span
                          className={`px-2 py-1 text-sm rounded ${
                            request.status === "approved"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {request.status === "approved" ? "승인됨" : "거절됨"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
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
