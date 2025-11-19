"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  FileText,
  Loader2,
  Plus,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  MessageSquare,
  Users,
  CreditCard,
  Settings,
  ChevronUp,
  Shield,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import Link from "next/link";
import { AIProviderBadge, isAIProvider } from "@/components/AIProviderBadge";
import { useLanguage } from "@/lib/language-context";
import SettingsModal from "@/components/SettingsModal";

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
  aiProvider?: string | null;
  aiModel?: string | null;
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
  const { translate, language } = useLanguage();
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatRoomsLoading, setIsChatRoomsLoading] = useState(false);
  const [isPromptsExpanded, setIsPromptsExpanded] = useState(true);
  const [isChatRoomsExpanded, setIsChatRoomsExpanded] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [showFooterMenu, setShowFooterMenu] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const footerMenuRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (footerMenuRef.current && !footerMenuRef.current.contains(event.target as Node)) {
        setShowFooterMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        className={`fixed top-14 lg:top-16 left-0 h-[calc(100vh-3.5rem-4rem)] lg:h-[calc(100vh-4rem)] w-80 bg-white/50 dark:bg-white/5 backdrop-blur-md border-r border-white/40 dark:border-white/20 transition-transform duration-300 z-40 flex flex-col shadow-xl shadow-black/10 dark:shadow-black/30
          ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Action Buttons */}
        <div className="p-4 border-b border-white/40 dark:border-white/20 space-y-3">
          <Link
            href="/generate"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
            onClick={onClose}
          >
            <Plus className="h-5 w-5" />
            {translate("새 프롬프트 생성")}
          </Link>
          <Link
            href="/prompts/new"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
            onClick={onClose}
          >
            <FileText className="h-5 w-5" />
            {translate("프롬프트 등록")}
          </Link>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sidebar-scroll">
          {/* Prompts Section */}
          <div className="mb-6">
            <button
              onClick={() => setIsPromptsExpanded(!isPromptsExpanded)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2">
                {isPromptsExpanded ? (
                <ChevronDown className="h-4 w-4 text-foreground dark:text-[#40f8ff]" />
                ) : (
                <ChevronRight className="h-4 w-4 text-foreground dark:text-[#40f8ff]" />
                )}
              <FileText className="h-4 w-4 text-foreground dark:text-[#40f8ff]" />
                <span>{translate("프롬프트")}</span>
              <span className="ml-1 px-1.5 py-0.5 text-foreground text-xs rounded-full font-semibold opacity-60">
                  {parentPrompts.length}
                </span>
              </div>
            </button>

            {isPromptsExpanded && (
              <div className="mt-2 space-y-1">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-foreground dark:text-[#40f8ff]" />
                  </div>
                ) : parentPrompts.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{translate("저장된 프롬프트가 없습니다")}</p>
                  </div>
                ) : (
                  parentPrompts.map((prompt) => {
                    const hasRefinements = prompt.refinements && prompt.refinements.length > 0;
                    const isExpanded = expandedFolders.has(prompt.id);
                    const provider = prompt.aiProvider && isAIProvider(prompt.aiProvider) ? prompt.aiProvider : null;

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
                              className="p-1 hover:opacity-70 transition-opacity"
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
                            className="flex-1 block w-full text-left px-3 py-2.5 rounded-lg hover:opacity-70 transition-opacity group"
                          >
                            <div className="flex items-start gap-3">
                              {hasRefinements ? (
                                isExpanded ? (
                                  <FolderOpen className="h-4 w-4 text-foreground dark:text-[#40f8ff] flex-shrink-0 mt-0.5" />
                                ) : (
                                  <Folder className="h-4 w-4 text-foreground dark:text-[#40f8ff] flex-shrink-0 mt-0.5" />
                                )
                              ) : (
                                <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="text-sm font-medium truncate flex-1 min-w-0">
                                    {prompt.topic}
                                  </h4>
                                  {hasRefinements && (
                                    <span className="px-1.5 py-0.5 text-foreground text-xs rounded-full font-semibold opacity-60 flex-shrink-0">
                                      {prompt.refinements?.length || 0}
                                    </span>
                                  )}
                                  {provider && (
                                    <div className="flex-shrink-0">
                                      <AIProviderBadge provider={provider} model={prompt.aiModel || undefined} size="sm" />
                                    </div>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {formatDistanceToNow(new Date(prompt.createdAt), {
                                    addSuffix: true,
                                    locale: language === "ko" ? ko : enUS,
                                  })}
                                </p>
                              </div>
                            </div>
                          </Link>
                        </div>

                        {/* Child Refinements */}
                        {hasRefinements && isExpanded && prompt.refinements && (
                          <div className="ml-6 mt-1 space-y-1 border-l-2 border-border/30 dark:border-white/20 pl-2">
                            {prompt.refinements.map((refinement) => (
                              <Link
                                key={refinement.id}
                                href={`/prompt/${refinement.id}`}
                                onClick={onClose}
                                className="block w-full text-left px-3 py-2 rounded-lg hover:opacity-70 transition-opacity group"
                              >
                                <div className="flex items-start gap-3">
                                  <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium truncate mb-0.5 opacity-90">
                                      {refinement.topic}
                                    </h4>
                                    <p className="text-xs text-muted-foreground truncate">
                                    {formatDistanceToNow(new Date(refinement.createdAt), {
                                      addSuffix: true,
                                      locale: language === "ko" ? ko : enUS,
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
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-bold hover:opacity-70 transition-opacity"
            >
              <div className="flex items-center gap-2">
                {isChatRoomsExpanded ? (
                <ChevronDown className="h-4 w-4 text-foreground dark:text-[#40f8ff]" />
                ) : (
                <ChevronRight className="h-4 w-4 text-foreground dark:text-[#40f8ff]" />
                )}
              <MessageSquare className="h-4 w-4 text-foreground dark:text-[#40f8ff]" />
                <span>{translate("A.IDEAL SPACE")}</span>
              <span className="ml-1 px-1.5 py-0.5 text-foreground text-xs rounded-full font-semibold opacity-60">
                  {chatRooms.length}
                </span>
              </div>
            </button>

            {isChatRoomsExpanded && (
              <div className="mt-2 space-y-2">
                {isChatRoomsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-foreground dark:text-[#40f8ff]" />
                  </div>
                ) : chatRooms.length === 0 ? (
                  <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p>{translate("참여 중인 채팅방이 없습니다")}</p>
                  </div>
                ) : (
                  chatRooms.map((room) => (
                    <Link
                      key={room.id}
                      href={`/challengers/${room.challengeId}/chat`}
                      onClick={onClose}
                      className="block w-full text-left px-3 py-3 rounded-lg hover:opacity-70 transition-opacity group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Users className="h-5 w-5 text-foreground dark:text-[#40f8ff]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-semibold truncate">
                              {room.challengeTitle}
                            </h4>
                            {room.isOwner && (
                              <span className="px-1.5 py-0.5 text-foreground text-xs rounded font-semibold flex-shrink-0 opacity-60">
                                {translate("방장")}
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
                                locale: language === "ko" ? ko : enUS,
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
        <div className="p-4 border-t border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md relative" ref={footerMenuRef}>
          <button
            onClick={() => setShowFooterMenu((prev) => !prev)}
            className="w-full flex items-center gap-3 text-left hover:opacity-70 transition-opacity px-2 py-2"
            aria-haspopup="true"
            aria-expanded={showFooterMenu}
          >
            <div className="h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-foreground dark:text-[#40f8ff] text-sm font-semibold">
                {session.user?.name?.charAt(0) || session.user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {session.user?.name || translate("사용자")}
              </p>
              <p className="text-xs text-muted-foreground truncate">{session.user?.email}</p>
            </div>
            <ChevronUp
              className={`h-4 w-4 text-muted-foreground transition-transform ${showFooterMenu ? "rotate-180" : ""}`}
            />
          </button>

          {showFooterMenu && (
            <div className="absolute left-4 right-4 bottom-16 bg-white dark:bg-[#0b0d1b] backdrop-blur-xl border border-white/40 dark:border-white/20 rounded-xl shadow-xl shadow-black/20 dark:shadow-black/50 py-2 z-10">
              {session.user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/80 dark:hover:bg-white/10 transition-colors text-foreground dark:text-white"
                  onClick={() => {
                    setShowFooterMenu(false);
                    onClose?.();
                  }}
                >
                  <Shield className="h-4 w-4" />
                  {translate("관리자 페이지")}
                </Link>
              )}
              <Link
                href="/billing"
                className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-white/80 dark:hover:bg-white/10 transition-colors text-foreground dark:text-white"
                onClick={() => {
                  setShowFooterMenu(false);
                  onClose?.();
                }}
              >
                <CreditCard className="h-4 w-4" />
                {translate("플랜 업그레이드")}
              </Link>
              <button
                onClick={() => {
                  setShowFooterMenu(false);
                  setIsSettingsOpen(true);
                }}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-white/80 dark:hover:bg-white/10 transition-colors text-foreground dark:text-white"
              >
                <Settings className="h-4 w-4" />
                {translate("설정")}
              </button>
            </div>
          )}
        </div>
      </aside>
      <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
