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
        className={`fixed top-16 left-0 h-[calc(100vh-4rem)] w-80 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 z-40 flex flex-col
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Link
            href="/generate"
            className="btn-aurora w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium"
            onClick={onClose}
          >
            <Plus className="h-5 w-5" />
            새 프롬프트 생성
          </Link>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Prompts Section */}
          <div className="mb-4">
            <button
              onClick={() => setIsPromptsExpanded(!isPromptsExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                {isPromptsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <span>프롬프트</span>
                <span className="text-xs text-gray-500">({parentPrompts.length})</span>
              </div>
            </button>

            {isPromptsExpanded && (
              <div className="mt-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : parentPrompts.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
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
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-3 w-3 text-gray-500" />
                              ) : (
                                <ChevronRight className="h-3 w-3 text-gray-500" />
                              )}
                            </button>
                          )}

                          {/* Prompt Link */}
                          <Link
                            href={`/prompt/${prompt.id}`}
                            onClick={onClose}
                            className="flex-1 block w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                          >
                            <div className="flex items-start gap-3">
                              {hasRefinements ? (
                                isExpanded ? (
                                  <FolderOpen className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Folder className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                                )
                              ) : (
                                <FileText className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-0.5">
                                  {prompt.topic}
                                  {hasRefinements && (
                                    <span className="ml-2 text-xs text-gray-500">
                                      ({prompt.refinements.length})
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
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
                          <div className="ml-6 mt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                            {prompt.refinements.map((refinement) => (
                              <Link
                                key={refinement.id}
                                href={`/prompt/${refinement.id}`}
                                onClick={onClose}
                                className="block w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                              >
                                <div className="flex items-start gap-3">
                                  <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate mb-0.5">
                                      {refinement.topic}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
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
          <div className="mb-4">
            <button
              onClick={() => setIsChatRoomsExpanded(!isChatRoomsExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                {isChatRoomsExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <MessageSquare className="h-4 w-4" />
                <span>A.IDEAL SPACE</span>
                <span className="text-xs text-gray-500">({chatRooms.length})</span>
              </div>
            </button>

            {isChatRoomsExpanded && (
              <div className="mt-2 space-y-1">
                {isChatRoomsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : chatRooms.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>참여 중인 채팅방이 없습니다</p>
                  </div>
                ) : (
                  chatRooms.map((room) => (
                    <Link
                      key={room.id}
                      href={`/challengers/${room.challengeId}/chat`}
                      onClick={onClose}
                      className="block w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {room.challengeTitle}
                            </h4>
                            {room.isOwner && (
                              <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded flex-shrink-0">
                                방장
                              </span>
                            )}
                          </div>
                          {room.lastMessage && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                              {room.lastMessage}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span>{room.memberCount}명</span>
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
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
            {session.user?.email}
          </div>
        </div>
      </aside>
    </>
  );
}
