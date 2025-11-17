import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Prisma Client 재생성 강제 (개발 환경에서만)
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  // 기존 인스턴스 제거하여 재생성 강제
  delete (globalForPrisma as any).prisma;
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
