import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { uploadLimiter } from "@/lib/rate-limiter";

// 로컬 개발 환경인지 확인
const isLocal = process.env.NODE_ENV === "development" && !process.env.VERCEL;

// 허용된 파일 타입 정의
const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  text: ["text/plain", "text/csv"],
};

const ALLOWED_MIME_TYPES = [
  ...ALLOWED_FILE_TYPES.image,
  ...ALLOWED_FILE_TYPES.document,
  ...ALLOWED_FILE_TYPES.text,
];

// 파일 확장자 검증
const ALLOWED_EXTENSIONS = [
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
  ".pdf", ".doc", ".docx",
  ".txt", ".csv",
];

function isAllowedFileType(mimeType: string, filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ALLOWED_MIME_TYPES.includes(mimeType) && ALLOWED_EXTENSIONS.includes(ext);
}

function getMimeTypeCategory(mimeType: string): string {
  for (const [category, types] of Object.entries(ALLOWED_FILE_TYPES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return "unknown";
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }

    // Rate limiting
    const userId = (session.user as any).id || session.user.email;
    const rateLimitResult = await uploadLimiter.check(`upload:${userId}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "업로드 제한을 초과했습니다. 1시간 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "파일이 없습니다" },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    if (!isAllowedFileType(file.type, file.name)) {
      return NextResponse.json(
        {
          error: "허용되지 않는 파일 형식입니다. 이미지(JPG, PNG, GIF, WebP, SVG), 문서(PDF, DOC, DOCX), 텍스트(TXT, CSV) 파일만 업로드 가능합니다."
        },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 10MB를 초과할 수 없습니다" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(file.name);
    const filename = `${timestamp}-${randomString}${ext}`;

    let fileUrl: string;

    if (isLocal) {
      // 로컬 개발 환경: 파일 시스템 사용
      const uploadDir = path.join(process.cwd(), "public", "uploads", "chat");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      const filepath = path.join(uploadDir, filename);
      await writeFile(filepath, buffer);
      fileUrl = `/uploads/chat/${filename}`;
    } else {
      // 프로덕션 환경: Vercel Blob Storage 사용
      const blob = await put(`chat/${filename}`, buffer, {
        access: "public",
        contentType: file.type,
      });
      fileUrl = blob.url;
    }

    return NextResponse.json({
      url: fileUrl,
      filename: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "파일 업로드 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
