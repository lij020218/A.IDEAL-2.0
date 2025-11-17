"use client";

import { useEffect, useRef, useState } from "react";
import { X, Globe, Shield, UserCog, Sparkles, Palette } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useTheme } from "@/lib/theme-context";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const tabs = [
  { id: "general", label: "일반", icon: Globe },
  { id: "account", label: "계정", icon: UserCog },
  { id: "security", label: "보안", icon: Shield },
  { id: "personal", label: "개인 맞춤", icon: Sparkles },
];

export default function SettingsModal({ open, onClose }: SettingsModalProps) {
  const { language, setLanguage, translate } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("keydown", onKey);
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const renderTab = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <section className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground dark:text-white/90">{translate("언어")}</h3>
              <p className="text-sm text-muted-foreground dark:text-white/80">
                {translate("인터페이스에 사용할 언어를 선택하세요.")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setLanguage("ko")}
                  className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                    language === "ko"
                      ? "border-white/60 dark:border-white/40 bg-white/70 dark:bg-white/15 backdrop-blur-md text-foreground dark:text-white shadow-lg shadow-black/8 dark:shadow-black/15"
                      : "border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10"
                  }`}
                >
                  한국어
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                    language === "en"
                      ? "border-white/60 dark:border-white/40 bg-white/70 dark:bg-white/15 backdrop-blur-md text-foreground dark:text-white shadow-lg shadow-black/8 dark:shadow-black/15"
                      : "border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10"
                  }`}
                >
                  English
                </button>
              </div>
            </section>

            <section className="space-y-2">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground dark:text-white/90">
                <Palette className="h-4 w-4 text-foreground dark:text-white/90" />
                {translate("테마")}
              </h3>
              <p className="text-sm text-muted-foreground dark:text-white/80">
                {translate("눈의 피로를 줄이기 위해 밝기 모드를 전환하세요.")}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setTheme("light")}
                  className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                    theme === "light"
                      ? "border-white/60 dark:border-white/40 bg-white/70 dark:bg-white/15 backdrop-blur-md text-foreground dark:text-white shadow-lg shadow-black/8 dark:shadow-black/15"
                      : "border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10"
                  }`}
                >
                  {translate("라이트 모드")}
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`px-4 py-2 rounded-lg border-2 text-sm transition-all ${
                    theme === "dark"
                      ? "border-white/60 dark:border-white/40 bg-white/70 dark:bg-white/15 backdrop-blur-md text-foreground dark:text-white shadow-lg shadow-black/8 dark:shadow-black/15"
                      : "border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md text-foreground dark:text-white hover:bg-white/60 dark:hover:bg-white/10"
                  }`}
                >
                  {translate("다크 모드")}
                </button>
              </div>
            </section>
          </div>
        );
      case "account":
        return (
          <PlaceholderSection
            title={translate("계정 설정")}
            description={translate("프로필 정보와 알림 설정을 곧 추가할 예정입니다.")}
          />
        );
      case "security":
        return (
          <PlaceholderSection
            title={translate("보안 설정")}
            description={translate("2단계 인증과 로그인 기록 기능을 준비 중입니다.")}
          />
        );
      case "personal":
        return (
          <PlaceholderSection
            title={translate("개인 맞춤")}
            description={translate("추천 프롬프트와 알림을 더 정교하게 제어할 수 있도록 준비 중입니다.")}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div
        ref={dialogRef}
        className="w-full max-w-5xl bg-white/80 dark:bg-[#0b0d1b]/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/20 overflow-hidden animate-fade-in"
      >
        <div className="flex flex-col md:flex-row">
          <aside className="md:w-1/3 border-b md:border-b-0 md:border-r border-white/40 dark:border-white/20 bg-white/50 dark:bg-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between p-5 border-b border-white/40 dark:border-white/20">
              <div>
                <p className="text-lg font-semibold text-foreground dark:text-white/90">{translate("설정")}</p>
                <p className="text-xs text-muted-foreground dark:text-white/80">
                  {translate("계정과 환경을 한 곳에서 관리하세요.")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/60 dark:hover:bg-white/10 transition-colors text-foreground dark:text-white"
                aria-label={translate("닫기")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                      isActive
                        ? "bg-white/70 dark:bg-white/15 backdrop-blur-md border border-white/40 dark:border-white/20 text-foreground dark:text-white shadow-lg shadow-black/8 dark:shadow-black/15"
                        : "hover:bg-white/50 dark:hover:bg-white/5 text-foreground dark:text-white/80"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 ${
                        isActive ? "text-foreground dark:text-white" : "text-muted-foreground dark:text-white/60"
                      }`}
                    />
                    {translate(tab.label)}
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="flex-1 p-6 md:p-8 overflow-y-auto max-h-[70vh]">
            {renderTab()}
          </section>
        </div>
      </div>
    </div>
  );
}

function PlaceholderSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="text-center py-12">
      <p className="text-lg font-semibold mb-2 text-foreground dark:text-white/90">{title}</p>
      <p className="text-sm text-muted-foreground dark:text-white/80">{description}</p>
    </div>
  );
}


