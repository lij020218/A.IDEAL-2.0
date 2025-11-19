"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { MessageSquare, Sparkles, Rocket, Users } from "lucide-react";

const navItems = [
  {
    href: "/prompts/list",
    icon: MessageSquare,
    label: "프롬프트",
    activeColor: "from-orange-500 to-amber-500",
    activeBorder: "border-orange-400/50",
  },
  {
    href: "/generate",
    icon: Sparkles,
    label: "생성",
    activeColor: "from-rose-500 to-red-500",
    activeBorder: "border-rose-400/50",
  },
  {
    href: "/grow",
    icon: Rocket,
    label: "성장",
    activeColor: "from-cyan-500 to-blue-500",
    activeBorder: "border-cyan-400/50",
  },
  {
    href: "/challengers",
    icon: Users,
    label: "도전자들",
    activeColor: "from-purple-500 to-pink-500",
    activeBorder: "border-purple-400/50",
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Glass background */}
      <div className="mx-3 mb-3 rounded-2xl bg-white/70 dark:bg-black/50 backdrop-blur-xl border border-white/50 dark:border-white/20 shadow-lg shadow-black/10 dark:shadow-black/30">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-br ${item.activeColor} text-white shadow-lg border ${item.activeBorder}`
                    : "text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white/90"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-white" : ""}`} />
                <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-white" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
