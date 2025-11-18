# SQLite에서 PostgreSQL로 마이그레이션 가이드

## ⚠️ 중요: Vercel에서는 SQLite를 사용할 수 없습니다

Vercel은 서버리스 환경이며 파일 시스템이 읽기 전용입니다. SQLite는 로컬 파일 시스템에 데이터베이스 파일을 저장해야 하므로 Vercel에서 작동하지 않습니다.

## 해결 방법

### 1. Vercel Postgres 설정

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard

2. **프로젝트 선택**
   - 배포된 프로젝트 선택

3. **Storage 탭 클릭**
   - 왼쪽 메뉴에서 "Storage" 선택

4. **Postgres 데이터베이스 생성**
   - "Create Database" 클릭
   - "Postgres" 선택
   - 데이터베이스 이름 입력 (예: `aideal-db`)
   - 생성 완료

5. **환경 변수 확인**
   - Storage → 생성한 데이터베이스 → Settings
   - `POSTGRES_URL` 또는 `DATABASE_URL` 복사
   - 프로젝트 Settings → Environment Variables에 추가
   - 변수명: `DATABASE_URL`
   - 값: 복사한 연결 문자열

### 2. 로컬 개발 환경 설정

로컬에서도 PostgreSQL을 사용하려면:

**옵션 1: Docker 사용**
```bash
docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=aideal -p 5432:5432 -d postgres
```

`.env` 파일:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/aideal"
```

**옵션 2: Supabase (무료)**
- https://supabase.com 가입
- 새 프로젝트 생성
- Settings → Database → Connection string 복사
- `.env` 파일에 추가

**옵션 3: Neon (무료)**
- https://neon.tech 가입
- 새 프로젝트 생성
- Connection string 복사
- `.env` 파일에 추가

### 3. 마이그레이션 실행

```bash
# Prisma Client 재생성
npx prisma generate

# 마이그레이션 실행
npx prisma migrate dev --name migrate_to_postgres

# 또는 프로덕션 환경
npx prisma migrate deploy
```

### 4. 기존 데이터 마이그레이션 (선택사항)

SQLite에 기존 데이터가 있다면:

```bash
# SQLite 데이터 내보내기
npx prisma db pull --schema=./prisma/schema.sqlite.prisma

# PostgreSQL로 가져오기
npx prisma db push
```

또는 수동으로:
1. SQLite 데이터베이스 파일 백업
2. 데이터를 CSV로 내보내기
3. PostgreSQL로 가져오기

## 배포 후 확인

1. Vercel Dashboard → Deployments
2. 최신 배포 로그 확인
3. 에러가 없다면 성공!

## 문제 해결

### "Unable to open the database file" 에러
- ✅ Prisma schema가 `postgresql`로 변경되었는지 확인
- ✅ Vercel 환경 변수에 `DATABASE_URL`이 설정되었는지 확인
- ✅ 연결 문자열 형식이 올바른지 확인: `postgresql://user:password@host:port/database`

### 마이그레이션 실패
- Vercel 빌드 로그 확인
- 로컬에서 `npx prisma migrate deploy` 실행하여 에러 확인

### 연결 타임아웃
- Vercel Postgres의 방화벽 설정 확인
- 연결 문자열의 호스트와 포트 확인


