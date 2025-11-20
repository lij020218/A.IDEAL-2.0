# Supabase 연결 문자열 찾기

## 현재 위치
https://supabase.com/dashboard/project/ojqyphkwipvdyqktsjij/database/settings

## DATABASE_URL 찾는 방법

### 방법 1: Project Settings에서 찾기 (권장)

1. **왼쪽 사이드바에서 "Project Settings" 클릭**
   - (톱니바퀴 아이콘 또는 "Settings" 메뉴)

2. **"Database" 섹션 클릭**

3. **"Connection string" 섹션 찾기**
   - "URI" 탭 선택
   - 연결 문자열이 표시됩니다:
     ```
     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
     ```

4. **연결 문자열 복사**
   - `[YOUR-PASSWORD]` 부분을 실제 데이터베이스 비밀번호로 교체
   - 또는 "Connection pooling" 섹션에서 "Session mode" 연결 문자열 사용

### 방법 2: Database Settings에서 직접 찾기

현재 페이지(Database Settings)에서:

1. **"Connection pooling" 섹션 확인**
   - "Connection string" 링크 클릭
   - 또는 "Docs" 링크를 통해 연결 방법 확인

2. **또는 왼쪽 사이드바에서:**
   - "Database" → "Connection string" 메뉴 확인

## 연결 문자열 형식

Supabase는 두 가지 연결 방식 제공:

### 1. Direct Connection (직접 연결)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 2. Connection Pooling (권장 - Vercel용)
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

## .env 파일에 추가

복사한 연결 문자열을 `.env` 파일에 추가:

```env
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**중요**: `[PASSWORD]` 부분을 실제 데이터베이스 비밀번호로 교체하세요!

## 데이터베이스 비밀번호 확인

비밀번호를 잊었다면:
1. Database Settings 페이지에서
2. "Reset database password" 버튼 클릭
3. 새 비밀번호 설정

## 다음 단계

연결 문자열을 복사한 후:
1. `.env` 파일에 `DATABASE_URL` 추가
2. 마이그레이션 실행:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```






