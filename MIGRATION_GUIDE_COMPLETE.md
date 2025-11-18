# 완전한 데이터 마이그레이션 가이드

## 📋 개요

이 가이드는 SQLite 데이터베이스와 로컬 파일을 Vercel 배포를 위해 PostgreSQL과 클라우드 스토리지로 마이그레이션하는 방법을 설명합니다.

## 🗄️ 1단계: 데이터베이스 마이그레이션 (SQLite → PostgreSQL)

### 사전 준비

1. **Supabase PostgreSQL 연결 문자열 확인**
   - Supabase Dashboard → Settings → Database
   - Connection string 복사

2. **환경 변수 설정**
   ```env
   DATABASE_URL="postgresql://postgres.ojqyphkwipvdyqktsjij:absolute138!!@@138!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
   ```

3. **Prisma Schema 확인**
   - `prisma/schema.prisma`가 `provider = "postgresql"`로 설정되어 있는지 확인

### 마이그레이션 실행

```bash
# 1. Prisma Client 재생성
npx prisma generate

# 2. PostgreSQL에 스키마 생성
npx prisma migrate dev --name init_postgres

# 3. SQLite 데이터를 PostgreSQL로 마이그레이션
node scripts/migrate-to-postgres.js
```

### 마이그레이션 스크립트 설명

`scripts/migrate-to-postgres.js`는:
- SQLite 데이터베이스(`prisma/dev.db`)에서 모든 데이터를 읽습니다
- 외래키 의존성을 고려하여 올바른 순서로 테이블을 마이그레이션합니다
- 중복 데이터는 자동으로 건너뜁니다
- 각 테이블의 마이그레이션 결과를 출력합니다

## 📁 2단계: 파일 마이그레이션 (로컬 → Vercel Blob Storage)

### 사전 준비

1. **Vercel Blob Storage 토큰 생성**
   - Vercel Dashboard → Settings → Storage
   - "Create Database" → "Blob" 선택
   - 또는 기존 Blob Storage의 Settings에서 토큰 확인

2. **환경 변수 설정**
   ```env
   VERCEL_BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
   ```

### 파일 마이그레이션 실행

```bash
node scripts/migrate-files-to-blob.js
```

### 마이그레이션 후 작업

1. **데이터베이스 URL 업데이트**
   - `scripts/migrated-files.json` 파일을 확인
   - 데이터베이스에서 로컬 URL(`/uploads/chat/...`)을 Blob URL로 업데이트

2. **데이터베이스 업데이트 스크립트 실행** (선택사항)
   ```sql
   -- 예시: ChatMessage 테이블의 fileUrl 업데이트
   UPDATE "ChatMessage" 
   SET "fileUrl" = REPLACE("fileUrl", '/uploads/chat/', 'https://xxx.vercel-storage.com/chat/')
   WHERE "fileUrl" LIKE '/uploads/chat/%';
   ```

## 🔧 3단계: 코드 변경사항

### 파일 업로드 API

`app/api/upload/route.ts`가 이미 업데이트되었습니다:
- 로컬 개발: 파일 시스템 사용 (`public/uploads/chat/`)
- 프로덕션: Vercel Blob Storage 사용

### 환경 변수

**로컬 개발 (.env.local):**
```env
DATABASE_URL="postgresql://..." # Supabase 또는 로컬 PostgreSQL
# VERCEL_BLOB_READ_WRITE_TOKEN은 로컬에서 필요 없음 (파일 시스템 사용)
```

**Vercel 프로덕션:**
```env
DATABASE_URL="postgresql://..." # Supabase PostgreSQL
VERCEL_BLOB_READ_WRITE_TOKEN="vercel_blob_rw_xxxxx"
NEXTAUTH_URL="https://your-project.vercel.app"
NEXTAUTH_SECRET="your-secret"
OPENAI_API_KEY="your-key"
ANTHROPIC_API_KEY="your-key"
```

## ✅ 4단계: 배포 확인

1. **Vercel에 환경 변수 설정**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - 위의 모든 환경 변수 추가

2. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "Migrate to PostgreSQL and Vercel Blob Storage"
   git push
   ```

3. **배포 확인**
   - Vercel Dashboard에서 배포 로그 확인
   - `prisma migrate deploy`가 성공하는지 확인
   - 파일 업로드가 정상 작동하는지 테스트

## 🔍 문제 해결

### 마이그레이션 스크립트 오류

**"DATABASE_URL이 PostgreSQL 형식이 아닙니다"**
- `.env` 파일의 `DATABASE_URL`이 `postgresql://`로 시작하는지 확인

**"Unable to connect to database"**
- Supabase 연결 문자열이 올바른지 확인
- 네트워크 방화벽 설정 확인

### 파일 업로드 오류

**"VERCEL_BLOB_READ_WRITE_TOKEN is not defined"**
- Vercel Dashboard에서 토큰 확인
- 환경 변수가 Production, Preview, Development 모두에 설정되어 있는지 확인

**로컬에서 파일 업로드 실패**
- 로컬에서는 파일 시스템을 사용하므로 `public/uploads/chat/` 디렉토리 권한 확인

## 📝 체크리스트

- [ ] Supabase PostgreSQL 연결 문자열 확인
- [ ] `.env` 파일에 `DATABASE_URL` 설정
- [ ] `npx prisma generate` 실행
- [ ] `npx prisma migrate dev` 실행
- [ ] `node scripts/migrate-to-postgres.js` 실행
- [ ] Vercel Blob Storage 생성 및 토큰 확인
- [ ] `VERCEL_BLOB_READ_WRITE_TOKEN` 환경 변수 설정
- [ ] `node scripts/migrate-files-to-blob.js` 실행
- [ ] 데이터베이스의 파일 URL 업데이트 (선택사항)
- [ ] Vercel에 모든 환경 변수 설정
- [ ] GitHub에 코드 푸시
- [ ] 배포 확인 및 테스트

## 🎉 완료!

모든 마이그레이션이 완료되면:
- ✅ 데이터베이스: PostgreSQL (Supabase)
- ✅ 파일 스토리지: Vercel Blob Storage
- ✅ 배포: Vercel에서 정상 작동

