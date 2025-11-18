import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/language-context";
import Providers from "@/components/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "A.IDEAL - 프리미엄 AI 프롬프트 라이브러리",
  description: "맞춤형 AI 도구 추천과 함께하는 고품질 프롬프트를 발견하세요",
  keywords: ["AI", "프롬프트", "ChatGPT", "Claude", "Midjourney", "프롬프트 라이브러리"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </Providers>
      </body>
    </html>
  );
}
