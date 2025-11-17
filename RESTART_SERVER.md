# 서버 재시작이 필요합니다

데이터베이스 스키마가 업데이트되어 Prisma Client를 다시 생성해야 합니다.

## 재시작 방법:

1. **현재 실행 중인 개발 서버를 종료하세요** (Ctrl+C)

2. **다음 명령어를 실행하세요:**
   ```bash
   npx prisma generate
   npm run dev
   ```

3. 만약 `prisma generate`에서 권한 오류가 발생하면:
   - Windows: 터미널을 관리자 권한으로 실행
   - 또는: 개발 서버만 재시작 (`npm run dev`)하면 자동으로 생성됨

## 변경 사항:

- ✅ 데이터베이스 마이그레이션 완료
- ✅ views, averageRating, ratingCount 필드 추가
- ✅ PromptRating 테이블 생성
- ⏳ Prisma Client 업데이트 필요

재시작 후 이 파일은 삭제하셔도 됩니다.
