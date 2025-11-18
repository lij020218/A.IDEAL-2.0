# Vercel 배포 수정 가이드

## ✅ 완료된 작업
1. Prisma schema를 PostgreSQL로 변경
2. package.json의 build 스크립트에 `prisma migrate deploy` 포함됨

## 🔧 Vercel 환경 변수 설정 (필수!)

### 1. Vercel Dashboard 접속
- https://vercel.com/dashboard
- 프로젝트 선택

### 2. Environment Variables 설정
**Settings** → **Environment Variables**로 이동하여 다음 변수들을 추가:

#### 필수 환경 변수:

```env
# 데이터베이스 (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.ojqyphkwipvdyqktsjij:absolute138!!@@138!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"

# NextAuth
NEXTAUTH_URL="https://your-project.vercel.app"  # 실제 배포 URL로 변경
NEXTAUTH_SECRET="your-secret-key-here"  # 랜덤 문자열 (아래 명령어로 생성)

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Claude (선택사항)
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### 3. NEXTAUTH_SECRET 생성
터미널에서 실행:
```bash
openssl rand -base64 32
```
또는 온라인: https://generate-secret.vercel.app/32

### 4. 환경 변수 적용 범위
각 환경 변수에 대해 **모든 환경** (Production, Preview, Development)에 체크

## 📝 로컬 개발 환경 설정

### 옵션 1: Supabase 사용 (권장 - Vercel과 동일)
`.env.local` 파일:
```env
DATABASE_URL="postgresql://postgres.ojqyphkwipvdyqktsjij:absolute138!!@@138!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-local-secret"
OPENAI_API_KEY="your-openai-api-key"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

### 옵션 2: 로컬 SQLite 사용 (개발 전용)
⚠️ **주의**: Prisma schema가 PostgreSQL로 설정되어 있으므로, 로컬에서 SQLite를 사용하려면:
1. 별도의 `prisma/schema.sqlite.prisma` 파일 생성 필요
2. 또는 개발 시에만 schema를 수동으로 변경

**권장**: Supabase를 로컬에서도 사용 (Vercel과 동일 환경)

## 🚀 배포 후 마이그레이션

Vercel 배포 후 첫 빌드 시 자동으로 `prisma migrate deploy`가 실행됩니다.

수동으로 마이그레이션하려면:
```bash
# Vercel CLI 설치
npm i -g vercel

# 마이그레이션 실행
vercel env pull .env.local
npx prisma migrate deploy
```

## ✅ 배포 체크리스트

- [ ] Vercel에 DATABASE_URL 환경 변수 설정 (Supabase)
- [ ] NEXTAUTH_URL을 실제 배포 URL로 설정
- [ ] NEXTAUTH_SECRET 생성 및 설정
- [ ] OPENAI_API_KEY 설정
- [ ] GitHub에 코드 푸시
- [ ] Vercel에서 배포 시작
- [ ] 배포 로그 확인 (마이그레이션 성공 여부)

## 🔍 문제 해결

### "Unable to open the database file" 오류
→ DATABASE_URL이 SQLite로 설정되어 있음. PostgreSQL 연결 문자열로 변경 필요

### "Migration failed" 오류
→ Vercel 환경 변수에 DATABASE_URL이 제대로 설정되지 않음

### "Prisma Client not generated" 오류
→ `package.json`의 `postinstall` 스크립트 확인 (`prisma generate` 포함되어야 함)

