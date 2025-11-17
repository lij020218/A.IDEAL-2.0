# Vercel 배포 가이드

## 1. 사전 준비사항

### GitHub에 코드 업로드
1. GitHub에 새 저장소 생성
2. 로컬에서 Git 초기화 및 커밋:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

## 2. Vercel 배포

### 방법 1: Vercel 웹사이트에서 배포 (권장)

1. **Vercel 계정 생성**
   - https://vercel.com 접속
   - GitHub 계정으로 로그인

2. **프로젝트 가져오기**
   - Dashboard에서 "Add New..." → "Project" 클릭
   - GitHub 저장소 선택
   - 프로젝트 설정:
     - **Framework Preset**: Next.js (자동 감지됨)
     - **Root Directory**: `./` (기본값)
     - **Build Command**: `npm run build` (자동 설정됨)
     - **Output Directory**: `.next` (자동 설정됨)
     - **Install Command**: `npm install` (자동 설정됨)

3. **환경 변수 설정**
   - 프로젝트 설정에서 "Environment Variables" 섹션으로 이동
   - 다음 환경 변수들을 추가:

   ```
   # 데이터베이스 (SQLite는 Vercel에서 권장하지 않음 - PostgreSQL 권장)
   DATABASE_URL="file:./dev.db"  # 로컬 개발용
   # 또는 PostgreSQL 사용 시:
   # DATABASE_URL="postgresql://user:password@host:5432/dbname"
   
   # NextAuth
   NEXTAUTH_URL="https://your-project.vercel.app"
   NEXTAUTH_SECRET="your-secret-key-here"  # 랜덤 문자열 생성 (openssl rand -base64 32)
   
   # OpenAI
   OPENAI_API_KEY="your-openai-api-key"
   OPENAI_MODEL="gpt-5.1-2025-11-13"  # 또는 사용하는 모델
   
   # Claude (선택사항)
   ANTHROPIC_API_KEY="your-anthropic-api-key"
   CLAUDE_MODEL="claude-sonnet-4-5-20250929"
   
   # Grok (선택사항)
   GROK_API_KEY="your-grok-api-key"
   ```

4. **빌드 설정**
   - "Build and Development Settings"에서:
     - **Build Command**: `npm run build`
     - **Install Command**: `npm install`
     - **Development Command**: `npm run dev`

5. **배포**
   - "Deploy" 버튼 클릭
   - 빌드가 완료되면 자동으로 배포됨

### 방법 2: Vercel CLI 사용

1. **Vercel CLI 설치**
```bash
npm i -g vercel
```

2. **로그인**
```bash
vercel login
```

3. **프로젝트 배포**
```bash
vercel
```

4. **프로덕션 배포**
```bash
vercel --prod
```

## 3. 중요 설정 사항

### Prisma 설정

SQLite는 Vercel의 서버리스 환경에서 권장하지 않습니다. PostgreSQL 사용을 권장합니다.

#### PostgreSQL로 전환하는 방법:

1. **Vercel Postgres 추가**
   - Vercel Dashboard → 프로젝트 → Storage → Create Database → Postgres 선택

2. **Prisma Schema 수정**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. **마이그레이션 실행**
   ```bash
   npx prisma migrate deploy
   ```

### NextAuth 설정

`NEXTAUTH_URL`은 배포된 도메인으로 설정해야 합니다:
- 프로덕션: `https://your-project.vercel.app`
- 프리뷰: Vercel이 자동으로 설정

### 빌드 시 Prisma Client 생성

`package.json`에 postinstall 스크립트 추가:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

## 4. 배포 후 확인사항

1. **환경 변수 확인**
   - 모든 필수 환경 변수가 설정되었는지 확인

2. **데이터베이스 마이그레이션**
   - Vercel 배포 후 첫 실행 시 자동으로 마이그레이션 실행되도록 설정 필요

3. **도메인 설정**
   - Vercel Dashboard에서 커스텀 도메인 추가 가능

## 5. 문제 해결

### 빌드 실패 시
- Vercel 로그 확인: Dashboard → Deployments → 해당 배포 → "View Function Logs"
- 로컬에서 빌드 테스트: `npm run build`

### 환경 변수 문제
- 환경 변수가 제대로 설정되었는지 확인
- Production, Preview, Development 각각 설정 필요할 수 있음

### 데이터베이스 연결 문제
- SQLite는 Vercel에서 작동하지 않을 수 있음
- PostgreSQL로 전환 권장

## 6. 추가 리소스

- [Vercel 공식 문서](https://vercel.com/docs)
- [Next.js 배포 가이드](https://nextjs.org/docs/deployment)
- [Prisma 배포 가이드](https://www.prisma.io/docs/guides/deployment)

