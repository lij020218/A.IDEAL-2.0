# Vercel 데이터베이스 설정 가이드

## 문제
Vercel은 서버리스 환경이며 파일 시스템이 읽기 전용입니다. SQLite는 로컬 파일 시스템에 데이터베이스 파일을 저장해야 하므로 Vercel에서 사용할 수 없습니다.

## 해결 방법: PostgreSQL 사용

### 1. Vercel Postgres 추가

1. Vercel Dashboard 접속
2. 프로젝트 선택
3. **Storage** 탭 클릭
4. **Create Database** 클릭
5. **Postgres** 선택
6. 데이터베이스 이름 입력 후 생성

### 2. 환경 변수 확인

Vercel Postgres를 생성하면 자동으로 `POSTGRES_URL` 환경 변수가 추가됩니다.
또는 `DATABASE_URL`로 사용할 수 있는 연결 문자열이 제공됩니다.

### 3. Prisma Schema 수정

`prisma/schema.prisma` 파일에서:
```prisma
datasource db {
  provider = "postgresql"  // "sqlite"에서 변경
  url      = env("DATABASE_URL")
}
```

### 4. 마이그레이션 실행

로컬에서:
```bash
npx prisma migrate dev --name migrate_to_postgres
```

Vercel 배포 후:
```bash
npx prisma migrate deploy
```

또는 Vercel의 빌드 설정에서 자동으로 실행되도록 설정할 수 있습니다.

## 대안: 다른 클라우드 데이터베이스

### Supabase (무료 티어 제공)
- https://supabase.com
- PostgreSQL 기반
- 무료 티어: 500MB 저장공간

### PlanetScale (MySQL)
- https://planetscale.com
- MySQL 기반
- 무료 티어 제공

### Neon (PostgreSQL)
- https://neon.tech
- PostgreSQL 기반
- 무료 티어 제공

## 주의사항

1. **데이터 마이그레이션**: 기존 SQLite 데이터가 있다면 PostgreSQL로 마이그레이션해야 합니다.
2. **환경 변수**: Vercel Dashboard에서 `DATABASE_URL` 환경 변수를 설정해야 합니다.
3. **마이그레이션**: 배포 후 첫 실행 시 데이터베이스 마이그레이션이 필요합니다.


