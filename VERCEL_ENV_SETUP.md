# Vercel 환경 변수 설정 가이드

## 현재 상황
- GitHub에 코드가 성공적으로 업로드됨 (commit: 308729a)
- Vercel 배포 시도 중 데이터베이스 인증 오류 발생
- 오류: `P1000: Authentication failed against database server`

## 해결 방법: Vercel에 환경 변수 추가

### 1. Vercel 대시보드 접속
1. https://vercel.com 로그인
2. 프로젝트 선택
3. Settings → Environment Variables 메뉴로 이동

### 2. 추가해야 할 환경 변수 (반드시 URL 인코딩된 형식 사용)

#### 필수 환경 변수

**DATABASE_URL** (Production, Preview, Development 모두 체크)
```
postgresql://postgres.trzwqgnqzvwrklsljrgp:absolute1388%21%21%40%40%40@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
```

**DIRECT_URL** (Production, Preview, Development 모두 체크)
```
postgresql://postgres.trzwqgnqzvwrklsljrgp:absolute1388%21%21%40%40%40@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

**NEXTAUTH_SECRET** (Production, Preview, Development 모두 체크)
```
U1P4IRlDJOE8usdQta/QqBpydhzLpa2+p4byBS7P8+w=
```

**NEXTAUTH_URL** (Production만 체크 - 배포 후 실제 도메인으로 업데이트 필요)
```
https://your-app-name.vercel.app
```
*주의: 첫 배포 후 실제 Vercel 도메인으로 변경해야 합니다*

#### AI API Keys (선택사항 - 사용 중인 서비스만 추가)

**OPENAI_API_KEY** (Production, Preview, Development 모두 체크)
```
[.env.local 파일에 있는 OPENAI_API_KEY 값을 복사하여 붙여넣으세요]
```

**OPENAI_MODEL** (Production, Preview, Development 모두 체크)
```
gpt-5.1-2025-11-13
```

**CLAUDE_API_KEY** (Production, Preview, Development 모두 체크)
```
[.env.local 파일에 있는 CLAUDE_API_KEY 값을 복사하여 붙여넣으세요]
```

**CLAUDE_MODEL** (Production, Preview, Development 모두 체크)
```
claude-sonnet-4-20250514
```

### 3. URL 인코딩 주의사항

**중요**: 데이터베이스 비밀번호에 특수문자가 포함되어 있으므로 반드시 URL 인코딩된 형식을 사용해야 합니다.

- 원본 비밀번호: `absolute1388!!@@@`
- URL 인코딩: `absolute1388%21%21%40%40%40`
  - `!` → `%21`
  - `@` → `%40`

**Vercel에 입력할 때**: 반드시 `absolute1388%21%21%40%40%40` (URL 인코딩된 버전) 사용

### 4. 환경 변수 적용 범위 선택

각 환경 변수를 추가할 때 적용 범위를 선택해야 합니다:

- **Production**: 프로덕션 배포에 적용
- **Preview**: PR 및 브랜치 배포에 적용
- **Development**: 로컬 개발 환경 (일반적으로 .env.local 사용하므로 선택 불필요)

**권장**: Production과 Preview 모두 체크

### 5. 환경 변수 추가 후 재배포

1. 모든 환경 변수를 추가한 후
2. Deployments 탭으로 이동
3. 최신 배포의 "..." 메뉴 클릭
4. "Redeploy" 선택
5. "Redeploy" 버튼 클릭하여 재배포 시작

### 6. 배포 성공 후 NEXTAUTH_URL 업데이트

배포가 성공하면:
1. Vercel이 제공한 실제 도메인 확인 (예: `https://a-ideal.vercel.app`)
2. Settings → Environment Variables로 이동
3. NEXTAUTH_URL 값을 실제 도메인으로 업데이트
4. 다시 재배포

## 체크리스트

- [ ] Vercel 대시보드에서 Environment Variables 메뉴 열기
- [ ] DATABASE_URL 추가 (URL 인코딩된 형식)
- [ ] DIRECT_URL 추가 (URL 인코딩된 형식)
- [ ] NEXTAUTH_SECRET 추가
- [ ] NEXTAUTH_URL 추가 (임시로 https://your-app-name.vercel.app)
- [ ] OPENAI_API_KEY 추가 (선택)
- [ ] OPENAI_MODEL 추가 (선택)
- [ ] CLAUDE_API_KEY 추가 (선택)
- [ ] CLAUDE_MODEL 추가 (선택)
- [ ] 각 변수의 적용 범위 설정 (Production, Preview)
- [ ] Deployments에서 Redeploy 실행
- [ ] 배포 성공 확인
- [ ] NEXTAUTH_URL을 실제 도메인으로 업데이트
- [ ] 최종 재배포

## 문제 해결

### 여전히 데이터베이스 연결 오류가 발생하는 경우

1. **Supabase 연결 설정 확인**
   - Supabase 대시보드에서 Database 설정 확인
   - Connection pooling이 활성화되어 있는지 확인
   - IP 허용 목록에 Vercel IP가 포함되어 있는지 확인 (0.0.0.0/0으로 모든 IP 허용 권장)

2. **환경 변수 재확인**
   - DATABASE_URL의 포트가 6543인지 확인 (connection pooler)
   - DIRECT_URL의 포트가 5432인지 확인 (direct connection)
   - 비밀번호가 정확히 URL 인코딩되었는지 확인

3. **Vercel 빌드 로그 확인**
   - Deployments → 실패한 배포 클릭
   - 빌드 로그에서 정확한 오류 메시지 확인

## 추가 정보

- Vercel 환경 변수 문서: https://vercel.com/docs/projects/environment-variables
- Supabase Vercel 통합 가이드: https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- Prisma Vercel 배포 가이드: https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel
