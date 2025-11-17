# AIDEAL - Premium AI Prompt Library 🚀

**AIDEAL**은 고품질 AI 프롬프트와 최적의 AI 도구 추천을 제공하는 프리미엄 웹 플랫폼입니다.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ 주요 기능

### 🎯 핵심 기능
- **🤖 GPT 기반 프롬프트 생성**: OpenAI GPT를 활용한 맞춤형 프롬프트 자동 생성
- **💬 인터랙티브 질의응답**: 사용자 목표에 맞춘 5가지 핵심 질문으로 최적화
- **⚡ 스마트 AI 도구 추천**: 생성된 프롬프트에 가장 적합한 AI 도구 자동 추천
- **📚 프리미엄 프롬프트 라이브러리**: 전문가가 선별한 고품질 프롬프트 컬렉션
- **🔍 고급 검색 & 필터링**: 실시간 검색 및 카테고리별 필터링

### 💎 사용자 경험
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 완벽 지원
- **다크모드**: 시스템 테마 자동 적용
- **직관적인 UI**: 깔끔하고 현대적인 인터페이스
- **빠른 성능**: Next.js 14 App Router 기반 최적화

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Font**: Google Fonts (Inter)

### AI & Backend
- **AI**: OpenAI GPT-5 (Latest Model)
- **API**: Next.js API Routes
- **SDK**: OpenAI SDK, Vercel AI SDK

### 코드 품질
- **ESLint**: 코드 품질 관리
- **TypeScript**: 타입 안정성

## 📦 설치 및 실행

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn
- OpenAI API Key

### 설치 방법

1. **저장소 클론**
```bash
git clone <repository-url>
cd a.ideal
```

2. **패키지 설치**
```bash
npm install
# 또는
yarn install
```

3. **환경 변수 설정**
```bash
# .env 파일 생성
cp .env.example .env

# .env 파일에 OpenAI API Key 입력
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5.1-2025-11-13
```

**OpenAI API Key 발급 방법:**
- https://platform.openai.com/api-keys 접속
- 새 API 키 생성
- `.env` 파일에 추가

4. **개발 서버 실행**
```bash
npm run dev
# 또는
yarn dev
```

5. **브라우저에서 확인**
```
http://localhost:3000
```

### 빌드 및 배포

**프로덕션 빌드**
```bash
npm run build
npm start
```

**Vercel 배포** (권장)
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

## 📁 프로젝트 구조

```
a.ideal/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # 루트 레이아웃
│   ├── page.tsx             # 메인 페이지
│   ├── globals.css          # 글로벌 스타일
│   ├── prompts/
│   │   └── [id]/
│   │       └── page.tsx     # 프롬프트 상세 페이지
│   └── tools/
│       └── page.tsx         # AI 도구 페이지
├── components/               # 재사용 가능한 컴포넌트
│   ├── Header.tsx           # 헤더 네비게이션
│   ├── PromptCard.tsx       # 프롬프트 카드
│   └── CategoryFilter.tsx   # 카테고리 필터
├── lib/                     # 유틸리티 및 데이터
│   ├── utils.ts            # 헬퍼 함수
│   └── data/
│       ├── prompts.ts      # 프롬프트 데이터
│       └── ai-tools.ts     # AI 도구 데이터
├── types/                   # TypeScript 타입 정의
│   └── index.ts
├── public/                  # 정적 파일
├── tailwind.config.ts       # Tailwind 설정
├── tsconfig.json           # TypeScript 설정
└── package.json            # 프로젝트 의존성
```

## 🎨 디자인 시스템

### 컬러 팔레트
- **Primary**: Purple gradient (#667eea → #764ba2)
- **Background**: Dynamic (라이트/다크 모드)
- **Accent**: Customizable theme colors

### 애니메이션
- Fade-in effects
- Slide-up transitions
- Hover animations
- Glass morphism effects

## 🔧 커스터마이징

### 프롬프트 추가
[lib/data/prompts.ts](lib/data/prompts.ts)에서 새로운 프롬프트를 추가할 수 있습니다:

```typescript
{
  id: "unique-id",
  title: "프롬프트 제목",
  description: "프롬프트 설명",
  content: "실제 프롬프트 내용...",
  category: "writing", // 카테고리
  tags: ["태그1", "태그2"],
  recommendedTools: [/* AI 도구 */],
  rating: 4.5,
  isFeatured: true,
  // ...
}
```

### AI 도구 추가
[lib/data/ai-tools.ts](lib/data/ai-tools.ts)에서 AI 도구를 추가할 수 있습니다:

```typescript
{
  id: "tool-id",
  name: "도구 이름",
  description: "도구 설명",
  url: "https://tool-url.com",
  category: "text-generation",
  isPremium: true,
}
```

## 📊 주요 페이지

### 1. 메인 페이지 (`/`)
- Hero 섹션
- Featured 프롬프트
- 카테고리 필터
- 전체 프롬프트 목록
- 실시간 검색

### 2. 프롬프트 상세 페이지 (`/prompts/[id]`)
- 프롬프트 전체 내용
- 클립보드 복사 기능
- 추천 AI 도구 목록
- 사용 팁
- 평점 및 통계

### 3. AI 도구 페이지 (`/tools`)
- AI 도구 디렉토리
- 카테고리별 필터링
- 외부 링크 연결

## 🚀 향후 계획

- [ ] 사용자 인증 (NextAuth.js)
- [ ] 데이터베이스 연동 (Prisma + PostgreSQL)
- [ ] 사용자 대시보드
- [ ] 프롬프트 즐겨찾기
- [ ] 프롬프트 평가 시스템
- [ ] 커뮤니티 프롬프트 공유
- [ ] API 엔드포인트
- [ ] 관리자 패널

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

## 🤝 기여

프로젝트 개선을 위한 기여를 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해주세요.

---

**Made with ❤️ using Next.js 14 & TypeScript**
