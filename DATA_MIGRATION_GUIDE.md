# 데이터 마이그레이션 가이드

Vercel 배포를 위해 로컬 SQLite 데이터와 업로드된 파일들을 클라우드로 마이그레이션하는 가이드입니다.

## 📋 사전 준비사항

### 1. Supabase PostgreSQL 연결 확인
`.env` 파일에 Supabase DATABASE_URL이 설정되어 있어야 합니다:
```env
DATABASE_URL="postgresql://postgres.ojqyphkwipvdyqktsjij:absolute138!!@@138!@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"
```

### 2. Prisma Schema 확인
`prisma/schema.prisma`가 PostgreSQL로 설정되어 있는지 확인:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 3. PostgreSQL 마이그레이션 실행
먼저 스키마를 PostgreSQL에 적용해야 합니다:
```bash
npx prisma generate
npx prisma migrate dev --name init_postgres
```

## 🗄️ 1단계: 데이터베이스 데이터 마이그레이션

### SQLite → PostgreSQL 마이그레이션

1. **마이그레이션 스크립트 실행**
   ```bash
   node scripts/migrate-sqlite-to-postgres.js
   ```

2. **마이그레이션되는 데이터**
   - Users (사용자 계정)
   - Prompts (프롬프트)
   - PromptRatings (평점)
   - Challenges (도전 과제)
   - Comments (댓글)
   - ChatRooms, ChatMembers, ChatMessages (채팅)
   - JoinRequests (가입 요청)
   - Notifications (알림)
   - Events (일정)
   - Whiteboards, WhiteboardItems (화이트보드)
   - GrowthTopics, Curricula, LearningProgress (학습)
   - SearchHistory (검색 기록)
   - Follows (팔로우)

3. **마이그레이션 결과 확인**
   - 스크립트가 각 테이블별로 성공/실패를 출력합니다
   - 실패한 항목이 있으면 오류 메시지를 확인하세요

## 📁 2단계: 파일 마이그레이션

### 로컬 파일 → Vercel Blob Storage

1. **Vercel Blob Storage 토큰 설정**
   
   Vercel Dashboard에서:
   - Settings → Storage → Create Database → Blob 선택
   - 또는 기존 Blob Storage가 있다면 Settings에서 토큰 복사
   
   `.env` 파일에 추가:
   ```env
   VERCEL_BLOB_READ_WRITE_TOKEN="your-token-here"
   ```

2. **파일 마이그레이션 스크립트 실행**
   ```bash
   node scripts/migrate-files-to-blob.js
   ```

3. **마이그레이션 결과**
   - `scripts/migrated-files.json` 파일에 마이그레이션 결과가 저장됩니다
   - 이 파일에는 로컬 경로와 Blob URL의 매핑이 포함됩니다

4. **데이터베이스 URL 업데이트 (선택사항)**
   
   파일 URL이 데이터베이스에 저장되어 있다면 (예: ChatMessage.fileUrl), 
   `migrated-files.json`을 참고하여 URL을 업데이트해야 합니다.
   
   예시 스크립트:
   ```javascript
   // scripts/update-file-urls.js (직접 작성 필요)
   const migrated = require('./migrated-files.json');
   // 데이터베이스의 fileUrl을 업데이트하는 로직
   ```

## ✅ 3단계: 마이그레이션 검증

### 데이터 확인

1. **PostgreSQL 데이터 확인**
   ```bash
   npx prisma studio
   ```
   - 브라우저에서 데이터베이스 내용을 확인할 수 있습니다
   - 각 테이블의 데이터 개수를 확인하세요

2. **파일 접근 확인**
   - Vercel Blob Storage에서 업로드된 파일들이 보이는지 확인
   - 파일 URL로 직접 접근하여 다운로드 가능한지 확인

## 🚀 4단계: Vercel 배포

마이그레이션이 완료되면:

1. **GitHub에 코드 푸시**
   ```bash
   git add .
   git commit -m "데이터 마이그레이션 완료"
   git push
   ```

2. **Vercel 환경 변수 설정**
   - DATABASE_URL (Supabase PostgreSQL)
   - VERCEL_BLOB_READ_WRITE_TOKEN (Blob Storage 토큰)
   - NEXTAUTH_URL, NEXTAUTH_SECRET
   - API Keys (OpenAI, Claude 등)

3. **배포 확인**
   - Vercel Dashboard에서 배포 로그 확인
   - `prisma migrate deploy`가 성공하는지 확인
   - 사이트가 정상 작동하는지 테스트

## ⚠️ 주의사항

1. **백업**: 마이그레이션 전에 `prisma/dev.db` 파일을 백업하세요
2. **테스트**: 프로덕션 배포 전에 스테이징 환경에서 먼저 테스트하세요
3. **파일 URL**: 데이터베이스에 저장된 파일 URL이 있다면 수동으로 업데이트가 필요할 수 있습니다
4. **중복 실행**: 마이그레이션 스크립트는 `upsert`를 사용하므로 중복 실행해도 안전합니다

## 🔧 문제 해결

### "DATABASE_URL not found" 오류
→ `.env` 파일에 Supabase DATABASE_URL이 설정되어 있는지 확인

### "VERCEL_BLOB_READ_WRITE_TOKEN not found" 오류
→ Vercel Dashboard에서 Blob Storage 토큰을 생성하고 `.env`에 추가

### "Foreign key constraint" 오류
→ 데이터베이스 마이그레이션 순서 문제일 수 있습니다. 스크립트의 순서를 확인하세요

### 파일 업로드 실패
→ Vercel Blob Storage 토큰 권한을 확인하세요 (read-write 권한 필요)





