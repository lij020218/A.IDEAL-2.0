"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail, Lock, Eye, EyeOff } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const message = searchParams?.get("message");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        return;
      }

      // Redirect to home page on successful login
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError("로그인 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center mb-8 space-x-2">
          <Sparkles className="h-8 w-8 text-[#ADD8E6] dark:text-[#00FFC8]" />
          <span className="text-3xl font-semibold text-foreground dark:text-white/90">A.IDEAL</span>
        </Link>

        {/* Card */}
        <div className="card-aurora rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-semibold text-center mb-2 text-foreground dark:text-white/90">로그인</h1>
          <p className="text-center text-muted-foreground dark:text-white/80 mb-8">
            A.IDEAL에 오신 것을 환영합니다
          </p>

          {/* Success Message */}
          {message && (
            <div className="mb-6 p-4 bg-green-500/20 dark:bg-green-500/10 backdrop-blur-md border border-green-500/40 dark:border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm shadow-lg shadow-black/5 dark:shadow-black/15">
              {message}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md border border-red-500/40 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm shadow-lg shadow-black/5 dark:shadow-black/15">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-foreground dark:text-white/90">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-white/60 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="example@email.com"
                  required
                  className="input-aurora w-full pl-12 pr-4 py-3.5 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-foreground dark:text-white/90">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-white/60 h-5 w-5" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="input-aurora w-full pl-12 pr-12 py-3.5 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-medium border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground dark:text-white hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground dark:text-white/80">
            계정이 없으신가요?{" "}
            <Link href="/auth/signup" className="text-[#ADD8E6] dark:text-[#00FFC8] hover:underline font-medium">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
