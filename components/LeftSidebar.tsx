"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FileText, Loader2, Plus, ChevronDown, ChevronRight, Folder, FolderOpen, MessageSquare, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import Link from "next/link";

interface RefinementSummary {
  id: string;
  topic: string;
  createdAt: string;
}

interface SavedPrompt {
  id: string;
  topic: string;
  prompt: string;
  recommendedTools: string[];
  tips: string[];
  createdAt: string;
  parentId: string | null;
  refinements?: RefinementSummary[];
}

interface ChatRoom {
  id: string;
  challengeId: string;
  challengeTitle: string;
  memberCount: number;
  lastMessage: string | null;
  lastMessageAt: string;
  isOwner: boolean;
}

interface LeftSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  refreshTrigger?: number;
}

export default function LeftSidebar({ isOpen, onClose, refreshTrigger }: LeftSidebarProps) {
  const { data: session } = useSession();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatRoomsLoading, setIsChatRoomsLoading] = useState(false);
  const [isPromptsExpanded, setIsPromptsExpanded] = useState(true);
  const [isChatRoomsExpanded, setIsChatRoomsExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (session) {
      fetchPrompts();
      fetchChatRooms();
    }
  }, [session, refreshTrigger]);

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/prompts/list");
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

  const fetchChatRooms = async () => {
    setIsChatRoomsLoading(true);
    try {
      const response = await fetch("/api/chat-rooms/list");
      if (response.ok) {
        const data = await response.json();
        setChatRooms(data.chatRooms);
      }
    } catch (error) {
      console.error("Error fetching chat rooms:", error);
    } finally {
      setIsChatRoomsLoading(false);
    }
  };

  const toggleFolder = (promptId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(promptId)) {
        newSet.delete(promptId);
      } else {
        newSet.add(promptId);
      }
      return newSet;
    });
  };

  // Filter to only show parent prompts (prompts without a parentId)
  const parentPrompts = prompts.filter((p) => !p.parentId);

  if (!session) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-background border-r border-border transition-transform duration-300 z-40 flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Action Buttons */}
        <div className="p-4 border-b border-border space-y-3">
          <Link
            href="/generate"
            className="btn-aurora w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
            onClick={onClose}
          >
            <Plus className="h-5 w-5" />
            새 프롬프트 생성
          </Link>
          <Link
            href="/prompts/new"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium border-2 border-border hover:bg-secondary transition-colors"
            onClick={onClose}
          >
            <FileText className="h-5 w-5" />
            프롬프트 등록
          </Link>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Prompts Section */}
          <div className="mb-6">
            <button
              onClick={() => setIsPromptsExpanded(!isPromptsExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold hover:bg-secondary rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                {isPromptsExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-primary" />
                )}
                <FileText className="h-4 w-4 text-primary" />
                <span>프롬프트</span>
                <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-semibold">
                  {parentPrompts.length}
                </span>
              </div>
            </button>

            {isPromptsExpanded && (
              <div className="mt-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : parentPrompts.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>저장된 프롬프트가 없습니다</p>
                  </div>
                ) : (
                  parentPrompts.map((prompt) => {
                    const hasRefinements = prompt.refinements && prompt.refinements.length > 0;
                    const isExpanded = expandedFolders.has(prompt.id);

                    return (
                      <div key={prompt.id}>
                        {/* Parent Prompt */}
                        <div className="flex items-start gap-1">
                          {/* Expand/Collapse Button */}
                          {hasRefinements && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                toggleFolder(prompt.id);
                              }}
                              className="p-1 hover:bg-secondary rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              )}
                            </button>
                          )}

                          {/* Prompt Link */}
                          <Link
                            href={`/prompt/${prompt.id}`}
                            onClick={onClose}
                            className="flex-1 block w-full text-left px-3 py-2.5 rounded-lg hover:bg-secondary transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              {hasRefinements ? (
                                isExpanded ? (
                                  <FolderOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Folder className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                )
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium truncate mb-0.5">
                                  {prompt.topic}
                                  {hasRefinements && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-semibold">
                                      {prompt.refinements.length}
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(prompt.createdAt), {
                                    addSuffix: true,
                                    locale: ko,
                                  })}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </div>

                        {/* Child Refinements */}
                        {hasRefinements && isExpanded && (
                          <div className="ml-6 mt-1 space-y-1 border-l-2 border-border pl-2">
                            {prompt.refinements.map((refinement) => (
                              <Link
                                key={refinement.id}
                                href={`/prompt/${refinement.id}`}
                                onClick={onClose}
                                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-secondary transition-colors group"
                              >
                                <div className="flex items-start gap-3">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium truncate mb-0.5 opacity-90">
                                      {refinement.topic}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(refinement.createdAt), {
                                        addSuffix: true,
                                        locale: ko,
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* A.IDEAL SPACE Section */}
          <div className="mb-6">
            <button
              onClick={() => setIsChatRoomsExpanded(!isChatRoomsExpanded)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold hover:bg-secondary rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                {isChatRoomsExpanded ? (
                  <ChevronDown className="h-4 w-4 text-primary" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-primary" />
                )}
                <MessageSquare className="h-4 w-4 text-primary" />
                <span>A.IDEAL SPACE</span>
                <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-semibold">
                  {chatRooms.length}
                </span>
              </div>
            </button>

            {isChatRoomsExpanded && (
              <div className="mt-2 space-y-2">
                {isChatRoomsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : chatRooms.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>참여 중인 채팅방이 없습니다</p>
                  </div>
                ) : (
                  chatRooms.map((room) => (
                    <Link
                      key={room.id}
                      href={`/challengers/${room.challengeId}/chat`}
                      onClick={onClose}
                      className="block w-full text-left px-3 py-3 rounded-lg hover:bg-secondary border border-transparent hover:border-border transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg transition-shadow">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold truncate">
                              {room.challengeTitle}
                            </h4>
                            {room.isOwner && (
                              <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded font-semibold flex-shrink-0">
                                방장
                              </span>
                            )}
                          </div>
                          {room.lastMessage && (
                            <p className="text-xs text-muted-foreground truncate mb-1.5">
                              {room.lastMessage}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {room.memberCount}
                            </span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(room.lastMessageAt), {
                                addSuffix: true,
                                locale: ko,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{session.user?.name || "사용자"}</p>
              <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
