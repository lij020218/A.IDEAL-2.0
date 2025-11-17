# 🚀 빠른 시작 가이드

## ✅ 실행 전 체크리스트

### 1. 환경 변수 설정 (.env 파일)

프로젝트 루트에 `.env` 파일이 있는지 확인하고, 없으면 생성하세요:

```bash
# .env 파일 생성
```

**필수 환경 변수:**

```env
# 데이터베이스
DATABASE_URL="file:./prisma/dev.db"

# NextAuth (필수!)
NEXTAUTH_SECRET=<시크릿 키 생성 필요>
NEXTAUTH_URL=http://localhost:3000

# OpenAI (필수 - 프롬프트 생성 기능용)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Claude (선택사항 - 프롬프트 분석 기능용)
CLAUDE_API_KEY=sk-ant-api03-...
CLAUDE_MODEL=claude-sonnet-4-5-20250929

# Grok (선택사항)
# GROK_API_KEY=xai-...
# GROK_MODEL=grok-3
```

**NEXTAUTH_SECRET 생성 방법:**

Windows PowerShell:
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

또는 온라인 생성기 사용: https://generate-secret.vercel.app/32

### 2. 데이터베이스 준비

데이터베이스 파일(`prisma/dev.db`)이 이미 있으면 마이그레이션은 완료된 것입니다.

만약 새로 시작한다면:
```bash
npx prisma migrate dev
```

### 3. Prisma Client 생성

```bash
npx prisma generate
```

### 4. 의존성 설치 (처음 한 번만)

```bash
npm install
```

## 🎯 서버 실행

### 방법 1: 일반 실행
```bash
npm run dev
```

### 방법 2: Windows 배치 파일 사용
```bash
start-dev.bat
```
(이 파일은 포트 3000을 사용하는 프로세스를 자동으로 종료하고 서버를 시작합니다)

### 방법 3: 수동 포트 확인 후 실행
```bash
# 포트 3000 사용 중인 프로세스 확인
netstat -ano | findstr :3000

# 필요시 프로세스 종료 후
npm run dev
```

## 🌐 접속

서버 실행 후 브라우저에서 접속:
```
http://localhost:3000
```

## ✨ 새로 추가된 기능 확인

1. **알림 시스템**: 헤더 우측의 벨 아이콘 클릭
2. **대시보드**: 헤더의 사용자 아이콘 클릭 또는 `/dashboard` 접속
3. **프롬프트 실행**: 프롬프트 상세 페이지에서 "프롬프트 실행" 섹션 사용
4. **프로필**: 헤더 사용자 메뉴에서 "프로필" 클릭 또는 `/profile` 접속

## ⚠️ 문제 해결

### 포트 3000이 이미 사용 중
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <프로세스ID> /F

# 또는 다른 포트 사용
npm run dev -- -p 3001
```

### Prisma Client 오류
```bash
npx prisma generate
npm run dev
```

### 환경 변수 오류
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 환경 변수 이름이 정확한지 확인 (대소문자 구분)
- 서버 재시작

### 데이터베이스 오류
```bash
# 마이그레이션 재실행
npx prisma migrate dev

# Prisma Client 재생성
npx prisma generate
```

## 📝 참고사항

- **최소 요구사항**: OpenAI API Key만 있어도 기본 기능 사용 가능
- **추천**: Claude API Key도 추가하면 프롬프트 분석 기능 사용 가능
- **데이터베이스**: SQLite 사용 (개발용), 프로덕션에서는 PostgreSQL 권장

---

**준비 완료!** 🎉

이제 `npm run dev`를 실행하고 브라우저에서 `http://localhost:3000`에 접속하세요!


