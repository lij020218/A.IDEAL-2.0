/**
 * 로컬 파일을 Vercel Blob Storage로 마이그레이션하는 스크립트
 * 
 * 사용법:
 * 1. VERCEL_BLOB_READ_WRITE_TOKEN 환경 변수 설정
 * 2. node scripts/migrate-files-to-blob.js
 */

const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat');

async function migrateFiles() {
  console.log('🚀 파일 마이그레이션 시작\n');

  if (!process.env.VERCEL_BLOB_READ_WRITE_TOKEN) {
    console.error('❌ VERCEL_BLOB_READ_WRITE_TOKEN 환경 변수가 설정되지 않았습니다!');
    console.error('   Vercel Dashboard → Settings → Environment Variables에서 토큰을 설정하세요.');
    process.exit(1);
  }

  if (!fs.existsSync(uploadDir)) {
    console.log('📁 업로드 디렉토리가 없습니다. 마이그레이션할 파일이 없습니다.');
    return;
  }

  const files = fs.readdirSync(uploadDir).filter((file) => {
    const filePath = path.join(uploadDir, file);
    return fs.statSync(filePath).isFile();
  });

  if (files.length === 0) {
    console.log('📁 마이그레이션할 파일이 없습니다.');
    return;
  }

  console.log(`📊 발견된 파일: ${files.length}개\n`);

  let successCount = 0;
  let errorCount = 0;
  const migratedUrls = [];

  for (const file of files) {
    try {
      const filePath = path.join(uploadDir, file);
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(file);
      const contentType = getContentType(ext);

      console.log(`📤 업로드 중: ${file}...`);

      const blob = await put(`chat/${file}`, buffer, {
        access: 'public',
        contentType,
      });

      migratedUrls.push({
        local: `/uploads/chat/${file}`,
        blob: blob.url,
        filename: file,
      });

      console.log(`   ✅ 성공: ${blob.url}`);
      successCount++;
    } catch (error) {
      console.error(`   ❌ 실패: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`\n✨ 마이그레이션 완료!`);
  console.log(`   ✅ 성공: ${successCount}개`);
  console.log(`   ❌ 실패: ${errorCount}개`);

  // 마이그레이션 결과를 JSON 파일로 저장
  if (migratedUrls.length > 0) {
    const resultPath = path.join(process.cwd(), 'scripts', 'migrated-files.json');
    fs.writeFileSync(resultPath, JSON.stringify(migratedUrls, null, 2));
    console.log(`\n📝 마이그레이션 결과가 ${resultPath}에 저장되었습니다.`);
    console.log('   데이터베이스의 파일 URL을 업데이트할 때 이 파일을 참고하세요.');
  }
}

function getContentType(ext) {
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  };
  return contentTypes[ext.toLowerCase()] || 'application/octet-stream';
}

migrateFiles().catch((error) => {
  console.error('❌ 마이그레이션 실패:', error);
  process.exit(1);
});

