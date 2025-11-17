import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWithAI, UnifiedMessage } from "@/lib/ai-router";
import { Prisma } from "@prisma/client";
import fs from "fs";
import path from "path";

let curriculumColumnsEnsured = false;

async function ensureCurriculumColumns() {
  if (curriculumColumnsEnsured) return;

  const addColumnStatements = [
    { column: "content", sql: prisma.$executeRaw`ALTER TABLE Curriculum ADD COLUMN content TEXT;` },
    { column: "resources", sql: prisma.$executeRaw`ALTER TABLE Curriculum ADD COLUMN resources TEXT;` },
  ];

  for (const statement of addColumnStatements) {
    try {
      await statement.sql;
      console.log(`[Growth Topics Exam] Added ${statement.column} column to Curriculum table`);
    } catch (error) {
      // SQLite는 컬럼이 이미 있을 경우 에러를 던지므로 무시
    }
  }

  curriculumColumnsEnsured = true;
}

// POST: 시험 자료를 기반으로 학습 주제 및 커리큘럼 생성
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { subject, files, duration } = body;

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: "과목명은 필수입니다" },
        { status: 400 }
      );
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "최소 1개 이상의 PDF 파일이 필요합니다" },
        { status: 400 }
      );
    }

    // 파일 정보를 description에 JSON으로 저장
    const examFilesInfo = JSON.stringify(files);

    // 기간 설정 (기본값 30일)
    const normalizedDuration = (() => {
      const num = Number(duration);
      if (!Number.isFinite(num)) return 30;
      return Math.min(365, Math.max(1, Math.floor(num)));
    })();
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + normalizedDuration);

    // Create the growth topic
    const topic = await prisma.growthTopic.create({
      data: {
        userId: user.id,
        title: `${subject} 시험 공부`,
        description: examFilesInfo, // 파일 정보를 description에 저장
        goal: `${subject} 시험을 위한 체계적인 학습 계획을 수립하고 시험에 합격하는 것`,
        level: "intermediate", // 시험 공부는 기본적으로 중급으로 설정
        duration: normalizedDuration,
        startDate: start,
        endDate: end,
        status: "active",
      },
    });

    // Ensure curriculum table has required columns
    await ensureCurriculumColumns();

    // Generate curriculum using AI with exam materials
    try {
      const fileList = files.map((f: any, idx: number) => `${idx + 1}. ${f.filename}`).join("\n");

      const curriculumPrompt = `당신은 전문 교육 커리큘럼 설계자이자 시험 준비 전문가입니다. 사용자가 제공한 시험 자료를 바탕으로 ${normalizedDuration}일간의 체계적인 시험 공부 일정을 설계해주세요.

과목: ${subject}
시험 자료 파일:
${fileList}

**중요**: 이 단계에서는 일정과 주제만 생성하세요. 상세한 학습 내용은 학습자가 해당 날짜의 학습을 시작할 때 동적으로 생성됩니다.

요구사항:
1. 각 날짜마다 학습할 주제 제목만 명확하게 정의 (1-2문장)
2. 학습 내용은 점진적으로 난이도가 높아져야 합니다
3. 시험 자료를 체계적으로 학습할 수 있도록 구성
4. 각 날의 간단한 설명 (2-3문장)
5. 예상 학습 시간은 60분으로 고정 (모든 일차는 60분 기준으로 설계)
6. 시험 전 마지막 날에는 복습 및 정리 시간을 포함

JSON 형식으로 응답해주세요:
{
  "curriculum": [
    {
      "day": 1,
      "title": "첫날 학습 주제 제목",
      "description": "오늘 배울 내용에 대한 간단한 설명 (2-3문장)",
      "estimatedTime": 60
    },
    ...
  ]
}`;

      const messages: UnifiedMessage[] = [
        {
          role: "system",
          content: "당신은 전문 교육 커리큘럼 설계자이자 시험 준비 전문가입니다. 시험 자료를 분석하여 체계적이고 효과적인 학습 계획을 설계합니다.",
        },
        {
          role: "user",
          content: curriculumPrompt,
        },
      ];

      console.log("[Generate Exam Curriculum] Generating with GPT-5 (exclusive)...");
      const response = await generateWithAI("gpt", messages, {
        temperature: 1,
        jsonMode: true,
      });
      console.log("[Generate Exam Curriculum] GPT-5 generation success");

      // 응답 검증
      if (!response || !response.content || response.content.trim().length === 0) {
        console.error("[Generate Exam Curriculum] Empty response, will create basic curriculum");
        throw new Error("AI 응답이 비어있습니다");
      }

      // JSON 파싱
      let contentToParse = response.content.trim();
      if (contentToParse.includes("```json")) {
        const jsonMatch = contentToParse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) contentToParse = jsonMatch[1].trim();
      } else if (contentToParse.includes("```")) {
        const codeMatch = contentToParse.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch && codeMatch[1]) contentToParse = codeMatch[1].trim();
      }

      const jsonStart = contentToParse.indexOf("{");
      const jsonEnd = contentToParse.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        contentToParse = contentToParse.substring(jsonStart, jsonEnd + 1);
      }

      let curriculumData;
      try {
        curriculumData = JSON.parse(contentToParse);
        console.log("[Generate Exam Curriculum] JSON parsed successfully");
      } catch (parseError) {
        console.error("[Generate Exam Curriculum] JSON parse error:", parseError);
        curriculumData = { curriculum: [] };
      }

      // Save curriculum to database
      if (curriculumData.curriculum && Array.isArray(curriculumData.curriculum)) {
        const usedDayNumbers = new Set<number>();
        const maxItems = Math.max(1, duration);
        const items = curriculumData.curriculum.slice(0, maxItems);

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          let dayNumber =
            typeof item.day === "number" && Number.isFinite(item.day) && item.day > 0
              ? Math.floor(item.day)
              : i + 1;

          dayNumber = Math.min(duration, Math.max(1, dayNumber));

          while (usedDayNumbers.has(dayNumber)) {
            dayNumber += 1;
          }
          usedDayNumbers.add(dayNumber);

          const itemDate = new Date(start);
          itemDate.setDate(itemDate.getDate() + dayNumber - 1);

          const safeTitle =
            typeof item.title === "string" && item.title.trim().length > 0
              ? item.title.trim()
              : `Day ${dayNumber}: ${subject} 핵심`;

          const safeDescription =
            typeof item.description === "string" && item.description.trim().length > 0
              ? item.description.trim()
              : `${dayNumber}일차에는 ${safeTitle}에 대해 학습합니다.`;

          // 시험 공부는 항상 60분 기준
          const estimatedTime = 60;

          let attempts = 0;
          let created = false;

          while (!created && attempts < 5) {
            try {
              await prisma.curriculum.create({
                data: {
                  topicId: topic.id,
                  dayNumber,
                  date: itemDate,
                  title: safeTitle,
                  description: safeDescription,
                  objectives: JSON.stringify([]),
                  estimatedTime,
                },
              });
              created = true;
            } catch (createError) {
              if (
                createError instanceof Prisma.PrismaClientKnownRequestError &&
                createError.code === "P2002"
              ) {
                dayNumber += 1;
                attempts += 1;
                continue;
              }
              throw createError;
            }
          }
        }
      }
    } catch (aiError) {
      console.error("[Generate Exam Curriculum] AI Error:", aiError);
      if (aiError instanceof Error) {
        console.error("[Generate Exam Curriculum] AI Error message:", aiError.message);
        console.error("[Generate Exam Curriculum] AI Error stack:", aiError.stack);
      }
      // If AI fails, create a basic curriculum structure
      for (let day = 1; day <= normalizedDuration; day++) {
        const itemDate = new Date(start);
        itemDate.setDate(itemDate.getDate() + day - 1);

        await prisma.curriculum.create({
          data: {
            topicId: topic.id,
            dayNumber: day,
            date: itemDate,
            title: `Day ${day}: ${subject} 학습`,
            description: `${day}일차 학습 내용`,
            objectives: JSON.stringify([]),
            estimatedTime: 60,
          },
        });
      }
    }

    return NextResponse.json({
      topic,
      message: "Exam topic and curriculum created successfully",
    });
  } catch (error) {
    console.error("[Create Exam Topic] Error:", error);
    try {
      const logPath = path.join(process.cwd(), "topic-error.log");
      const payload = {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
      fs.appendFileSync(logPath, JSON.stringify(payload) + "\n", { encoding: "utf-8" });
    } catch (logError) {
      console.error("[Create Exam Topic] Failed to write topic-error.log:", logError);
    }
    if (error instanceof Error) {
      console.error("[Create Exam Topic] Error message:", error.message);
      console.error("[Create Exam Topic] Error stack:", error.stack);
      return NextResponse.json(
        { 
          error: "Failed to create exam topic",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: "Failed to create exam topic",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}

