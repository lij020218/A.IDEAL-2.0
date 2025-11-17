"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Send, Loader2, ArrowLeft, Users, UserCircle, Paperclip, X, File, FileImage, Calendar, Plus, Square, Github } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import CalendarModal from "@/components/CalendarModal";
import WhiteboardModal from "@/components/WhiteboardModal";

interface ChatMember {
  id: string;
  role: string;
  experience: string;
  isOwner: boolean;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

interface Challenge {
  id: string;
  title: string;
}

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageId: string; content: string } | null>(null);
  const [messageToAddToWhiteboard, setMessageToAddToWhiteboard] = useState<{ content: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (session && params.id) {
      fetchChatRoom();
      fetchMessages();
      // Poll for new messages every 3 seconds
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    } else if (!session) {
      router.push("/auth/signin");
    }
  }, [session, params.id]);

  const prevMessagesLengthRef = useRef(messages.length);

  useEffect(() => {
    // Only scroll if new messages were added
    if (messages.length > prevMessagesLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  const fetchChatRoom = async () => {
    try {
      const response = await fetch(`/api/challenges/${params.id}/chat`);
      if (response.ok) {
        const data = await response.json();
        setChallenge(data.challenge);
        setMembers(data.members);
      } else {
        alert("채팅방에 접근할 수 없습니다");
        router.push(`/challengers/${params.id}`);
      }
    } catch (error) {
      console.error("Error fetching chat room:", error);
      router.push(`/challengers/${params.id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/challenges/${params.id}/chat/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("파일 크기는 10MB를 초과할 수 없습니다");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    try {
      let fileUrl = null;
      let fileName = null;
      let fileType = null;

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          fileUrl = uploadData.url;
          fileName = uploadData.filename;
          fileType = uploadData.type;
        } else {
          alert("파일 업로드에 실패했습니다");
          setIsSending(false);
          setIsUploading(false);
          return;
        }
        setIsUploading(false);
      }

      // Send message with or without file
      const response = await fetch(`/api/challenges/${params.id}/chat/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageContent,
          fileUrl,
          fileName,
          fileType,
        }),
      });

      if (response.ok) {
        await fetchMessages();
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        alert("메시지 전송에 실패했습니다");
        setNewMessage(messageContent);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("메시지 전송에 실패했습니다");
      setNewMessage(messageContent);
    } finally {
      setIsSending(false);
      setIsUploading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleRightClick = (e: React.MouseEvent, messageId: string, content: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId,
      content,
    });
  };

  const handleAddToWhiteboard = () => {
    if (contextMenu) {
      setMessageToAddToWhiteboard({ content: contextMenu.content });
      setShowWhiteboard(true);
      setContextMenu(null);
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      setContextMenu(null);
      // Check if click is outside the plus menu
      const target = e.target as HTMLElement;
      if (!target.closest('.plus-menu-container')) {
        setShowPlusMenu(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

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
          <p className="text-muted-foreground mt-4">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/challengers/${params.id}`)}
          className="mb-4 flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10 transition-all shadow-lg shadow-black/8 dark:shadow-black/15"
        >
          <ArrowLeft className="h-4 w-4" />
          도전 상세로 돌아가기
        </button>

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-foreground dark:text-white/90">
              A.IDEAL SPACE: <span className="text-foreground dark:text-white/90">{challenge.title}</span>
            </h1>
            <p className="text-muted-foreground dark:text-white/80">팀원들과 함께 아이디어를 실현해보세요</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCalendar(true)}
              className="btn-aurora px-4 py-2 rounded-lg flex items-center gap-2"
              title="일정 관리"
            >
              <Calendar className="h-5 w-5" />
              일정
            </button>
            <button
              onClick={() => setShowWhiteboard(true)}
              className="btn-aurora px-4 py-2 rounded-lg flex items-center gap-2"
              title="화이트보드"
            >
              <Square className="h-5 w-5" />
              화이트보드
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Members Sidebar */}
          <div className="lg:col-span-1 flex">
            <div className="card-aurora rounded-xl p-6 flex flex-col w-full" style={{ height: "70vh", minHeight: "500px" }}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground dark:text-white/90">팀원 ({members.length})</h2>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {members.map((member) => (
                  <div key={member.id} className="p-3 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-lg shadow-lg shadow-black/5 dark:shadow-black/15">
                    <div className="flex items-start gap-2">
                      <UserCircle className="h-5 w-5 text-muted-foreground dark:text-white/80 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate text-foreground dark:text-white/90">
                            {member.user.name || "익명"}
                          </p>
                          {member.isOwner && (
                            <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded backdrop-blur-sm">
                              방장
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground dark:text-white/80 mt-1">
                          {member.role === "designer" ? "디자이너" :
                           member.role === "developer" ? "개발자" :
                           member.role === "pm" ? "기획자/PM" :
                           member.role === "marketer" ? "마케터" :
                           member.role === "business" ? "사업개발/BD" :
                           member.role === "data" ? "데이터 분석가" :
                           member.role === "content" ? "콘텐츠 크리에이터" :
                           member.role === "sales" ? "영업/세일즈" :
                           member.role === "finance" ? "재무/회계" :
                           member.role === "hr" ? "인사/HR" :
                           member.role === "legal" ? "법무" :
                           member.role === "investor" ? "투자자" :
                           member.role === "mentor" ? "멘토/자문" :
                           member.role}
                        </p>
                        <p className="text-xs text-muted-foreground dark:text-white/80 mt-1 line-clamp-2">
                          {member.experience}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* GitHub Integration */}
              <div className="p-4 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-lg shadow-lg shadow-black/5 dark:shadow-black/15">
                <div className="flex items-center gap-2 mb-3">
                  <Github className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground dark:text-white/90">GitHub 연동</h3>
                </div>
                <p className="text-xs text-muted-foreground dark:text-white/80 mb-3">
                  팀의 GitHub 저장소를 연결하여 커밋과 이슈를 추적하세요
                </p>
                <button className="w-full px-3 py-2 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-white/60 dark:hover:bg-white/10 transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-black/8 dark:shadow-black/15">
                  <Github className="h-4 w-4" />
                  저장소 연결
                </button>
                <div className="mt-3 text-xs text-muted-foreground dark:text-white/80">
                  <p className="opacity-60">연결된 저장소가 없습니다</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 flex">
            <div className="card-aurora rounded-xl p-6 flex flex-col w-full" style={{ height: "70vh", minHeight: "500px" }}>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-12">
                    <p>첫 메시지를 보내보세요!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isOwnMessage = message.user.id === session?.user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-4 cursor-pointer ${
                            isOwnMessage
                              ? "bg-white/60 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/20 text-foreground shadow-lg shadow-black/5 dark:shadow-black/15"
                              : "bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/30 dark:border-white/10 shadow-md shadow-black/5 dark:shadow-black/10"
                          }`}
                          onContextMenu={(e) => handleRightClick(e, message.id, message.content)}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-semibold mb-1 opacity-70 dark:text-white/80">
                              {message.user.name || message.user.email}
                            </p>
                          )}
                          {message.content && (
                            <p className="whitespace-pre-wrap text-sm text-foreground dark:text-white">{message.content}</p>
                          )}
                          {message.fileUrl && (
                            <div className="mt-2">
                              {message.fileType?.startsWith("image/") ? (
                                <a
                                  href={message.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={message.fileUrl}
                                    alt={message.fileName || "Image"}
                                    className="max-w-full rounded-lg max-h-64 object-contain"
                                  />
                                  <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                                    <FileImage className="h-3 w-3" />
                                    {message.fileName}
                                  </p>
                                </a>
                              ) : (
                                <a
                                  href={message.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 p-3 rounded-lg border border-white/40 dark:border-white/20 ${
                                    isOwnMessage
                                      ? "bg-white/40 dark:bg-white/5 backdrop-blur-sm hover:bg-white/50 dark:hover:bg-white/10"
                                      : "bg-white/30 dark:bg-white/5 backdrop-blur-sm hover:bg-white/40 dark:hover:bg-white/10"
                                  } transition-all`}
                                >
                                  <File className="h-5 w-5 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs truncate">{message.fileName}</p>
                                    <p className="text-xs opacity-70">파일 다운로드</p>
                                  </div>
                                </a>
                              )}
                            </div>
                          )}
                          <p
                            className={`text-xs mt-2 ${
                              isOwnMessage ? "opacity-70" : "text-muted-foreground"
                            }`}
                          >
                            {formatDistanceToNow(new Date(message.createdAt), {
                              addSuffix: true,
                              locale: ko,
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Form */}
              <div className="space-y-2">
                {/* File Preview */}
                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-lg shadow-lg shadow-black/5 dark:shadow-black/15">
                    {selectedFile.type.startsWith("image/") ? (
                      <FileImage className="h-5 w-5 text-primary" />
                    ) : (
                      <File className="h-5 w-5 text-primary" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  <div className="relative plus-menu-container">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPlusMenu(!showPlusMenu);
                      }}
                      disabled={isSending || isUploading}
                      className="h-[52px] px-3 rounded-lg border-2 border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md hover:bg-white/60 dark:hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-black/8 dark:shadow-black/15"
                      title="추가 옵션"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                    {showPlusMenu && (
                      <div className="absolute bottom-full left-0 mb-2 bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-lg shadow-xl shadow-black/10 dark:shadow-black/30 overflow-hidden z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                            setShowPlusMenu(false);
                          }}
                          className="w-full px-4 py-3 hover:bg-white/60 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-left whitespace-nowrap"
                        >
                          <Paperclip className="h-4 w-4" />
                          파일 첨부
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowWhiteboard(true);
                            setShowPlusMenu(false);
                          }}
                          className="w-full px-4 py-3 hover:bg-white/60 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-left whitespace-nowrap"
                        >
                          <Square className="h-4 w-4" />
                          화이트보드
                        </button>
                      </div>
                    )}
                  </div>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="메시지를 입력하세요... (Shift+Enter로 줄바꿈)"
                    className="input-aurora flex-1 px-4 py-3 rounded-lg resize-none h-[52px]"
                    disabled={isSending || isUploading}
                  />
                  <button
                    type="submit"
                    disabled={isSending || isUploading || (!newMessage.trim() && !selectedFile)}
                    className="h-[52px] px-6 rounded-lg flex items-center justify-center gap-2 border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending || isUploading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        {isUploading && <span className="text-sm">업로드 중...</span>}
                      </>
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white/80 dark:bg-white/10 backdrop-blur-md border border-white/40 dark:border-white/20 rounded-lg shadow-xl shadow-black/10 dark:shadow-black/30 py-1 z-50"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={handleAddToWhiteboard}
            className="w-full px-4 py-2 hover:bg-white/60 dark:hover:bg-white/20 transition-colors flex items-center gap-2 text-left"
          >
            <Square className="h-4 w-4" />
            화이트보드에 추가
          </button>
        </div>
      )}

      {/* Modals */}
      <CalendarModal
        isOpen={showCalendar}
        onClose={() => setShowCalendar(false)}
        challengeId={params.id as string}
        currentUserId={session?.user?.id}
      />
      <WhiteboardModal
        isOpen={showWhiteboard}
        onClose={() => {
          setShowWhiteboard(false);
          setMessageToAddToWhiteboard(null);
        }}
        challengeId={params.id as string}
        messageToAdd={messageToAddToWhiteboard}
        onMessageAdded={() => setMessageToAddToWhiteboard(null)}
      />
    </div>
  );
}
