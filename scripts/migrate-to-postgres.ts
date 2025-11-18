/**
 * SQLite에서 PostgreSQL로 데이터 마이그레이션 스크립트
 * 
 * 사용법:
 * 1. .env 파일에 PostgreSQL DATABASE_URL 설정
 * 2. DATABASE_URL을 임시로 SQLite로 변경하고 Prisma Client 생성
 * 3. DATABASE_URL을 PostgreSQL로 변경
 * 4. node --loader ts-node/esm scripts/migrate-to-postgres.ts
 * 
 * 또는 더 간단하게:
 * 1. .env에 DATABASE_URL_SQLITE="file:./dev.db" 추가
 * 2. .env에 DATABASE_URL에 PostgreSQL URL 설정
 * 3. 스크립트 실행
 */

import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import * as dotenv from 'dotenv';

dotenv.config();

// SQLite 직접 연결
const sqliteDb = new Database('./prisma/dev.db');

// PostgreSQL Prisma Client
const postgres = new PrismaClient();

// 모델 순서 (외래키 의존성 고려)
const modelOrder = [
  'User',
  'Prompt',
  'PromptRating',
  'Challenge',
  'ChatRoom',
  'ChatMember',
  'ChatMessage',
  'Comment',
  'JoinRequest',
  'Notification',
  'Event',
  'Whiteboard',
  'WhiteboardItem',
  'GrowthTopic',
  'Curriculum',
  'LearningProgress',
  'SearchHistory',
  'Follow',
];

async function migrateTable(tableName: string) {
  console.log(`\n📦 마이그레이션 중: ${tableName}...`);
  
  try {
    // SQLite에서 데이터 읽기
    const rows = sqliteDb.prepare(`SELECT * FROM ${tableName}`).all() as any[];
    
    if (rows.length === 0) {
      console.log(`   ⏭️  ${tableName}: 데이터 없음`);
      return;
    }

    console.log(`   📊 ${tableName}: ${rows.length}개 레코드 발견`);

    // PostgreSQL에 데이터 쓰기
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        // DateTime 필드를 ISO 문자열로 변환
        const processedRow: any = {};
        for (const [key, value] of Object.entries(row)) {
          if (value instanceof Date) {
            processedRow[key] = value.toISOString();
          } else if (value === null || value === undefined) {
            processedRow[key] = null;
          } else {
            processedRow[key] = value;
          }
        }

        // Prisma의 create 메서드 사용
        await (postgres as any)[tableName.toLowerCase()].create({
          data: processedRow,
        });
        successCount++;
      } catch (error: any) {
        // 중복 키 오류는 무시 (이미 존재하는 데이터)
        if (error.code === 'P2002' || error.message?.includes('Unique constraint')) {
          console.log(`   ⚠️  ${tableName} ID ${row.id}: 이미 존재함 (건너뜀)`);
        } else {
          console.error(`   ❌ ${tableName} ID ${row.id}: ${error.message}`);
          errorCount++;
        }
      }
    }

    console.log(`   ✅ ${tableName}: ${successCount}개 성공, ${errorCount}개 실패`);
  } catch (error: any) {
    console.error(`   ❌ ${tableName} 마이그레이션 실패: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 SQLite → PostgreSQL 마이그레이션 시작\n');
  console.log(`📡 PostgreSQL URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}`);

  try {
    // PostgreSQL 연결 테스트
    await postgres.$connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 각 테이블 순서대로 마이그레이션
    for (const model of modelOrder) {
      await migrateTable(model);
    }

    console.log('\n✨ 마이그레이션 완료!');
  } catch (error: any) {
    console.error('\n❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  } finally {
    await postgres.$disconnect();
    sqliteDb.close();
  }
}

main();

