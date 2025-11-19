"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function RootPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (session) {
      // 로그인된 사용자는 홈으로
      router.replace("/home");
    } else {
      // 비로그인 사용자는 랜딩으로
      router.replace("/landing");
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="animate-pulse text-white">Loading...</div>
    </div>
  );
}
