# 데이터베이스 설정 가이드

## 현재 상황
- ✅ Prisma Schema: PostgreSQL로 설정됨
- ❌ 로컬 .env: SQLite (`file:./dev.db`)로 설정됨
- ⚠️ **불일치 발생**: Prisma는 PostgreSQL을 기대하지만 .env는 SQLite를 가리킴

## 해결 방법

### 옵션 1: Supabase 사용 (무료, 추천)

1. **Supabase 가입 및 프로젝트 생성**
   - https://supabase.com 접속
   - 새 프로젝트 생성
   - 프로젝트 이름: `aideal` (또는 원하는 이름)
   - 데이터베이스 비밀번호 설정

2. **연결 문자열 복사**
   - Supabase Dashboard → Settings → Database
   - "Connection string" → "URI" 선택
   - 연결 문자열 복사 (형식: `postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres`)

3. **.env 파일 수정**
   ```env
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[PROJECT-REF].supabase.co:5432/postgres"
   ```

4. **마이그레이션 실행**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

### 옵션 2: Neon 사용 (무료)

1. **Neon 가입 및 프로젝트 생성**
   - https://neon.tech 접속
   - 새 프로젝트 생성

2. **연결 문자열 복사**
   - Dashboard → Connection Details
   - 연결 문자열 복사

3. **.env 파일 수정**
   ```env
   DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DATABASE]?sslmode=require"
   ```

4. **마이그레이션 실행**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

### 옵션 3: 로컬 PostgreSQL (Docker)

1. **Docker로 PostgreSQL 실행**
   ```bash
   docker run --name aideal-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aideal -p 5432:5432 -d postgres
   ```

2. **.env 파일 수정**
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/aideal"
   ```

3. **마이그레이션 실행**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

## Vercel 설정

Vercel Dashboard에서:
1. 프로젝트 → Settings → Environment Variables
2. `DATABASE_URL` 추가
   - 로컬과 동일한 PostgreSQL 연결 문자열 사용
   - 또는 Vercel Postgres를 생성하여 사용

## 확인 방법

```bash
# Prisma Studio로 데이터베이스 확인
npx prisma studio
```

## 문제 해결

### "Unable to open the database file" 에러
- ✅ Prisma schema가 `postgresql`인지 확인
- ✅ .env 파일의 DATABASE_URL이 PostgreSQL 형식인지 확인
- ✅ 연결 문자열이 올바른지 확인

### 연결 실패
- 데이터베이스 서버가 실행 중인지 확인
- 방화벽 설정 확인
- 연결 문자열의 비밀번호와 호스트 확인






