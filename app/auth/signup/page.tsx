"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Sparkles, Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    hasLetter: false,
    hasNumber: false,
    hasSpecial: false,
    hasLength: false,
  });

  const validatePassword = (password: string) => {
    setPasswordValidation({
      hasLetter: /[a-zA-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password),
      hasLength: password.length >= 8,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      validatePassword(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    const isPasswordValid = Object.values(passwordValidation).every(Boolean);
    if (!isPasswordValid) {
      setError("비밀번호 요구사항을 모두 충족해주세요");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "회원가입에 실패했습니다");
      }

      // Redirect to signin page
      router.push("/auth/signin?message=회원가입이 완료되었습니다. 로그인해주세요.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const allValid = Object.values(passwordValidation).every(Boolean);

  return (
    <div className="min-h-screen flex items-center justify-center relative px-4 py-8">
      {/* Global Background Effects */}
      <div className="fixed inset-0 gradient-bg opacity-100 pointer-events-none"></div>
      <div className="fixed inset-0 hero-grain pointer-events-none"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/landing" className="flex items-center justify-center mb-8 space-x-2">
          <Sparkles className="h-8 w-8 text-[#ADD8E6] dark:text-[#00FFC8]" />
          <span className="text-3xl font-semibold text-foreground dark:text-white/90">A.IDEAL</span>
        </Link>

        {/* Card */}
        <div className="card-aurora rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-semibold text-center mb-2 text-foreground dark:text-white/90">계정 만들기</h1>
          <p className="text-center text-muted-foreground dark:text-white/80 mb-8">
            A.IDEAL과 함께 시작하세요
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/20 dark:bg-red-500/10 backdrop-blur-md border border-red-500/40 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm shadow-lg shadow-black/5 dark:shadow-black/15">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2 text-foreground dark:text-white/90">
                이름 (선택)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-white/60 h-5 w-5" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="홍길동"
                  className="input-aurora w-full pl-12 pr-4 py-3.5 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60"
                />
              </div>
            </div>

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

              {/* Password Requirements */}
              <div className="mt-3 space-y-2 text-sm">
                <div className={`flex items-center gap-2 ${passwordValidation.hasLength ? "text-green-600 dark:text-green-400" : "text-muted-foreground dark:text-white/60"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasLength ? "bg-green-600 dark:bg-green-400" : "bg-muted-foreground dark:bg-white/40"}`} />
                  최소 8자 이상
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasLetter ? "text-green-600 dark:text-green-400" : "text-muted-foreground dark:text-white/60"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasLetter ? "bg-green-600 dark:bg-green-400" : "bg-muted-foreground dark:bg-white/40"}`} />
                  영문 포함
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? "text-green-600 dark:text-green-400" : "text-muted-foreground dark:text-white/60"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasNumber ? "bg-green-600 dark:bg-green-400" : "bg-muted-foreground dark:bg-white/40"}`} />
                  숫자 포함
                </div>
                <div className={`flex items-center gap-2 ${passwordValidation.hasSpecial ? "text-green-600 dark:text-green-400" : "text-muted-foreground dark:text-white/60"}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${passwordValidation.hasSpecial ? "bg-green-600 dark:bg-green-400" : "bg-muted-foreground dark:bg-white/40"}`} />
                  특수문자 포함 (@$!%*?&)
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-foreground dark:text-white/90">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-white/60 h-5 w-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="input-aurora w-full pl-12 pr-12 py-3.5 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/60"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground dark:text-white/60 hover:text-foreground dark:hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !allValid || formData.password !== formData.confirmPassword}
              className="w-full py-3.5 rounded-xl font-medium border-2 border-white/40 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-md text-foreground dark:text-white hover:bg-white/70 dark:hover:bg-white/15 transition-all shadow-lg shadow-black/8 dark:shadow-black/15 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? "가입 중..." : "계정 만들기"}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground dark:text-white/80">
            이미 계정이 있으신가요?{" "}
            <Link href="/auth/signin" className="text-[#ADD8E6] dark:text-[#00FFC8] hover:underline font-medium">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
