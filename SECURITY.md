# 보안 가이드

이 문서는 A.IDEAL 프로젝트의 보안 설정 및 베스트 프랙티스를 설명합니다.

## 🔐 필수 설정

### 1. 환경 변수 설정

프로젝트를 시작하기 전에 반드시 다음 환경 변수를 설정해야 합니다:

```bash
# .env 파일 생성
cp .env.example .env
```

**NEXTAUTH_SECRET 생성 (필수!)**:
```bash
# Windows (PowerShell)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Linux/Mac
openssl rand -base64 32
```

생성된 값을 `.env` 파일의 `NEXTAUTH_SECRET`에 입력하세요.

### 2. 필수 환경 변수

```.env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth (CRITICAL!)
NEXTAUTH_SECRET=<여기에 생성한 시크릿 입력>
NEXTAUTH_URL=http://localhost:3000

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## 🛡️ 구현된 보안 기능

### 1. 인증 및 세션 관리
- ✅ JWT 기반 세션 with secure secret
- ✅ HttpOnly, Secure 쿠키
- ✅ 24시간 세션 만료
- ✅ CSRF 보호

### 2. Rate Limiting
- ✅ API 요청 제한: 15분당 100회
- ✅ IP 기반 추적
- ✅ 자동 정리 메커니즘
- ✅ Rate limit 헤더 제공

### 3. 입력 검증
- ✅ Zod 스키마 검증
- ✅ XSS 방어 (DOMPurify)
- ✅ SQL Injection 방어 (Prisma)
- ✅ 길이 제한 및 타입 검증

### 4. 보안 헤더
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin

### 5. 데이터 보호
- ✅ 공개 API에서 이메일 노출 방지
- ✅ 에러 메시지 sanitization
- ✅ 민감 정보 로깅 방지
- ✅ 데이터베이스 파일 git 제외

## 📋 사용 가이드

### 입력 검증 사용하기

```typescript
import { challengeSchema, validateCuid } from '@/lib/validators';
import { sanitizeHtml, sanitizeText } from '@/lib/sanitizer';

// API 엔드포인트에서
export async function POST(req: NextRequest) {
  const body = await req.json();

  // 1. 스키마 검증
  const validation = challengeSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "입력 형식이 올바르지 않습니다", details: validation.error },
      { status: 400 }
    );
  }

  // 2. Sanitization
  const data = validation.data;
  const cleanData = {
    title: sanitizeText(data.title),
    description: sanitizeHtml(data.description),
    // ...
  };

  // 3. DB 저장
  const result = await prisma.challenge.create({ data: cleanData });
}
```

### Rate Limiting 적용하기

```typescript
import { authLimiter, aiLimiter } from '@/lib/rate-limiter';

export async function POST(req: NextRequest) {
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown';

  // 인증 엔드포인트에 적용
  const { success } = await authLimiter.check(ip);
  if (!success) {
    return NextResponse.json(
      { error: "너무 많은 시도입니다. 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  // ... 나머지 로직
}
```

### 안전한 에러 로깅

```typescript
import { logError } from '@/lib/logger';

try {
  // ... 로직
} catch (error) {
  logError('api:endpoint-name', error);
  return NextResponse.json(
    { error: "일반적인 에러 메시지" },
    { status: 500 }
  );
}
```

## ⚠️ 알려진 제한사항

### 현재 구현
- Rate limiting은 메모리 기반 (서버 재시작 시 초기화)
- 프로덕션에서는 Redis 기반 솔루션 권장

### 권장 업그레이드
```bash
# Redis 기반 Rate Limiting (프로덕션용)
npm install @upstash/ratelimit @upstash/redis
```

## 🔍 보안 체크리스트

배포 전 확인사항:

- [ ] `NEXTAUTH_SECRET` 설정 완료
- [ ] `.env` 파일이 git에 커밋되지 않았는지 확인
- [ ] `*.db` 파일이 git에 커밋되지 않았는지 확인
- [ ] HTTPS 사용 (프로덕션)
- [ ] 데이터베이스를 SQLite에서 PostgreSQL로 마이그레이션 (프로덕션)
- [ ] 환경 변수가 프로덕션 서버에 설정되었는지 확인
- [ ] Rate limiting이 적절히 작동하는지 테스트
- [ ] CORS 설정 확인
- [ ] 의존성 보안 취약점 스캔 (`npm audit`)

## 📚 추가 리소스

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [NextAuth.js Best Practices](https://next-auth.js.org/security)
- [Prisma Security](https://www.prisma.io/docs/guides/security)

## 🐛 보안 취약점 신고

보안 취약점을 발견하셨다면, 공개 이슈로 등록하지 마시고 프로젝트 관리자에게 직접 연락해주세요.
