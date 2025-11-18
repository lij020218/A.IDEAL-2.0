"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { FileText, Users, MessageSquare, Shield } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { translate } = useLanguage();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.role !== "admin") {
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!session || session.user?.role !== "admin") {
    return null;
  }

  const adminMenus = [
    {
      title: translate("프롬프트 관리"),
      description: translate("사용자들이 등록한 프롬프트와 댓글을 관리합니다"),
      icon: FileText,
      href: "/admin/prompts",
      color: "text-blue-500",
    },
    {
      title: translate("도전자들 관리"),
      description: translate("도전자들 게시글과 댓글을 관리합니다"),
      icon: Users,
      href: "/admin/challenges",
      color: "text-green-500",
    },
    {
      title: translate("A.IDEAL SPACE 관리"),
      description: translate("채팅방을 관리합니다"),
      icon: MessageSquare,
      href: "/admin/spaces",
      color: "text-purple-500",
    },
  ];

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-foreground dark:text-[#40f8ff]" />
          <h1 className="text-3xl font-bold">{translate("관리자 페이지")}</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {adminMenus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="block p-6 rounded-xl border border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/5 backdrop-blur-md hover:bg-white/80 dark:hover:bg-white/10 transition-all shadow-lg"
            >
              <menu.icon className={`h-8 w-8 ${menu.color} mb-4`} />
              <h2 className="text-lg font-semibold mb-2">{menu.title}</h2>
              <p className="text-sm text-muted-foreground">{menu.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
