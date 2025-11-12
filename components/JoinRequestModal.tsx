"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";

interface JoinRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  challengeTitle: string;
  onSuccess: () => void;
}

const ROLE_OPTIONS = [
  { value: "developer", label: "개발자" },
  { value: "designer", label: "디자이너" },
  { value: "pm", label: "기획자/PM" },
  { value: "marketer", label: "마케터" },
  { value: "business", label: "사업개발/BD" },
  { value: "data", label: "데이터 분석가" },
  { value: "content", label: "콘텐츠 크리에이터" },
  { value: "sales", label: "영업/세일즈" },
  { value: "finance", label: "재무/회계" },
  { value: "hr", label: "인사/HR" },
  { value: "legal", label: "법무" },
  { value: "investor", label: "투자자" },
  { value: "mentor", label: "멘토/자문" },
  { value: "other", label: "기타" },
];

export default function JoinRequestModal({
  isOpen,
  onClose,
  challengeId,
  challengeTitle,
  onSuccess,
}: JoinRequestModalProps) {
  const [role, setRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [experience, setExperience] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!role) {
      setError("역할을 선택해주세요");
      return;
    }

    if (role === "other" && !customRole.trim()) {
      setError("기타 역할을 입력해주세요");
      return;
    }

    if (!experience.trim()) {
      setError("경력 사항을 입력해주세요");
      return;
    }

    setIsSubmitting(true);

    const finalRole = role === "other" ? customRole : role;

    try {
      const response = await fetch(`/api/challenges/${challengeId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: finalRole, experience }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setRole("");
        setCustomRole("");
        setExperience("");
      } else {
        const data = await response.json();
        setError(data.error || "참가 신청에 실패했습니다");
      }
    } catch (error) {
      console.error("Error submitting join request:", error);
      setError("참가 신청에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold mb-2">A.IDEAL SPACE 참가 신청</h2>
        <p className="text-sm text-muted-foreground mb-6">
          &quot;{challengeTitle}&quot; 프로젝트에 참가하시겠습니까?
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label htmlFor="role" className="block text-sm font-semibold mb-2">
              역할 선택 <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="input-aurora w-full px-4 py-3 rounded-lg"
              disabled={isSubmitting}
            >
              <option value="">역할을 선택하세요</option>
              {ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Role Input (when "기타" is selected) */}
          {role === "other" && (
            <div>
              <label htmlFor="customRole" className="block text-sm font-semibold mb-2">
                역할 입력 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="customRole"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="예: UI/UX 디자이너, 프론트엔드 개발자"
                className="input-aurora w-full px-4 py-3 rounded-lg"
                disabled={isSubmitting}
              />
            </div>
          )}

          {/* Experience Input */}
          <div>
            <label htmlFor="experience" className="block text-sm font-semibold mb-2">
              경력 사항 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="experience"
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="어느 정도, 어디서 이 일을 했는지 적어주세요&#10;예: 3년차 프론트엔드 개발자, ABC회사에서 근무"
              className="input-aurora w-full px-4 py-3 rounded-lg resize-none"
              rows={4}
              disabled={isSubmitting}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-aurora px-6 py-3 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  신청 중...
                </>
              ) : (
                "신청하기"
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <p className="text-xs text-muted-foreground mt-4 text-center">
          신청 후 프로젝트 생성자의 승인을 기다려주세요
        </p>
      </div>
    </div>
  );
}
