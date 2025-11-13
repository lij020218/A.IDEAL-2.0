"use client";

import Link from "next/link";
import { Sparkles, Globe, LogOut, User as UserIcon, Menu } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { data: session } = useSession();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === "ko" ? "en" : "ko");
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          {session && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl font-semibold">A.IDEAL</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/prompts/list"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            프롬프트
          </Link>
          <Link
            href="/generate"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            {t.header.generate}
          </Link>
          <Link
            href="/challengers"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            도전자들
          </Link>
          <Link
            href="/tools"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            AI 도구
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleLanguage}
            className="p-2 hover:bg-accent rounded-md transition-colors flex items-center gap-2"
            title={language === "ko" ? "English" : "한국어"}
          >
            <Globe className="h-5 w-5" />
            <span className="text-sm font-medium">{language === "ko" ? "EN" : "KO"}</span>
          </button>

          {session ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span className="text-sm font-medium">{session.user?.name || session.user?.email}</span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="px-4 py-2 text-sm font-medium transition-colors hover:text-primary"
              >
                로그인
              </Link>
              <Link
                href="/generate"
                className="btn-aurora px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                {t.header.generatePrompt}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
