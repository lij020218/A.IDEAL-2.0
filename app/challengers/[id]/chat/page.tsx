"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import { Send, Loader2, ArrowLeft, Users, UserCircle, Paperclip, X, File, FileImage } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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

  if (!challenge) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Back Button */}
        <button
          onClick={() => router.push(`/challengers/${params.id}`)}
          className="mb-4 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          도전 상세로 돌아가기
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            A.IDEAL SPACE: <span className="gradient-text">{challenge.title}</span>
          </h1>
          <p className="text-muted-foreground">팀원들과 함께 아이디어를 실현해보세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Members Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-aurora rounded-xl p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">팀원 ({members.length})</h2>
              </div>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.id} className="p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <UserCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {member.user.name || "익명"}
                          </p>
                          {member.isOwner && (
                            <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-xs rounded">
                              방장
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
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
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {member.experience}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <div className="card-aurora rounded-xl p-6 flex flex-col" style={{ height: "70vh", minHeight: "500px" }}>
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
                          className={`max-w-[70%] rounded-lg p-4 ${
                            isOwnMessage
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          }`}
                        >
                          {!isOwnMessage && (
                            <p className="text-xs font-semibold mb-1 opacity-70">
                              {message.user.name || message.user.email}
                            </p>
                          )}
                          {message.content && (
                            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
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
                                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                                    isOwnMessage
                                      ? "border-primary-foreground/20 hover:bg-primary-foreground/10"
                                      : "border-border hover:bg-secondary"
                                  } transition-colors`}
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
                  <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
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

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="*/*"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSending || isUploading}
                    className="px-3 py-3 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end"
                    title="파일 첨부"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
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
                    className="input-aurora flex-1 px-4 py-3 rounded-lg resize-none"
                    rows={2}
                    disabled={isSending || isUploading}
                  />
                  <button
                    type="submit"
                    disabled={isSending || isUploading || (!newMessage.trim() && !selectedFile)}
                    className="btn-aurora px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed self-end"
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
    </div>
  );
}
