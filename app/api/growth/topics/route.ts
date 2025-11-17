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
      console.log(`[Growth Topics] Added ${statement.column} column to Curriculum table`);
    } catch (error) {
      // SQLite는 컬럼이 이미 있을 경우 에러를 던지므로 무시
    }
  }

  curriculumColumnsEnsured = true;
}

// GET: 사용자의 학습 주제 목록 조회
export async function GET(req: NextRequest) {
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

    const topics = await prisma.growthTopic.findMany({
      where: { userId: user.id },
      include: {
        _count: {
          select: {
            curriculum: true,
            progress: {
              where: { status: "completed" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate progress percentage for each topic
    const topicsWithProgress = topics.map((topic) => ({
      ...topic,
      progressPercentage:
        topic._count.curriculum > 0
          ? Math.round((topic._count.progress / topic._count.curriculum) * 100)
          : 0,
    }));

    return NextResponse.json({ topics: topicsWithProgress });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

// POST: 새 학습 주제 생성 및 AI 커리큘럼 자동 생성
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
    const {
      title,
      description,
      goal,
      level,
      duration,
      startDate,
      questionsAndAnswers,
    } = body;

    if (!title || !goal) {
      return NextResponse.json(
        { error: "Title and goal are required" },
        { status: 400 }
      );
    }

    // Normalize duration (safeguard against invalid client payloads)
    const normalizedDuration = (() => {
      const num = Number(duration);
      if (!Number.isFinite(num)) return 30;
      return Math.min(365, Math.max(7, Math.floor(num)));
    })();

    // Calculate end date
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(end.getDate() + normalizedDuration);

    // Create the growth topic
    const topic = await prisma.growthTopic.create({
      data: {
        userId: user.id,
        title,
        description: description || null,
        goal,
        level,
        duration: normalizedDuration,
        startDate: start,
        endDate: end,
        status: "active",
      },
    });

    // Ensure curriculum table has required columns (legacy DBs may miss them)
    await ensureCurriculumColumns();

    // Generate curriculum using AI
    try {
      // Format questions and answers
      const qaText = questionsAndAnswers
        ? Object.entries(questionsAndAnswers)
            .map(([q, a]) => `Q: ${q}\nA: ${a}`)
            .join("\n\n")
        : "";

      const curriculumPrompt = `당신은 전문 교육 커리큘럼 설계자입니다. 다음 정보를 바탕으로 ${normalizedDuration}일간의 학습 일정을 설계해주세요.

학습 주제: ${title}
학습 목표: ${goal}
현재 수준: ${level === "beginner" ? "초급" : level === "intermediate" ? "중급" : "고급"}
학습 기간: ${normalizedDuration}일

${qaText ? `\n학습자에 대한 추가 정보:\n${qaText}\n` : ""}

**중요**: 이 단계에서는 일정과 주제만 생성하세요. 상세한 학습 내용은 학습자가 해당 날짜의 학습을 시작할 때 동적으로 생성됩니다.

요구사항:
1. 각 날짜마다 학습할 주제 제목만 명확하게 정의 (1-2문장)
2. 학습 내용은 점진적으로 난이도가 높아져야 합니다
3. 각 날의 간단한 설명 (2-3문장)
4. 예상 학습 시간 (분 단위)

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
          content: "당신은 전문 교육 커리큘럼 설계자입니다. 학습자의 수준과 목표에 맞는 체계적인 커리큘럼을 설계합니다.",
        },
        {
          role: "user",
          content: curriculumPrompt,
        },
      ];

      console.log("[Generate Curriculum] Generating with GPT-5 (exclusive)...");
      const response = await generateWithAI("gpt", messages, {
        temperature: 1,
        jsonMode: true,
      });
      console.log("[Generate Curriculum] GPT-5 generation success");

      // 응답 검증
      if (!response || !response.content || response.content.trim().length === 0) {
        console.error("[Generate Curriculum] Empty response, will create basic curriculum");
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
        console.log("[Generate Curriculum] JSON parsed successfully");
      } catch (parseError) {
        console.error("[Generate Curriculum] JSON parse error:", parseError);
        // JSON 파싱 실패해도 기본 커리큘럼 생성하도록 계속 진행
        curriculumData = { curriculum: [] };
      }

      // Save curriculum to database (simplified version)
      if (curriculumData.curriculum && Array.isArray(curriculumData.curriculum)) {
        const usedDayNumbers = new Set<number>();
        const maxItems = Math.max(1, normalizedDuration);
        const items = curriculumData.curriculum.slice(0, maxItems);

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          let dayNumber =
            typeof item.day === "number" && Number.isFinite(item.day) && item.day > 0
              ? Math.floor(item.day)
              : i + 1;

          // Clamp within duration range
          dayNumber = Math.min(normalizedDuration, Math.max(1, dayNumber));

          // Ensure unique day numbers (SQLite UNIQUE constraint)
          while (usedDayNumbers.has(dayNumber)) {
            dayNumber += 1;
          }
          usedDayNumbers.add(dayNumber);

          const itemDate = new Date(start);
          itemDate.setDate(itemDate.getDate() + dayNumber - 1);

          const safeTitle =
            typeof item.title === "string" && item.title.trim().length > 0
              ? item.title.trim()
              : `Day ${dayNumber}: ${title} 핵심`;

          const safeDescription =
            typeof item.description === "string" && item.description.trim().length > 0
              ? item.description.trim()
              : `${dayNumber}일차에는 ${safeTitle}에 대해 학습합니다.`;

          const estimatedTime =
            typeof item.estimatedTime === "number" && item.estimatedTime > 0
              ? Math.round(item.estimatedTime)
              : 60;

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
                  objectives: JSON.stringify([]), // Will be generated dynamically
                  // content/resources는 나중에 raw update로 저장 (오래된 Prisma Client 대응)
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
      console.error("[Generate Curriculum] AI Error:", aiError);
      if (aiError instanceof Error) {
        console.error("[Generate Curriculum] AI Error message:", aiError.message);
        console.error("[Generate Curriculum] AI Error stack:", aiError.stack);
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
            title: `Day ${day}: ${title} 학습`,
            description: `${day}일차 학습 내용`,
            objectives: JSON.stringify([]),
            estimatedTime: 60,
          },
        });
      }
    }

    return NextResponse.json({
      topic,
      message: "Topic and curriculum created successfully",
    });
  } catch (error) {
    console.error("[Create Topic] Error:", error);
    try {
      const logPath = path.join(process.cwd(), "topic-error.log");
      const payload = {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
      fs.appendFileSync(logPath, JSON.stringify(payload) + "\n", { encoding: "utf-8" });
    } catch (logError) {
      console.error("[Create Topic] Failed to write topic-error.log:", logError);
    }
    if (error instanceof Error) {
      console.error("[Create Topic] Error message:", error.message);
      console.error("[Create Topic] Error stack:", error.stack);
      return NextResponse.json(
        { 
          error: "Failed to create topic",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { 
        error: "Failed to create topic",
        details: process.env.NODE_ENV === "development" ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}
