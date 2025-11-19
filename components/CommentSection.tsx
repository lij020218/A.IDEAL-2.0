"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, Trash2, Reply, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import FollowButton from "@/components/FollowButton";
import Link from "next/link";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  replies?: Comment[];
}

interface CommentSectionProps {
  resourceId: string;
  resourceType: "prompt" | "challenge";
  resourceOwnerId?: string;
  onCommentCountChange?: (count: number) => void;
  focusRingColor?: string;
}

export default function CommentSection({
  resourceId,
  resourceType,
  resourceOwnerId,
  onCommentCountChange,
  focusRingColor = "focus:ring-primary/50",
}: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const apiBase = resourceType === "prompt" 
    ? `/api/prompts/${resourceId}/comments`
    : `/api/challenges/${resourceId}/comments`;

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(apiBase);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
        if (onCommentCountChange) {
          onCommentCountChange(data.comments?.length || 0);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error fetching comments:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments([data.comment, ...comments]);
        setNewComment("");
        if (onCommentCountChange) {
          onCommentCountChange(comments.length + 1);
        }
      } else {
        alert("댓글 작성에 실패했습니다");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("댓글 작성에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!session || !replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (response.ok) {
        // 댓글 목록을 다시 불러와서 최신 상태 유지
        await fetchComments();
        setReplyContent("");
        setReplyingTo(null);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`답글 작성에 실패했습니다: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert("답글 작성에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("정말 이 댓글을 삭제하시겠습니까?")) return;

    setDeletingId(commentId);
    try {
      const response = await fetch(`${apiBase}/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        // 댓글 목록을 다시 불러와서 최신 상태 유지 (답글 포함)
        await fetchComments();
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`댓글 삭제에 실패했습니다: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("댓글 삭제에 실패했습니다");
    } finally {
      setDeletingId(null);
    }
  };

  const canDelete = (comment: Comment) => {
    if (!session) return false;
    const isCommentAuthor = comment.user.id === session.user?.id;
    const isResourceOwner = resourceOwnerId === session.user?.id;
    return isCommentAuthor || isResourceOwner;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 text-foreground dark:text-white/90">
        <MessageCircle className="h-5 w-5 text-foreground dark:text-white/90" />
        댓글 {comments.length}개
      </h3>

      {/* Comment Form */}
      {session ? (
        <form onSubmit={handleSubmitComment} className="mb-8">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="댓글을 입력하세요..."
            rows={3}
            className={`mb-3 resize-none input-aurora text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60 focus-visible:ring-2 ${focusRingColor}`}
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="px-6 py-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground dark:text-white hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                작성 중...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                댓글 작성
              </>
            )}
          </button>
        </form>
      ) : (
        <div className="mb-8 p-4 card-aurora rounded-lg text-center text-muted-foreground dark:text-white/80">
          댓글을 작성하려면 로그인이 필요합니다
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-6">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground dark:text-white/80">
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border-b border-border/50 dark:border-white/10 pb-6 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Link
                      href={`/users/${comment.user.id}`}
                      className="font-semibold hover:opacity-80 transition-colors text-foreground dark:text-white/90"
                    >
                      {comment.user.name || comment.user.email.split("@")[0]}
                    </Link>
                    <FollowButton targetUserId={comment.user.id} size="xs" />
                    <span className="text-sm text-muted-foreground dark:text-white/80">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap text-foreground dark:text-white/80">{comment.content}</p>
                </div>
                {canDelete(comment) && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deletingId === comment.id}
                    className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                  >
                    {deletingId === comment.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Reply Button */}
              {session && (
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="text-sm text-muted-foreground dark:text-white/80 hover:opacity-80 transition-colors flex items-center gap-1 mt-2"
                >
                  <Reply className="h-3 w-3" />
                  답글
                </button>
              )}

              {/* Reply Form */}
              {replyingTo === comment.id && (
                <div className="mt-4 ml-6 pl-4 border-l-2 border-foreground/20 dark:border-white/20">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답글을 입력하세요..."
                    rows={2}
                    className={`mb-2 resize-none input-aurora text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60 focus-visible:ring-2 ${focusRingColor}`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={isSubmitting || !replyContent.trim()}
                      className="px-4 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground dark:text-white hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          작성 중...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          답글 작성
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                      className="px-4 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 text-sm"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 ml-6 pl-4 border-l-2 border-foreground/20 dark:border-white/20 space-y-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <Link
                            href={`/users/${reply.user.id}`}
                            className="font-semibold text-sm hover:opacity-80 transition-colors text-foreground dark:text-white/90"
                          >
                            {reply.user.name || reply.user.email.split("@")[0]}
                          </Link>
                          <FollowButton targetUserId={reply.user.id} size="xs" />
                          <span className="text-xs text-muted-foreground dark:text-white/80">
                            {formatDistanceToNow(new Date(reply.createdAt), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground dark:text-white/80 whitespace-pre-wrap">
                          {reply.content}
                        </p>
                      </div>
                      {canDelete(reply) && (
                        <button
                          onClick={() => handleDeleteComment(reply.id)}
                          disabled={deletingId === reply.id}
                          className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 ml-2"
                        >
                          {deletingId === reply.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" />
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

