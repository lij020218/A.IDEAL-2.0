import { z } from 'zod';

// CUID validation for Prisma IDs
export const cuidSchema = z.string().cuid();

// Email validation
export const emailSchema = z.string().email();

// URL validation
export const urlSchema = z.string().url().optional();

// Challenge schema
export const challengeSchema = z.object({
  title: z.string().min(1, "제목은 필수입니다").max(200, "제목은 200자를 초과할 수 없습니다"),
  description: z.string().min(1, "설명은 필수입니다").max(5000, "설명은 5000자를 초과할 수 없습니다"),
  codeSnippet: z.string().max(10000, "코드는 10000자를 초과할 수 없습니다").optional(),
  ideaDetails: z.string().max(5000, "아이디어 설명은 5000자를 초과할 수 없습니다").optional(),
  contactInfo: z.string().email().or(z.string().url()),
  tags: z.array(z.string()).max(10, "태그는 최대 10개까지 가능합니다"),
  resumeUrl: z.string().url().optional(),
});

// Prompt schema
export const promptSchema = z.object({
  topic: z.string().min(1).max(200),
  prompt: z.string().min(1).max(10000),
  recommendedTools: z.array(z.string()).max(20),
  tips: z.array(z.string()).max(50),
  imageUrl: z.string().url().optional(),
  isPublic: z.boolean().optional(),
  parentId: z.string().cuid().optional(),
});

// Password schema with strong requirements
export const passwordSchema = z.string()
  .min(12, "비밀번호는 최소 12자 이상이어야 합니다")
  .regex(/[a-z]/, "소문자를 최소 1개 포함해야 합니다")
  .regex(/[A-Z]/, "대문자를 최소 1개 포함해야 합니다")
  .regex(/\d/, "숫자를 최소 1개 포함해야 합니다")
  .regex(/[@$!%*?&^#()_+\-=\[\]{};':"\\|,.<>\/?]/, "특수문자를 최소 1개 포함해야 합니다");

// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password123', 'admin123', '12345678', 'qwerty123',
  'password1234', 'admin1234', '123456789', 'qwerty1234',
];

export function isWeakPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}

// Helper functions
export function validateCuid(id: string): boolean {
  try {
    cuidSchema.parse(id);
    return true;
  } catch {
    return false;
  }
}

export function validateEmail(email: string): boolean {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
}
