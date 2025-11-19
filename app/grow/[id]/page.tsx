"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import LeftSidebar from "@/components/LeftSidebar";
import GrowthCalendar from "@/components/GrowthCalendar";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  Target,
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  Pause,
  Play,
  CheckCircle2,
  Trash2,
  Upload,
  FileText,
  X,
  Rocket,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Curriculum {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  description: string;
  objectives: string;
  content: string;
  exercises: string | null;
  resources: string | null;
  estimatedTime: number;
  progressStatus: string;
  progressId?: string;
}

interface Topic {
  id: string;
  title: string;
  description: string | null;
  goal: string;
  level: string;
  duration: number;
  startDate: string;
  endDate: string;
  status: string;
  curriculum: Curriculum[];
}

export default function GrowthTopicDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 추가 파일 업로드 관련 state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [examFiles, setExamFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ url: string; filename: string; size: number }>>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }

    if (status === "authenticated") {
      fetchTopic();
    }
  }, [status, router, params.id]);

  const fetchTopic = async () => {
    try {
      const response = await fetch(`/api/growth/topics/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTopic(data.topic);
      } else {
        router.push("/grow");
      }
    } catch (error) {
      console.error("Error fetching topic:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!topic) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/growth/topics/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setTopic({ ...topic, status: newStatus });
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!topic) return;

    if (!confirm("정말 이 학습 주제를 삭제하시겠습니까? 모든 진도 기록이 삭제됩니다.")) {
      return;
    }

    try {
      const response = await fetch(`/api/growth/topics/${params.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/grow");
      }
    } catch (error) {
      console.error("Error deleting topic:", error);
    }
  };

  const getLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      beginner: "초급",
      intermediate: "중급",
      advanced: "고급",
    };
    return labels[level] || level;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: "진행 중",
      paused: "일시정지",
      completed: "완료",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: "bg-green-500/10 text-green-500",
      paused: "bg-yellow-500/10 text-yellow-500",
      completed: "bg-blue-500/10 text-blue-500",
    };
    return colors[status] || "bg-gray-500/10 text-gray-500";
  };

  const completedCount = topic?.curriculum.filter((c) => c.progressStatus === "completed").length || 0;
  const totalCount = topic?.curriculum.length || 0;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 시험 공부 주제인지 확인 (description이 JSON 배열인지 확인)
  const isExamTopic = topic?.description ? (() => {
    try {
      const parsed = JSON.parse(topic.description);
      return Array.isArray(parsed) && parsed.length > 0 && parsed[0].url;
    } catch {
      return false;
    }
  })() : false;

  // 기존 파일 목록 로드
  useEffect(() => {
    if (isExamTopic && topic?.description) {
      try {
        const parsed = JSON.parse(topic.description);
        if (Array.isArray(parsed)) {
          setUploadedFiles(parsed);
        }
      } catch (e) {
        // JSON 파싱 실패 시 무시
      }
    }
  }, [isExamTopic, topic?.description]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter((file) => file.type === "application/pdf");
    
    if (pdfFiles.length === 0 && files.length > 0) {
      setUploadError("PDF 파일만 업로드 가능합니다.");
      return;
    }

    const remainingSlots = 10 - uploadedFiles.length;
    if (pdfFiles.length > remainingSlots) {
      setUploadError(`최대 ${remainingSlots}개까지 업로드 가능합니다.`);
      return;
    }

    setExamFiles((prev) => [...prev, ...pdfFiles.slice(0, remainingSlots)]);
    setUploadError("");
  };

  const handleRemoveFile = (index: number) => {
    setExamFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadFiles = async () => {
    if (examFiles.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const uploadPromises = examFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error || errorData.details || `파일 업로드 실패: ${file.name}`;
          throw new Error(errorMessage);
        }

        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      setUploadedFiles((prev) => [...prev, ...results]);
      setExamFiles([]);
    } catch (err) {
      console.error("File upload error:", err);
      const errorMessage = err instanceof Error ? err.message : "파일 업로드에 실패했습니다.";
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAdditionalFiles = async () => {
    if (examFiles.length > 0) {
      await handleUploadFiles();
    }

    if (uploadedFiles.length === 0) {
      setUploadError("최소 1개 이상의 파일이 필요합니다.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      const response = await fetch(`/api/growth/topics/${params.id}/files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: uploadedFiles.map((f) => ({
            url: f.url,
            filename: f.filename,
            size: f.size,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "파일 업데이트에 실패했습니다.");
      }

      // 토픽 정보 새로고침
      await fetchTopic();
      setShowUploadModal(false);
      setExamFiles([]);
    } catch (err) {
      console.error(err);
      setUploadError(err instanceof Error ? err.message : "파일 업데이트에 실패했습니다.");
    } finally {
      setIsUploading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header onToggleSidebar={toggleSidebar} />
        <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!topic) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 via-blue-50/30 to-white relative">
      {/* Global Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-96 h-96 bg-sky-100/30 rounded-full blur-3xl" />
      </div>
      <Header onToggleSidebar={toggleSidebar} />
      <LeftSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <main>
        {/* Page Header with Icon */}
        <div className="mb-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-100/70 to-blue-100/70 backdrop-blur-md border border-cyan-200/50 flex items-center justify-center shadow-lg mx-auto mb-4">
              <Rocket className="h-8 w-8 text-cyan-500" />
            </div>
            <Link
              href="/grow"
              className="inline-flex items-center gap-2 text-muted-foreground hover:opacity-80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              목록으로 돌아가기
            </Link>
          </div>
        </div>

        {/* Topic Info Card */}
        <div className="card-container rounded-xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Topic Details */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <h1 className="text-3xl font-bold">{topic.title}</h1>
                <span
                  className={`ml-4 px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap ${getStatusColor(
                    topic.status
                  )}`}
                >
                  {getStatusLabel(topic.status)}
                </span>
              </div>

              {/* description에 파일 정보가 JSON으로 저장되어 있으므로 표시하지 않음 */}

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium mb-1">학습 목표</p>
                    <p className="text-sm text-muted-foreground">{topic.goal}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{getLevelLabel(topic.level)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{topic.duration}일 과정</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {format(new Date(topic.startDate), "yyyy.MM.dd", { locale: ko })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{progressPercentage}% 완료</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Progress Circle */}
            <div className="flex flex-col items-center justify-center lg:min-w-[200px]">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-secondary"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - progressPercentage / 100)}`}
                    className="text-foreground transition-all duration-500"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{progressPercentage}%</p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {completedCount} / {totalCount}일 완료
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
            {topic.status === "active" && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleStatusChange("paused")}
                disabled={isUpdating}
              >
                <Pause className="h-4 w-4" />
                일시정지
              </Button>
            )}
            {topic.status === "paused" && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleStatusChange("active")}
                disabled={isUpdating}
              >
                <Play className="h-4 w-4" />
                재개하기
              </Button>
            )}
            {topic.status !== "completed" && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleStatusChange("completed")}
                disabled={isUpdating}
              >
                <CheckCircle2 className="h-4 w-4" />
                완료 처리
              </Button>
            )}
            {isExamTopic && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowUploadModal(true)}
                disabled={isUpdating}
              >
                <Upload className="h-4 w-4" />
                추가 파일 업로드
              </Button>
            )}
            <Button
              variant="outline"
              className="gap-2 text-red-500 hover:text-red-600 ml-auto"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
              삭제
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <div className="card-container rounded-xl p-8">
          <h2 className="text-2xl font-bold mb-6">학습 캘린더</h2>
          <GrowthCalendar topicId={topic.id} curriculum={topic.curriculum} />
        </div>
        </main>
      </div>

      {/* 추가 파일 업로드 모달 */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-container rounded-xl p-8 max-w-2xl w-full mx-auto my-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">추가 파일 업로드</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setExamFiles([]);
                  setUploadError("");
                }}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  시험 관련 자료 업로드 (PDF 파일, 최대 10개)
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  현재 {uploadedFiles.length}개 파일이 업로드되어 있습니다. 최대 10개까지 업로드 가능합니다.
                </p>

                {/* 업로드된 파일 목록 */}
                {uploadedFiles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-3">업로드된 파일:</p>
                    <div className="bg-secondary rounded-lg border p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-background rounded-lg border"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="text-sm">{file.filename}</span>
                              <span className="text-xs text-muted-foreground">
                                ({(file.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedFile(index)}
                              disabled={isUploading}
                              className="p-1 hover:bg-red-500/20 rounded transition-colors"
                            >
                              <X className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 선택된 파일 목록 (아직 업로드 안 함) */}
                {examFiles.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <p className="text-sm font-medium">업로드 대기 중인 파일:</p>
                    {examFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-yellow-500/10 dark:bg-yellow-500/5 rounded-lg border border-yellow-500/20 dark:border-yellow-500/10"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          disabled={isUploading}
                          className="p-1 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleUploadFiles}
                      disabled={isUploading || examFiles.length === 0}
                      className="w-full px-4 py-2 rounded-lg border-2 border-primary/60 dark:border-primary/40 bg-primary/10 dark:bg-primary/5 backdrop-blur-md text-primary hover:bg-primary/20 dark:hover:bg-primary/10 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          업로드 중...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          파일 업로드 ({examFiles.length}개)
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* 파일 선택 */}
                {uploadedFiles.length < 10 && (
                  <div>
                    <input
                      type="file"
                      id="additionalFileInput"
                      accept=".pdf,application/pdf"
                      multiple
                      onChange={handleFileSelect}
                      disabled={isUploading || uploadedFiles.length >= 10}
                      className="hidden"
                    />
                    <label
                      htmlFor="additionalFileInput"
                      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        uploadedFiles.length >= 10 || isUploading
                          ? "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                          : "border-primary/40 dark:border-primary/30 bg-primary/5 dark:bg-primary/5 hover:bg-primary/10 dark:hover:bg-primary/10"
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          <span className="font-semibold">클릭하여 파일 선택</span> 또는 드래그 앤 드롭
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF 파일만 가능 (최대 {10 - uploadedFiles.length}개 더 업로드 가능)
                        </p>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-4 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md border border-red-500/40 dark:border-red-500/30 rounded-lg text-red-600 dark:text-red-400">
                  {uploadError}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUploadModal(false);
                    setExamFiles([]);
                    setUploadError("");
                  }}
                  disabled={isUploading}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSaveAdditionalFiles}
                  disabled={isUploading || uploadedFiles.length === 0}
                  className="flex-1"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      저장 중...
                    </>
                  ) : (
                    "저장"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
