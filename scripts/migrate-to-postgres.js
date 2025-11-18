/**
 * SQLite에서 PostgreSQL로 데이터 마이그레이션 스크립트
 * 
 * 사용법:
 * 1. .env 파일에 PostgreSQL DATABASE_URL 설정
 * 2. npm install better-sqlite3
 * 3. node scripts/migrate-to-postgres.js
 */

const { PrismaClient } = require('@prisma/client');
const Database = require('better-sqlite3');
require('dotenv').config();

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

// Prisma 모델명을 테이블명으로 변환 (대소문자 구분)
const modelToTable = {
  'User': 'User',
  'Prompt': 'Prompt',
  'PromptRating': 'PromptRating',
  'Challenge': 'Challenge',
  'ChatRoom': 'ChatRoom',
  'ChatMember': 'ChatMember',
  'ChatMessage': 'ChatMessage',
  'Comment': 'Comment',
  'JoinRequest': 'JoinRequest',
  'Notification': 'Notification',
  'Event': 'Event',
  'Whiteboard': 'Whiteboard',
  'WhiteboardItem': 'WhiteboardItem',
  'GrowthTopic': 'GrowthTopic',
  'Curriculum': 'Curriculum',
  'LearningProgress': 'LearningProgress',
  'SearchHistory': 'SearchHistory',
  'Follow': 'Follow',
};

async function migrateTable(modelName) {
  const tableName = modelToTable[modelName];
  console.log(`\n📦 마이그레이션 중: ${modelName} (${tableName})...`);
  
  try {
    // SQLite에서 데이터 읽기
    const rows = sqliteDb.prepare(`SELECT * FROM "${tableName}"`).all();
    
    if (rows.length === 0) {
      console.log(`   ⏭️  ${modelName}: 데이터 없음`);
      return;
    }

    console.log(`   📊 ${modelName}: ${rows.length}개 레코드 발견`);

    // PostgreSQL에 데이터 쓰기
    let successCount = 0;
    let errorCount = 0;
    let skipCount = 0;

    for (const row of rows) {
      try {
        // DateTime 필드를 ISO 문자열로 변환
        const processedRow = {};
        for (const [key, value] of Object.entries(row)) {
          if (value instanceof Date) {
            processedRow[key] = value.toISOString();
          } else if (value === null || value === undefined) {
            processedRow[key] = null;
          } else {
            processedRow[key] = value;
          }
        }

        // Prisma의 create 메서드 사용 (Prisma는 모델명을 소문자로 변환)
        const modelNameLower = modelName.charAt(0).toLowerCase() + modelName.slice(1);
        const model = postgres[modelNameLower];
        if (!model) {
          throw new Error(`Model ${modelNameLower} not found in Prisma Client`);
        }
        await model.create({
          data: processedRow,
        });
        successCount++;
      } catch (error) {
        // 중복 키 오류는 무시 (이미 존재하는 데이터)
        if (error.code === 'P2002' || error.message?.includes('Unique constraint') || error.message?.includes('already exists')) {
          skipCount++;
          if (skipCount <= 3) {
            console.log(`   ⚠️  ${modelName} ID ${row.id}: 이미 존재함 (건너뜀)`);
          }
        } else {
          console.error(`   ❌ ${modelName} ID ${row.id}: ${error.message}`);
          errorCount++;
        }
      }
    }

    if (skipCount > 3) {
      console.log(`   ⚠️  ${skipCount - 3}개 추가 레코드 건너뜀`);
    }
    console.log(`   ✅ ${modelName}: ${successCount}개 성공, ${errorCount}개 실패, ${skipCount}개 건너뜀`);
  } catch (error) {
    console.error(`   ❌ ${modelName} 마이그레이션 실패: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 SQLite → PostgreSQL 마이그레이션 시작\n');
  const dbUrl = process.env.DATABASE_URL || '';
  const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@');
  console.log(`📡 PostgreSQL URL: ${maskedUrl}`);

  if (!dbUrl || !dbUrl.startsWith('postgresql://')) {
    console.error('❌ DATABASE_URL이 PostgreSQL 형식이 아닙니다!');
    console.error('   .env 파일에 DATABASE_URL="postgresql://..." 형식으로 설정하세요.');
    process.exit(1);
  }

  try {
    // PostgreSQL 연결 테스트
    await postgres.$connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 각 테이블 순서대로 마이그레이션
    for (const model of modelOrder) {
      await migrateTable(model);
    }

    console.log('\n✨ 마이그레이션 완료!');
  } catch (error) {
    console.error('\n❌ 마이그레이션 실패:', error.message);
    process.exit(1);
  } finally {
    await postgres.$disconnect();
    sqliteDb.close();
  }
}

main();

