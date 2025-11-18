const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listGeminiModels() {
  // .env 파일에서 API 키 읽기
  require('dotenv').config();

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log("❌ GEMINI_API_KEY가 설정되지 않았습니다.");
    console.log("Google AI Studio에서 API 키를 발급받아 .env 파일에 추가하세요:");
    console.log("https://aistudio.google.com/app/apikey");
    return;
  }

  console.log("🔍 Gemini API로 사용 가능한 모델 목록 확인 중...\n");

  try {
    const genAI = new GoogleGenerativeAI(apiKey);

    // 간단한 테스트 생성으로 모델 확인
    console.log("📋 추천 Gemini 모델:\n");

    const models = [
      { name: "gemini-2.0-flash-exp", desc: "가장 최신 실험 모델 (2.0 Flash)" },
      { name: "gemini-1.5-flash", desc: "빠르고 효율적인 표준 모델" },
      { name: "gemini-1.5-flash-8b", desc: "더 빠른 경량 모델" },
      { name: "gemini-1.5-pro", desc: "고성능 프로 모델" },
      { name: "gemini-pro", desc: "기본 프로 모델" },
    ];

    for (const model of models) {
      console.log(`✅ ${model.name}`);
      console.log(`   ${model.desc}\n`);
    }

    // 실제 API 테스트
    console.log("\n🧪 API 연결 테스트 중...\n");

    const testModel = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp"
    });

    const result = await testModel.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: "Hello! Just say 'Hi' back." }]
      }]
    });

    const response = result.response.text();
    console.log("✅ API 연결 성공!");
    console.log(`📝 테스트 응답: ${response}\n`);

    console.log("✨ 추천 설정:");
    console.log("   GEMINI_MODEL=gemini-2.0-flash-exp (최신, 빠름)");
    console.log("   또는");
    console.log("   GEMINI_MODEL=gemini-1.5-pro (고성능)\n");

  } catch (error) {
    console.error("❌ 오류 발생:", error.message);

    if (error.message.includes("API key")) {
      console.log("\n💡 API 키가 유효하지 않습니다.");
      console.log("Google AI Studio에서 새 API 키를 발급받으세요:");
      console.log("https://aistudio.google.com/app/apikey");
    }
  }
}

listGeminiModels();
