"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={5 * 60} // 5분마다 세션 자동 갱신
      refetchOnWindowFocus={true} // 창 포커스 시 세션 갱신
    >
      <ThemeProvider>{children}</ThemeProvider>
    </SessionProvider>
  );
}

