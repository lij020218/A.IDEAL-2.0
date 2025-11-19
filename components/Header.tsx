"use client";

import Link from "next/link";
import {
  Sparkles,
  LogOut,
  User as UserIcon,
  Menu,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import NotificationBell from "./NotificationBell";

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { t, translate } = useLanguage();
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/landing" });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 lg:h-16 items-center justify-between px-3 lg:px-4">
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
          <Link href={session ? "/home" : "/landing"} className="flex items-center space-x-2">
            <span className="text-xl lg:text-2xl font-semibold">A.IDEAL</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/prompts/list"
            className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${
              pathname?.startsWith("/prompts") && pathname !== "/"
                ? "bg-white/70 dark:bg-white/15 backdrop-blur-xl border border-white/60 dark:border-white/30 text-foreground dark:text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-50 relative overflow-hidden"
                : "text-foreground dark:text-white/80 hover:bg-white/50 dark:hover:bg-white/8 hover:backdrop-blur-lg hover:shadow-md transition-all"
            }`}
          >
            {translate("프롬프트")}
          </Link>
          <Link
            href="/generate"
            className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${
              pathname?.startsWith("/generate")
                ? "bg-white/70 dark:bg-white/15 backdrop-blur-xl border border-white/60 dark:border-white/30 text-foreground dark:text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-50 relative overflow-hidden"
                : "text-foreground dark:text-white/80 hover:bg-white/50 dark:hover:bg-white/8 hover:backdrop-blur-lg hover:shadow-md transition-all"
            }`}
          >
            {t.header.generate}
          </Link>
          <Link
            href="/grow"
            className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${
              pathname?.startsWith("/grow")
                ? "bg-white/70 dark:bg-white/15 backdrop-blur-xl border border-white/60 dark:border-white/30 text-foreground dark:text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-50 relative overflow-hidden"
                : "text-foreground dark:text-white/80 hover:bg-white/50 dark:hover:bg-white/8 hover:backdrop-blur-lg hover:shadow-md transition-all"
            }`}
          >
            {translate("성장하기")}
          </Link>
          <Link
            href="/challengers"
            className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${
              pathname?.startsWith("/challengers")
                ? "bg-white/70 dark:bg-white/15 backdrop-blur-xl border border-white/60 dark:border-white/30 text-foreground dark:text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-50 relative overflow-hidden"
                : "text-foreground dark:text-white/80 hover:bg-white/50 dark:hover:bg-white/8 hover:backdrop-blur-lg hover:shadow-md transition-all"
            }`}
          >
            {translate("도전자들")}
          </Link>
          <Link
            href="/tools"
            className={`text-sm font-medium transition-all px-4 py-2 rounded-full ${
              pathname?.startsWith("/tools")
                ? "bg-white/70 dark:bg-white/15 backdrop-blur-xl border border-white/60 dark:border-white/30 text-foreground dark:text-white shadow-[0_8px_32px_0_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-br before:from-white/40 before:to-transparent before:opacity-50 relative overflow-hidden"
                : "text-foreground dark:text-white/80 hover:bg-white/50 dark:hover:bg-white/8 hover:backdrop-blur-lg hover:shadow-md transition-all"
            }`}
          >
            {translate("AI 도구")}
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          {session && <NotificationBell />}

          {session ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center gap-3 rounded-full border border-primary/20 bg-secondary/50 px-2 py-1.5 hover:border-primary/40 transition-colors"
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-purple-500 text-primary-foreground flex items-center justify-center font-semibold">
                  {userInitial}
                </div>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    내 계정
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {userName}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showUserMenu && (
                <div className="fixed right-4 top-[calc(3.5rem+0.5rem)] lg:top-[calc(4rem+0.5rem)] w-56 card-aurora rounded-xl shadow-lg py-2 border border-primary/10 z-[100]">
                  <Link
                    href="/profile"
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <UserIcon className="h-4 w-4" />
                    마이페이지
                  </Link>
                  <Link
                    href="/dashboard"
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    대시보드
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors flex items-center gap-2"
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
