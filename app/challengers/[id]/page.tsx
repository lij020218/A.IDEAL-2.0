"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import JoinRequestModal from "@/components/JoinRequestModal";
import CommentSection from "@/components/CommentSection";
import { Code, Lightbulb, FileText, Mail, Calendar, Rocket, Copy, Check, Send, MessageCircle, Trash2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";

interface Challenge {
  id: string;
  userId: string;
  title: string;
  description: string;
  codeSnippet?: string;
  ideaDetails?: string;
  resumeUrl?: string;
  contactInfo: string;
  tags: string[];
  createdAt: string;
  author: {
    id: string;
    name?: string;
    email: string;
  };
}


export default function ChallengeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showContact, setShowContact] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchChallenge();
      checkJoinStatus();
    }
  }, [params.id, session]);

  const fetchChallenge = async () => {
    try {
      const response = await fetch(`/api/challenges/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setChallenge(data);
      } else {
        router.push("/challengers");
      }
    } catch (error) {
      console.error("Error fetching challenge:", error);
      router.push("/challengers");
    } finally {
      setIsLoading(false);
    }
  };


  const checkJoinStatus = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/challenges/${params.id}/join-status`);
      if (response.ok) {
        const data = await response.json();
        setJoinRequestStatus(data.status);
      }
    } catch (error) {
      console.error("Error checking join status:", error);
    }
  };

  const handleJoinSuccess = () => {
    alert("참가 신청이 완료되었습니다. 승인을 기다려주세요!");
    checkJoinStatus();
  };

  const handleGoToChatRoom = () => {
    router.push(`/challengers/${params.id}/chat`);
  };


  const handleCopyContact = () => {
    if (challenge) {
      navigator.clipboard.writeText(challenge.contactInfo);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDelete = async () => {
    if (!confirm("정말 이 도전을 삭제하시겠습니까?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/challenges/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("도전이 삭제되었습니다");
        router.push("/challengers");
      } else {
        alert("도전 삭제에 실패했습니다");
      }
    } catch (error) {
      console.error("Error deleting challenge:", error);
      alert("도전 삭제에 실패했습니다");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-pink-50/30 to-white relative">
        {/* Global Background Effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-fuchsia-100/30 rounded-full blur-3xl" />
        </div>
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 text-center relative z-10">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/50 via-pink-50/30 to-white relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-pink-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-fuchsia-100/30 rounded-full blur-3xl" />
      </div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md border border-purple-200/50 flex items-center justify-center shadow-lg mx-auto mb-4">
            <Users className="h-8 w-8 text-purple-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground dark:text-white/90">{challenge.title}</h1>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground dark:text-white/80">
            <div className="flex items-center gap-2">
              <Link
                href={`/users/${challenge.userId}`}
                className="flex items-center gap-1 hover:opacity-80 transition-colors text-foreground"
              >
                <Mail className="h-4 w-4" />
                {challenge.author.name || "익명"}
              </Link>
              <FollowButton targetUserId={challenge.userId} size="xs" />
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDistanceToNow(new Date(challenge.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </div>
          </div>
        </div>

        {/* Tags and Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          {challenge.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {challenge.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1.5 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 text-foreground rounded-lg text-sm font-medium shadow-lg shadow-black/5 dark:shadow-black/15"
                >
                  #{tag}
                </span>
              ))}
            </div>
          ) : (
            <div></div>
          )}

          {session && session.user?.id === challenge.userId && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/challengers/${params.id}/requests`)}
                className="px-4 py-2 rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md text-purple-500 hover:from-purple-100/80 hover:to-pink-100/80 dark:from-purple-500/20 dark:to-pink-500/20 dark:border-purple-400/30 dark:text-purple-400 dark:hover:from-purple-500/30 dark:hover:to-pink-500/30 transition-all font-semibold text-sm shadow-lg shadow-purple-500/20 flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                참가 신청 관리
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg border-2 border-red-500/40 dark:border-red-500/30 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md text-red-600 dark:text-red-400 hover:bg-red-500/30 dark:hover:bg-red-500/20 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="card-aurora rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4 text-foreground dark:text-white/90">프로젝트 소개</h2>
          <p className="whitespace-pre-wrap text-muted-foreground dark:text-white leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Code Snippet */}
        {challenge.codeSnippet && (
          <div className="card-aurora rounded-xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-6 w-6 text-foreground dark:text-white/90" />
              <h2 className="text-2xl font-bold text-foreground dark:text-white/90">코드</h2>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 p-6 rounded-md overflow-x-auto shadow-lg shadow-black/5 dark:shadow-black/15">
              {challenge.codeSnippet}
            </pre>
          </div>
        )}

        {/* Idea Details */}
        {challenge.ideaDetails && (
          <div className="card-aurora rounded-xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-6 w-6 text-foreground dark:text-white/90" />
              <h2 className="text-2xl font-bold text-foreground dark:text-white/90">아이디어 상세</h2>
            </div>
            <p className="whitespace-pre-wrap text-muted-foreground dark:text-white leading-relaxed">
              {challenge.ideaDetails}
            </p>
          </div>
        )}

        {/* Resume */}
        {challenge.resumeUrl && (
          <div className="card-aurora rounded-xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-6 w-6 text-foreground dark:text-white/90" />
              <h2 className="text-2xl font-bold text-foreground dark:text-white/90">이력서</h2>
            </div>
            <a
              href={challenge.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground dark:text-white hover:opacity-80 transition-colors flex items-center gap-2"
            >
              이력서 보기 →
            </a>
          </div>
        )}

        {/* Contact & A.DEAL SPACE Section */}
        <div className="card-aurora rounded-xl p-8">
          {!showContact ? (
            <button
              onClick={() => setShowContact(true)}
              className="w-full px-6 py-4 rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-100/70 to-pink-100/70 backdrop-blur-md text-purple-500 hover:from-purple-100/80 hover:to-pink-100/80 dark:from-purple-500/20 dark:to-pink-500/20 dark:border-purple-400/30 dark:text-purple-400 dark:hover:from-purple-500/30 dark:hover:to-pink-500/30 transition-all font-semibold text-lg shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
            >
              <Rocket className="h-6 w-6" />
              같이 도전하기
            </button>
          ) : (
            <div className="space-y-4">
              {/* Contact Info */}
              <div>
                <h3 className="text-xl font-bold mb-4 text-foreground dark:text-white/90">연락처</h3>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-lg font-mono shadow-lg shadow-black/5 dark:shadow-black/15">
                    {challenge.contactInfo}
                  </div>
                  <button
                    onClick={handleCopyContact}
                    className="px-4 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="h-5 w-5" />
                        복사됨
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        복사
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* A.DEAL SPACE Button */}
              {session && session.user?.id !== challenge.userId && (
                <div className="pt-4 border-t border-foreground/20">
                  {joinRequestStatus === "approved" ? (
                    <button
                      onClick={handleGoToChatRoom}
                      className="w-full px-6 py-4 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center justify-center gap-2 text-lg font-semibold"
                    >
                      <Users className="h-6 w-6" />
                      A.IDEAL SPACE로 이동
                    </button>
                  ) : joinRequestStatus === "pending" ? (
                    <div className="text-center p-4 card-aurora rounded-lg">
                      <p className="text-foreground font-medium">
                        참가 신청 승인 대기 중입니다
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        프로젝트 생성자의 승인을 기다려주세요
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="w-full px-6 py-4 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center justify-center gap-2 text-lg font-semibold"
                    >
                      <Users className="h-6 w-6" />
                      A.IDEAL SPACE 참가 신청
                    </button>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground dark:text-white/80 text-center">
                {session && session.user?.id !== challenge.userId
                  ? "A.IDEAL SPACE에서 팀원들과 함께 아이디어를 실현해보세요!"
                  : "위 연락처로 연락하여 함께 도전을 시작해보세요!"}
              </p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="card-aurora rounded-xl p-8 mt-6">
          <CommentSection
            resourceId={challenge.id}
            resourceType="challenge"
            resourceOwnerId={challenge.userId}
          />
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => router.push("/challengers")}
            className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
          >
            ← 목록으로
          </button>
        </div>
      </div>

      {/* Join Request Modal */}
      <JoinRequestModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        challengeId={challenge.id}
        challengeTitle={challenge.title}
        onSuccess={handleJoinSuccess}
      />
    </div>
  );
}
