export type Language = "ko" | "en";

export const translations = {
  ko: {
    // Header
    header: {
      home: "홈",
      generate: "생성하기",
      tools: "AI 도구",
      generatePrompt: "프롬프트 생성",
    },
    // Hero Section
    hero: {
      title: "어떤",
      titleHighlight: "세상",
      titleEnd: "을 만들어 나가고",
      titleEnd2: "싶으세요?",
      subtitle: "AI와 함께 당신의 아이디어를 현실로 만드세요",
      searchPlaceholder: "원하는 프롬프트를 검색해보세요...",
      statsPrompts: "프롬프트",
      statsTools: "AI 도구",
      statsCategories: "카테고리",
    },
    // Featured Section
    featured: {
      title: "추천 프롬프트",
      viewAll: "전체 보기",
    },
    // Category Section
    category: {
      title: "카테고리별 탐색",
      all: "전체",
      writing: "글쓰기",
      coding: "코딩",
      marketing: "마케팅",
      design: "디자인",
      business: "비즈니스",
      education: "교육",
      productivity: "생산성",
      creative: "창작",
      analysis: "분석",
    },
    // Prompts Section
    prompts: {
      allPrompts: "모든 프롬프트",
      noResults: "검색 결과가 없습니다.",
      featured: "추천",
      rating: "평점",
      uses: "사용",
    },
    // Generate Page
    generate: {
      badge: "AI 기반",
      title: "당신만의",
      titleHighlight: "세상",
      titleEnd: "을 만들어보세요",
      subtitle: "몇 가지 질문에 답하고 맞춤형 AI 프롬프트를 받아보세요",
      step1: "주제",
      step2: "질문",
      step3: "결과",
      topicTitle: "무엇을 만들고 싶으신가요?",
      topicSubtitle: "목표를 알려주시면 완벽한 AI 프롬프트를 만들어드립니다",
      topicLabel: "주제 또는 목표",
      topicPlaceholder: "예: 유튜브 영상 편집 프롬프트 만들기",
      continue: "계속하기",
      generating: "질문 생성 중...",
      questionTitle: "자세한 정보를 알려주세요",
      questionSubtitle: "완벽한 프롬프트를 위한 질문에 답변해주세요",
      back: "이전",
      generatePrompt: "프롬프트 생성",
      creatingPrompt: "프롬프트 생성 중...",
      yourPrompt: "당신의 프리미엄 프롬프트",
      copy: "복사",
      copied: "복사됨!",
      recommendedTools: "추천 AI 도구",
      tips: "프로 팁",
      createAnother: "새 프롬프트 만들기",
      error: "오류가 발생했습니다. 다시 시도해주세요.",
      answerAll: "모든 질문에 답변해주세요",
    },
    // Tools Page
    tools: {
      title: "AI 도구 디렉토리",
      subtitle: "창작과 업무를 위한 최고의 AI 도구를 탐색하세요",
      filter: "카테고리별 필터",
      allTools: "전체 도구",
      textGeneration: "텍스트 생성",
      imageGeneration: "이미지 생성",
      codeAssistant: "코드 어시스턴트",
      dataAnalysis: "데이터 분석",
      audioGeneration: "오디오 생성",
      videoGeneration: "비디오 생성",
      general: "일반",
      premium: "프리미엄",
      noResults: "이 카테고리에 도구가 없습니다.",
    },
    // Prompt Detail Page
    detail: {
      backToPrompts: "프롬프트 목록으로",
      featured: "추천",
      rating: "평점",
      uses: "사용",
      updated: "업데이트",
      promptContent: "프롬프트 내용",
      copy: "프롬프트 복사",
      copied: "복사됨!",
      recommendedTools: "추천 AI 도구",
      recommendedSubtitle: "이 프롬프트에 가장 적합한 AI 도구들입니다",
      premium: "프리미엄",
      usageTips: "💡 사용 팁",
      tip1: "• [TOPIC]과 같은 플레이스홀더를 실제 내용으로 바꿔주세요",
      tip2: "• 여러 AI 도구로 실험해보고 최적의 결과를 찾으세요",
      tip3: "• 톤과 스타일 파라미터를 필요에 맞게 조정하세요",
      tip4: "• 성공적인 변형을 저장해서 나중에 사용하세요",
      notFound: "프롬프트를 찾을 수 없습니다",
      goHome: "홈으로 돌아가기",
    },
    // Footer
    footer: {
      copyright: "© 2024 AIDEAL. 프리미엄 AI 프롬프트 라이브러리.",
    },
  },
  en: {
    // Header
    header: {
      home: "Home",
      generate: "Generate",
      tools: "AI Tools",
      generatePrompt: "Generate Prompt",
    },
    // Hero Section
    hero: {
      title: "Discover Premium",
      titleHighlight: "AI Prompts",
      titleEnd: "",
      titleEnd2: "",
      subtitle: "High-quality prompts with personalized AI tool recommendations",
      searchPlaceholder: "Search prompts by title, description, or tags...",
      statsPrompts: "Prompts",
      statsTools: "AI Tools",
      statsCategories: "Categories",
    },
    // Featured Section
    featured: {
      title: "Featured Prompts",
      viewAll: "View all",
    },
    // Category Section
    category: {
      title: "Browse by Category",
      all: "All",
      writing: "Writing",
      coding: "Coding",
      marketing: "Marketing",
      design: "Design",
      business: "Business",
      education: "Education",
      productivity: "Productivity",
      creative: "Creative",
      analysis: "Analysis",
    },
    // Prompts Section
    prompts: {
      allPrompts: "All Prompts",
      noResults: "No prompts found matching your criteria.",
      featured: "Featured",
      rating: "rating",
      uses: "uses",
    },
    // Generate Page
    generate: {
      badge: "AI-Powered",
      title: "Generate Your Perfect",
      titleHighlight: "AI Prompt",
      titleEnd: "",
      subtitle: "Answer a few questions and get a custom, high-quality AI prompt tailored to your needs",
      step1: "Topic",
      step2: "Questions",
      step3: "Result",
      topicTitle: "What do you want to create?",
      topicSubtitle: "Tell us your goal, and we'll help you craft the perfect AI prompt",
      topicLabel: "Your Topic or Goal",
      topicPlaceholder: "e.g., Create YouTube video editing prompts",
      continue: "Continue",
      generating: "Generating questions...",
      questionTitle: "Tell us more details",
      questionSubtitle: "Answer these questions to help us create the perfect prompt",
      back: "Back",
      generatePrompt: "Generate Prompt",
      creatingPrompt: "Creating your prompt...",
      yourPrompt: "Your Premium Prompt",
      copy: "Copy",
      copied: "Copied!",
      recommendedTools: "Recommended AI Tools",
      tips: "Pro Tips",
      createAnother: "Create Another Prompt",
      error: "An error occurred. Please try again.",
      answerAll: "Please answer all questions",
    },
    // Tools Page
    tools: {
      title: "AI Tools Directory",
      subtitle: "Explore the best AI tools for your creative and professional needs",
      filter: "Filter by Category",
      allTools: "All Tools",
      textGeneration: "Text Generation",
      imageGeneration: "Image Generation",
      codeAssistant: "Code Assistant",
      dataAnalysis: "Data Analysis",
      audioGeneration: "Audio Generation",
      videoGeneration: "Video Generation",
      general: "General",
      premium: "Premium",
      noResults: "No tools found in this category.",
    },
    // Prompt Detail Page
    detail: {
      backToPrompts: "Back to prompts",
      featured: "Featured",
      rating: "rating",
      uses: "uses",
      updated: "Updated",
      promptContent: "Prompt Content",
      copy: "Copy Prompt",
      copied: "Copied!",
      recommendedTools: "Recommended AI Tools",
      recommendedSubtitle: "These AI tools are best suited for this prompt based on their capabilities and strengths.",
      premium: "Premium",
      usageTips: "💡 Usage Tips",
      tip1: "• Customize the prompt by replacing placeholders like [TOPIC] with your specific needs",
      tip2: "• Experiment with different AI tools to see which gives the best results",
      tip3: "• Adjust the tone and style parameters to match your requirements",
      tip4: "• Save successful variations for future use",
      notFound: "Prompt not found",
      goHome: "Go back home",
    },
    // Footer
    footer: {
      copyright: "© 2024 AIDEAL. Premium AI Prompt Library.",
    },
  },
};

export function getTranslation(lang: Language) {
  return translations[lang];
}

const stringCatalog: Record<
  string,
  {
    ko: string;
    en: string;
  }
> = {
  "추천 프롬프트": { ko: "추천 프롬프트", en: "Featured Prompts" },
  "커뮤니티가 만든 최신 프롬프트": {
    ko: "커뮤니티가 만든 최신 프롬프트",
    en: "Latest prompts from the community",
  },
  "전체보기": { ko: "전체보기", en: "View all" },
  "도전자들": { ko: "도전자들", en: "Challengers" },
  "커뮤니티의 도전 과제": {
    ko: "커뮤니티의 도전 과제",
    en: "Community challenge board",
  },
  "새 프롬프트 생성": { ko: "새 프롬프트 생성", en: "Create New Prompt" },
  "프롬프트 등록": { ko: "프롬프트 등록", en: "Submit Prompt" },
  "프롬프트": { ko: "프롬프트", en: "Prompts" },
  "프롬프트 목록으로": {
    ko: "프롬프트 목록으로",
    en: "Back to prompt list",
  },
  "시작하기": { ko: "시작하기", en: "Get Started" },
  "커뮤니티가 만든 최신 프롬프트": {
    ko: "커뮤니티가 만든 최신 프롬프트",
    en: "Latest prompts from the community",
  },
  "커뮤니티의 도전 과제": {
    ko: "커뮤니티의 도전 과제",
    en: "Community Challenges",
  },
  "커뮤니티의 도전 과제": {
    ko: "커뮤니티의 도전 과제",
    en: "Community challenges",
  },
  "성장하기": { ko: "성장하기", en: "Growth" },
  "플랜 업그레이드": { ko: "플랜 업그레이드", en: "Upgrade Plan" },
  "설정": { ko: "설정", en: "Settings" },
  "도전": { ko: "도전", en: "Challenges" },
  "학습": { ko: "학습", en: "Learning" },
  "조회수": { ko: "조회수", en: "Views" },
  "팔로워": { ko: "팔로워", en: "Followers" },
  "팔로잉": { ko: "팔로잉", en: "Following" },
  "로그인이 필요합니다": { ko: "로그인이 필요합니다", en: "Login required" },
  "댓글을 입력하세요...": {
    ko: "댓글을 입력하세요...",
    en: "Write a comment...",
  },
  "도전이 삭제되었습니다": {
    ko: "도전이 삭제되었습니다",
    en: "Challenge has been deleted.",
  },
  "도전 삭제에 실패했습니다": {
    ko: "도전 삭제에 실패했습니다",
    en: "Failed to delete challenge.",
  },
  "무엇을 만들고 싶으신가요? (예: 유튜브 영상 편집 프롬프트)": {
    ko: "무엇을 만들고 싶으신가요? (예: 유튜브 영상 편집 프롬프트)",
    en: "What would you like to create? (e.g., a YouTube editing prompt)",
  },
  "저장된 프롬프트가 없습니다": {
    ko: "저장된 프롬프트가 없습니다",
    en: "No saved prompts yet",
  },
  "참여 중인 채팅방이 없습니다": {
    ko: "참여 중인 채팅방이 없습니다",
    en: "No chat rooms joined yet",
  },
  "프롬프트 등록": { ko: "프롬프트 등록", en: "Submit Prompt" },
  "도전 참가 신청": { ko: "도전 참가 신청", en: "Manage Join Requests" },
  "커뮤니티가 만든 최신 프롬프트": {
    ko: "커뮤니티가 만든 최신 프롬프트",
    en: "Latest prompts from the community",
  },
  "커뮤니티의 도전 과제": {
    ko: "커뮤니티의 도전 과제",
    en: "Community challenges",
  },
  "방장": { ko: "방장", en: "Host" },
  "사용자": { ko: "사용자", en: "User" },
  "A.IDEAL SPACE": { ko: "A.IDEAL SPACE", en: "A.IDEAL SPACE" },
  "AI 도구": { ko: "AI 도구", en: "AI Tools" },
  "언어": { ko: "언어", en: "Language" },
  "인터페이스에 사용할 언어를 선택하세요.": {
    ko: "인터페이스에 사용할 언어를 선택하세요.",
    en: "Choose which language to use for the interface.",
  },
  "테마": { ko: "테마", en: "Theme" },
  "눈의 피로를 줄이기 위해 밝기 모드를 전환하세요.": {
    ko: "눈의 피로를 줄이기 위해 밝기 모드를 전환하세요.",
    en: "Switch brightness modes to reduce eye strain.",
  },
  "라이트 모드": { ko: "라이트 모드", en: "Light Mode" },
  "다크 모드": { ko: "다크 모드", en: "Dark Mode" },
  "계정 설정": { ko: "계정 설정", en: "Account Settings" },
  "프로필 정보와 알림 설정을 곧 추가할 예정입니다.": {
    ko: "프로필 정보와 알림 설정을 곧 추가할 예정입니다.",
    en: "Profile and notification settings are coming soon.",
  },
  "보안 설정": { ko: "보안 설정", en: "Security Settings" },
  "2단계 인증과 로그인 기록 기능을 준비 중입니다.": {
    ko: "2단계 인증과 로그인 기록 기능을 준비 중입니다.",
    en: "Two-factor authentication and login history are coming soon.",
  },
  "개인 맞춤": { ko: "개인 맞춤", en: "Personalization" },
  "추천 프롬프트와 알림을 더 정교하게 제어할 수 있도록 준비 중입니다.": {
    ko: "추천 프롬프트와 알림을 더 정교하게 제어할 수 있도록 준비 중입니다.",
    en: "More precise controls for recommendations and alerts are on the way.",
  },
  "계정과 환경을 한 곳에서 관리하세요.": {
    ko: "계정과 환경을 한 곳에서 관리하세요.",
    en: "Manage your account and workspace in one place.",
  },
  "닫기": { ko: "닫기", en: "Close" },
  "현재 이용 중": { ko: "현재 이용 중", en: "Currently Active" },
  "업그레이드하기": { ko: "업그레이드하기", en: "Upgrade" },
  "무료 플랜으로 전환": { ko: "무료 플랜으로 전환", en: "Switch to Free Plan" },
  "플랜 선택": { ko: "플랜 선택", en: "Choose your plan" },
  "플랜": { ko: "플랜", en: "Plan" },
  "사용량이 늘어날수록 Pro 플랜으로 더 많은 AI 기능을 이용해 보세요.": {
    ko: "사용량이 늘어날수록 Pro 플랜으로 더 많은 AI 기능을 이용해 보세요.",
    en: "Upgrade to Pro as your usage grows to unlock unlimited AI features.",
  },
  "사용량 현황": { ko: "사용량 현황", en: "Usage Overview" },
  "프롬프트 복사": { ko: "프롬프트 복사", en: "Prompt Copies" },
  "성장하기 콘텐츠 생성": {
    ko: "성장하기 콘텐츠 생성",
    en: "Growth Content Generations",
  },
  "성장하기 생성": { ko: "성장하기 생성", en: "Growth generation" },
  "최근 사용 기록": { ko: "최근 사용 기록", en: "Recent Usage" },
  "아직 사용 기록이 없습니다.": {
    ko: "아직 사용 기록이 없습니다.",
    en: "No usage has been recorded yet.",
  },
  "등록된 도전이 없습니다": {
    ko: "등록된 도전이 없습니다",
    en: "No challenges have been posted yet.",
  },
  "코드": { ko: "코드", en: "Code" },
  "아이디어": { ko: "아이디어", en: "Idea" },
  "이력서": { ko: "이력서", en: "Resume" },
  "익명": { ko: "익명", en: "Anonymous" },
  "인기": { ko: "인기", en: "Popular" },
  "플랜 변경에 실패했습니다": {
    ko: "플랜 변경에 실패했습니다",
    en: "Failed to change plan.",
  },
  "무제한": { ko: "무제한", en: "Unlimited" },
};

export function translateText(text: string, lang: Language) {
  if (lang === "ko") return text;
  const entry = stringCatalog[text];
  return entry ? entry[lang] : text;
}

