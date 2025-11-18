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
      try {
        console.log("[Upload API] Starting blob upload for file:", filename);
        console.log("[Upload API] File size:", buffer.length, "bytes");
        console.log("[Upload API] File type:", file.type);
        
        // Vercel Blob Storage 토큰 확인 (자동 감지되지만 명시적으로 전달 가능)
        const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN;
        console.log("[Upload API] Blob token exists:", !!blobToken);
        console.log("[Upload API] VERCEL env:", !!process.env.VERCEL);
        console.log("[Upload API] NODE_ENV:", process.env.NODE_ENV);
        
        // Blob Storage 옵션 구성
        const blobOptions: any = {
          access: "public" as const,
          contentType: file.type,
        };
        
        // 토큰이 있으면 명시적으로 전달 (없으면 자동 감지에 맡김)
        if (blobToken) {
          blobOptions.token = blobToken;
          console.log("[Upload API] Using explicit token");
        } else {
          console.log("[Upload API] Relying on automatic token detection");
        }

        console.log("[Upload API] Calling put() with path: chat/" + filename);
        const blob = await put(`chat/${filename}`, buffer, blobOptions);
        console.log("[Upload API] Blob upload successful:", blob.url);
        fileUrl = blob.url;
      } catch (blobError: any) {
        console.error("[Upload API] Vercel Blob Storage error:", blobError);
        console.error("[Upload API] Error name:", blobError?.name);
        console.error("[Upload API] Error message:", blobError?.message);
        console.error("[Upload API] Error stack:", blobError?.stack);
        
        // 토큰 관련 오류인지 확인
        const errorMessage = blobError?.message || "";
        const errorString = JSON.stringify(blobError);
        
        if (errorMessage.includes("token") || errorMessage.includes("BLOB") || errorString.includes("token") || errorString.includes("BLOB")) {
          return NextResponse.json(
            { 
              error: "파일 저장소 설정이 완료되지 않았습니다.",
              details: "Vercel Dashboard에서 Blob Storage를 생성하고 프로젝트에 연결해야 합니다. Storage → Create Database → Blob을 선택하세요."
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { 
            error: "파일 업로드에 실패했습니다.",
            details: errorMessage || "Blob Storage에 파일을 저장하는 중 오류가 발생했습니다.",
            errorType: blobError?.name || "UnknownError"
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      url: fileUrl,
      filename: file.name,
      type: file.type,
      size: file.size,
    });
  } catch (error: any) {
    console.error("[Upload API] General error:", error);
    console.error("[Upload API] Error name:", error?.name);
    console.error("[Upload API] Error message:", error?.message);
    console.error("[Upload API] Error stack:", error?.stack);
    
    return NextResponse.json(
      { 
        error: "파일 업로드 중 오류가 발생했습니다",
        details: error?.message || "알 수 없는 오류가 발생했습니다.",
        errorType: error?.name || "UnknownError"
      },
      { status: 500 }
    );
  }
}
