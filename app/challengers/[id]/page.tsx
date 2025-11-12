"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import JoinRequestModal from "@/components/JoinRequestModal";
import { Code, Lightbulb, FileText, Mail, Calendar, Rocket, Copy, Check, Send, MessageCircle, Trash2, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

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
    name?: string;
    email: string;
  };
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinRequestStatus, setJoinRequestStatus] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchChallenge();
      fetchComments();
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

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/challenges/${params.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      router.push("/auth/signin?message=댓글을 작성하려면 로그인이 필요합니다");
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    setIsSubmittingComment(true);

    try {
      const response = await fetch(`/api/challenges/${params.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment("");
      } else {
        alert("댓글 작성에 실패했습니다");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("댓글 작성에 실패했습니다");
    } finally {
      setIsSubmittingComment(false);
    }
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
      <div className="min-h-screen bg-background">
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">{challenge.title}</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Mail className="h-4 w-4" />
              {challenge.author.name || "익명"}
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
                  className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm font-medium"
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
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                참가 신청 관리
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="card-aurora rounded-xl p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">프로젝트 소개</h2>
          <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
            {challenge.description}
          </p>
        </div>

        {/* Code Snippet */}
        {challenge.codeSnippet && (
          <div className="card-aurora rounded-xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">코드</h2>
            </div>
            <pre className="whitespace-pre-wrap font-mono text-sm bg-secondary/50 p-6 rounded-md overflow-x-auto">
              {challenge.codeSnippet}
            </pre>
          </div>
        )}

        {/* Idea Details */}
        {challenge.ideaDetails && (
          <div className="card-aurora rounded-xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">아이디어 상세</h2>
            </div>
            <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
              {challenge.ideaDetails}
            </p>
          </div>
        )}

        {/* Resume */}
        {challenge.resumeUrl && (
          <div className="card-aurora rounded-xl p-8 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">이력서</h2>
            </div>
            <a
              href={challenge.resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-2"
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
              className="btn-aurora w-full px-6 py-4 rounded-lg flex items-center justify-center gap-2 text-lg"
            >
              <Rocket className="h-6 w-6" />
              같이 도전하기
            </button>
          ) : (
            <div className="space-y-4">
              {/* Contact Info */}
              <div>
                <h3 className="text-xl font-bold mb-4">연락처</h3>
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-secondary rounded-lg font-mono">
                    {challenge.contactInfo}
                  </div>
                  <button
                    onClick={handleCopyContact}
                    className="btn-aurora px-4 py-3 rounded-lg flex items-center gap-2"
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
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {joinRequestStatus === "approved" ? (
                    <button
                      onClick={handleGoToChatRoom}
                      className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-lg font-semibold transition-all"
                    >
                      <Users className="h-6 w-6" />
                      A.IDEAL SPACE로 이동
                    </button>
                  ) : joinRequestStatus === "pending" ? (
                    <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                        참가 신청 승인 대기 중입니다
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        프로젝트 생성자의 승인을 기다려주세요
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg flex items-center justify-center gap-2 text-lg font-semibold transition-all"
                    >
                      <Users className="h-6 w-6" />
                      A.IDEAL SPACE 참가 신청
                    </button>
                  )}
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center">
                {session && session.user?.id !== challenge.userId
                  ? "A.IDEAL SPACE에서 팀원들과 함께 아이디어를 실현해보세요!"
                  : "위 연락처로 연락하여 함께 도전을 시작해보세요!"}
              </p>
            </div>
          )}
        </div>

        {/* Comments Section */}
        <div className="card-aurora rounded-xl p-8 mt-6">
          <div className="flex items-center gap-2 mb-6">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">댓글 ({comments.length})</h2>
          </div>

          {/* Comment Form */}
          {session ? (
            <form onSubmit={handleSubmitComment} className="mb-6">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                className="input-aurora w-full px-4 py-3 rounded-lg resize-none"
                rows={3}
                disabled={isSubmittingComment}
              />
              <div className="flex justify-end mt-3">
                <button
                  type="submit"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="btn-aurora px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {isSubmittingComment ? "작성 중..." : "댓글 작성"}
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-secondary rounded-lg text-center">
              <p className="text-muted-foreground">
                댓글을 작성하려면{" "}
                <button
                  onClick={() => router.push("/auth/signin?message=댓글을 작성하려면 로그인이 필요합니다")}
                  className="text-primary hover:underline"
                >
                  로그인
                </button>
                이 필요합니다
              </p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                첫 번째 댓글을 작성해보세요!
              </p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="p-4 bg-secondary/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{comment.author.name || "익명"}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-muted-foreground">{comment.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => router.push("/challengers")}
            className="px-6 py-3 border rounded-lg hover:bg-secondary transition-colors"
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
