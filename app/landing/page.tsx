"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Sparkles,
  Brain,
  Rocket,
  MessageSquare,
  BookOpen,
  ChevronDown,
  Users,
  Share2,
  GraduationCap,
  FileText,
  Lightbulb,
  GitBranch,
  Code,
  Pencil,
  Glasses
} from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);

      // Determine current section based on scroll position
      const windowHeight = window.innerHeight;
      const section = Math.floor(window.scrollY / windowHeight);
      setCurrentSection(section);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate opacity and transform based on scroll
  const getTransform = (sectionIndex: number) => {
    const windowHeight = window.innerHeight;
    const sectionStart = sectionIndex * windowHeight;

    // Calculate how far the section top is from the viewport top
    const distanceFromTop = scrollY - sectionStart;

    // Section is most visible when distanceFromTop is 0 (section top at viewport top)
    // Opacity decreases as we scroll away (both directions)
    const normalizedDistance = Math.abs(distanceFromTop) / windowHeight;
    const opacity = Math.max(0, Math.min(1, 1 - normalizedDistance * 1.5));
    const scale = 0.9 + (opacity * 0.1);

    return {
      opacity,
      transform: `scale(${scale})`,
      transition: 'all 0.3s ease-out'
    };
  };

  const scrollToSection = (index: number) => {
    const windowHeight = window.innerHeight;
    window.scrollTo({
      top: index * windowHeight,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative bg-white text-gray-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 md:px-8 h-16 flex items-center backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-cyan-500" />
            <span className="text-xl md:text-2xl font-bold text-gray-900">A.IDEAL</span>
          </div>
          <div className="flex items-center gap-3 md:gap-6">
            <Link
              href="/auth/signin"
              className="text-sm md:text-base text-gray-600 hover:text-gray-900 transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 md:px-6 py-1.5 md:py-2 text-sm md:text-base bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all font-medium shadow-lg shadow-cyan-500/30"
            >
              시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Section Indicators - Hidden on mobile */}
      <div className="hidden md:flex fixed right-6 lg:right-8 top-1/2 -translate-y-1/2 z-50 flex-col gap-3">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <button
            key={index}
            onClick={() => scrollToSection(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              currentSection === index
                ? 'bg-cyan-500 h-8'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to section ${index + 1}`}
          />
        ))}
      </div>

      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative pt-20 md:pt-0 bg-gradient-to-b from-cyan-50/50 via-white to-blue-50/30">
        <div
          className="text-center px-4 max-w-5xl mx-auto"
          style={getTransform(0)}
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold mb-4 md:mb-6 tracking-tight leading-tight text-gray-900">
            아이디어를
            <br />
            <span className="bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              현실로
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4">
            AI가 당신의 프롬프트를 생성하고, 학습 경로를 설계하며,
            <br className="hidden sm:block" />
            커뮤니티와 함께 성장합니다.
          </p>
          <button
            onClick={() => scrollToSection(1)}
            className="animate-bounce hidden md:block mx-auto text-gray-400"
            aria-label="Scroll to next section"
          >
            <ChevronDown className="h-8 w-8" />
          </button>
        </div>

        {/* Floating gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl"
            style={{
              transform: `translateY(${scrollY * 0.3}px)`
            }}
          />
          <div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/40 rounded-full blur-3xl"
            style={{
              transform: `translateY(${scrollY * -0.2}px)`
            }}
          />
        </div>
      </section>

      {/* Feature 1-1: AI Prompt Generation */}
      <section className="min-h-screen flex items-center justify-center relative px-4 py-20 md:py-0 bg-gradient-to-b from-white to-orange-50/40">
        <div
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center"
          style={getTransform(1)}
        >
          <div className="order-1">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-orange-100 rounded-full mb-4 md:mb-6">
              <Brain className="h-4 w-4 md:h-5 md:w-5 text-orange-600" />
              <span className="text-sm md:text-base text-orange-700 font-medium">AI 프롬프트 생성</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight text-gray-900">
              완벽한 프롬프트를
              <br />
              <span className="text-orange-600">자동으로</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
              주제만 입력하면 GPT-5, Claude, Gemini, Grok이 협력하여
              최적화된 프롬프트를 생성합니다.
              추천 도구와 팁까지 함께 제공됩니다.
            </p>
            <ul className="space-y-3 md:space-y-4">
              {[
                "다중 AI 협업으로 더 나은 결과",
                "실시간 프롬프트 개선 제안",
                "맞춤형 도구 추천"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <span className="text-sm md:text-base text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative order-2 max-w-md mx-auto md:max-w-none">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 border border-orange-200 p-8 flex items-center justify-center shadow-xl">
              <MessageSquare className="h-24 w-24 md:h-32 md:w-32 text-orange-500" />
            </div>
            {/* Floating cards */}
            <div
              className="absolute -top-3 -right-3 md:-top-4 md:-right-4 px-3 py-1.5 md:px-4 md:py-2 bg-orange-500 text-white rounded-lg text-xs md:text-sm font-medium shadow-lg"
              style={{
                transform: `translateY(${Math.sin(scrollY * 0.01) * 10}px)`
              }}
            >
              GPT-5.1
            </div>
            <div
              className="absolute -bottom-3 -left-3 md:-bottom-4 md:-left-4 px-3 py-1.5 md:px-4 md:py-2 bg-amber-500 text-white rounded-lg text-xs md:text-sm font-medium shadow-lg"
              style={{
                transform: `translateY(${Math.cos(scrollY * 0.01) * 10}px)`
              }}
            >
              Claude 3.5
            </div>
            <div
              className="absolute -top-3 -left-3 md:-top-4 md:-left-4 px-3 py-1.5 md:px-4 md:py-2 bg-blue-500 text-white rounded-lg text-xs md:text-sm font-medium shadow-lg"
              style={{
                transform: `translateY(${Math.sin(scrollY * 0.01 + Math.PI / 2) * 10}px)`
              }}
            >
              Gemini
            </div>
            <div
              className="absolute -bottom-3 -right-3 md:-bottom-4 md:-right-4 px-3 py-1.5 md:px-4 md:py-2 bg-gray-800 text-white rounded-lg text-xs md:text-sm font-medium shadow-lg"
              style={{
                transform: `translateY(${Math.cos(scrollY * 0.01 + Math.PI / 2) * 10}px)`
              }}
            >
              Grok
            </div>
          </div>
        </div>
      </section>

      {/* Feature 1-2: Community Prompt Sharing */}
      <section className="min-h-screen flex items-center justify-center relative px-4 py-20 md:py-0 bg-gradient-to-b from-orange-50/40 to-white">
        <div
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center"
          style={getTransform(2)}
        >
          <div className="relative order-2 md:order-1 max-w-md mx-auto md:max-w-none">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 p-8 flex items-center justify-center shadow-xl">
              <Users className="h-24 w-24 md:h-32 md:w-32 text-amber-600" />
            </div>
            {/* Floating share icons */}
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 md:-top-4 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 border-2 border-white shadow-lg flex items-center justify-center"
              style={{
                transform: `translateX(-50%) translateY(${Math.sin(scrollY * 0.012) * 15}px)`
              }}
            >
              <Share2 className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-amber-100 rounded-full mb-4 md:mb-6">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-amber-600" />
              <span className="text-sm md:text-base text-amber-700 font-medium">커뮤니티 공유</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight text-gray-900">
              다양한 프롬프트를
              <br />
              <span className="text-amber-600">함께 공유</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
              커뮤니티에서 검증된 프롬프트를 발견하고,
              당신의 프롬프트를 공유하세요.
              함께 성장하는 AI 프롬프트 생태계입니다.
            </p>
            <ul className="space-y-3 md:space-y-4">
              {[
                "커뮤니티가 만든 수백 개의 프롬프트",
                "평점과 리뷰 시스템",
                "카테고리별 프롬프트 탐색"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                  <span className="text-sm md:text-base text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Feature 2-1: Growth Learning Path */}
      <section className="min-h-screen flex items-center justify-center relative px-4 py-20 md:py-0 bg-gradient-to-b from-white to-cyan-50/30">
        <div
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center"
          style={getTransform(3)}
        >
          <div className="order-2 md:order-1 relative max-w-md mx-auto md:max-w-none">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 border border-blue-200 p-8 flex items-center justify-center shadow-xl">
              <BookOpen className="h-24 w-24 md:h-32 md:w-32 text-blue-500" />
            </div>
            {/* Progress indicator - Hidden on small screens */}
            <div
              className="hidden lg:block absolute top-1/2 -right-12 transform -translate-y-1/2"
              style={{
                transform: `translateX(${Math.sin(scrollY * 0.008) * 20}px) translateY(-50%)`
              }}
            >
              <div className="flex flex-col gap-2">
                {[1, 2, 3, 4, 5].map((day) => (
                  <div
                    key={day}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      day <= 3
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-cyan-100 rounded-full mb-4 md:mb-6">
              <Rocket className="h-4 w-4 md:h-5 md:w-5 text-cyan-600" />
              <span className="text-sm md:text-base text-cyan-700 font-medium">성장 학습 경로</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight text-gray-900">
              AI가 설계하는
              <br />
              <span className="text-cyan-600">맞춤 커리큘럼</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
              목표와 수준에 맞는 학습 경로를 AI가 자동으로 설계합니다.
              하루 60분씩, 체계적으로 성장하세요.
            </p>
            <ul className="space-y-3 md:space-y-4">
              {[
                "개인화된 학습 로드맵",
                "슬라이드 형식의 몰입형 학습",
                "진도율 추적 및 복습 시스템"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  </div>
                  <span className="text-sm md:text-base text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Feature 2-2: Exam Study */}
      <section className="min-h-screen flex items-center justify-center relative px-4 py-20 md:py-0 bg-gradient-to-b from-cyan-50/30 to-blue-50/30">
        <div
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center"
          style={getTransform(4)}
        >
          <div className="relative order-2 md:order-1 max-w-md mx-auto md:max-w-none">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-100 border border-blue-200 p-8 flex items-center justify-center shadow-xl">
              <GraduationCap className="h-24 w-24 md:h-32 md:w-32 text-blue-500" />
            </div>
            {/* Floating study icons */}
            <div
              className="absolute -top-4 left-1/2 -translate-x-1/2 md:-top-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 border-2 border-white shadow-lg flex items-center justify-center"
              style={{
                transform: `translateX(-50%) translateY(${Math.sin(scrollY * 0.012) * 15}px)`
              }}
            >
              <Pencil className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div
              className="absolute bottom-8 -right-4 md:bottom-12 md:-right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-white shadow-lg flex items-center justify-center"
              style={{
                transform: `translateY(${Math.cos(scrollY * 0.012) * 15}px)`
              }}
            >
              <Glasses className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-blue-100 rounded-full mb-4 md:mb-6">
              <GraduationCap className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              <span className="text-sm md:text-base text-blue-700 font-medium">시험 준비</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight text-gray-900">
              AI와 함께하는
              <br />
              <span className="text-blue-600">시험 공부</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
              자격증, 인증시험, 학교 시험까지.
              AI가 맞춤형 학습 자료를 생성하고
              효율적인 공부 방법을 제시합니다.
            </p>
            <ul className="space-y-3 md:space-y-4">
              {[
                "시험 범위 기반 학습 자료 생성",
                "핵심 개념 요약 및 문제 풀이",
                "약점 분석 및 집중 학습"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-sm md:text-base text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Feature 3: Challenger Community */}
      <section className="min-h-screen flex items-center justify-center relative px-4 py-20 md:py-0 bg-gradient-to-b from-blue-50/30 to-purple-50/30">
        <div
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center"
          style={getTransform(5)}
        >
          <div className="order-1">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-purple-100 rounded-full mb-4 md:mb-6">
              <Users className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              <span className="text-sm md:text-base text-purple-700 font-medium">도전자 커뮤니티</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight text-gray-900">
              함께 도전하고
              <br />
              <span className="text-purple-600">함께 성장</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
              코드 리뷰, 아이디어 피드백, 이력서 첨삭까지.
              AI와 커뮤니티가 함께 도와줍니다.
            </p>
            <ul className="space-y-3 md:space-y-4">
              {[
                "AI 기반 코드 리뷰",
                "실시간 아이디어 브레인스토밍",
                "커뮤니티 피드백"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <span className="text-sm md:text-base text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="relative order-2 max-w-md mx-auto md:max-w-none">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 border border-purple-200 p-8 flex items-center justify-center shadow-xl">
              <Users className="h-24 w-24 md:h-32 md:w-32 text-purple-500" />
            </div>
            {/* Floating avatars */}
            <div
              className="absolute -top-4 right-8 md:-top-6 md:right-12 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-white shadow-lg"
              style={{
                transform: `translateY(${Math.sin(scrollY * 0.012) * 15}px)`
              }}
            />
            <div
              className="absolute top-8 -right-4 md:top-12 md:-right-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-white shadow-lg"
              style={{
                transform: `translateY(${Math.cos(scrollY * 0.012) * 15}px)`
              }}
            />
            <div
              className="absolute bottom-8 -left-4 md:bottom-12 md:-left-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 border-2 border-white shadow-lg"
              style={{
                transform: `translateY(${Math.sin(scrollY * 0.012 + Math.PI) * 15}px)`
              }}
            />
          </div>
        </div>
      </section>

      {/* Feature 4: Ideas, Startup & Collaboration */}
      <section className="min-h-screen flex items-center justify-center relative px-4 py-20 md:py-0 bg-gradient-to-b from-purple-50/30 to-white">
        <div
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12 items-center"
          style={getTransform(6)}
        >
          <div className="relative order-2 md:order-1 max-w-md mx-auto md:max-w-none">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-pink-100 to-purple-100 border border-pink-200 p-8 flex items-center justify-center shadow-xl">
              <Lightbulb className="h-24 w-24 md:h-32 md:w-32 text-pink-500" />
            </div>
            {/* Floating icons */}
            <div
              className="absolute -top-6 left-1/2 -translate-x-1/2 md:-top-8 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-white shadow-lg flex items-center justify-center"
              style={{
                transform: `translateX(-50%) translateY(${Math.sin(scrollY * 0.012) * 15}px)`
              }}
            >
              <GitBranch className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div
              className="absolute bottom-8 -left-4 md:bottom-12 md:-left-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 border-2 border-white shadow-lg flex items-center justify-center"
              style={{
                transform: `translateY(${Math.cos(scrollY * 0.012) * 15}px)`
              }}
            >
              <Code className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-pink-100 rounded-full mb-4 md:mb-6">
              <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-pink-600" />
              <span className="text-sm md:text-base text-pink-700 font-medium">아이디어 & 협업</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 md:mb-6 leading-tight text-gray-900">
              아이디어부터
              <br />
              <span className="text-pink-600">협업까지</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
              아이디어 구체화, GitHub 연동, 사업 계획서 작성.
              창업과 협업의 모든 단계를 AI가 지원합니다.
            </p>
            <ul className="space-y-3 md:space-y-4">
              {[
                "AI 아이디어 브레인스토밍",
                "GitHub 레포지토리 연동",
                "사업 계획서 & 이력서 작성"
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-pink-500" />
                  </div>
                  <span className="text-sm md:text-base text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex items-center justify-center relative px-4 py-20 bg-gradient-to-b from-purple-50/30 to-white">
        {/* Background gradient */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-cyan-200/30 via-blue-200/30 to-purple-200/30 rounded-full blur-3xl" />
        </div>

        <div
          className="text-center max-w-4xl mx-auto relative z-10"
          style={getTransform(7)}
        >
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 md:mb-8 leading-tight text-gray-900">
            지금 시작하세요
          </h2>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-8 md:mb-12 font-medium">
            AI와 함께하는 새로운 학습 경험
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
            <Link
              href="/auth/signup"
              className="group w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all font-medium text-base md:text-lg flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              무료로 시작하기
              <ArrowRight className="h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/auth/signin"
              className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 border-2 border-gray-400 text-gray-800 rounded-full hover:bg-gray-50 transition-all font-medium text-base md:text-lg"
            >
              로그인
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 md:gap-8 mt-12 md:mt-20 max-w-2xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-cyan-600">100+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-700 mt-1 md:mt-2 font-medium">프롬프트</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">50+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-700 mt-1 md:mt-2 font-medium">학습 경로</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-600">1000+</div>
              <div className="text-xs sm:text-sm md:text-base text-gray-700 mt-1 md:mt-2 font-medium">커뮤니티</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 md:py-12 px-4 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-cyan-500" />
            <span className="text-sm md:text-base font-bold text-gray-900">A.IDEAL</span>
          </div>
          <div className="text-gray-500 text-xs md:text-sm">
            © 2024 A.IDEAL. All rights reserved.
          </div>
          <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-500">
            <Link href="/auth/signin" className="hover:text-gray-900 transition-colors">
              로그인
            </Link>
            <Link href="/auth/signup" className="hover:text-gray-900 transition-colors">
              회원가입
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
