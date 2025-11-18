/**
 * Upload local files to Supabase Storage
 *
 * Usage: node scripts/upload-to-supabase.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Supabase 설정
const supabaseUrl = 'https://trzwqgnqzvwrklsljrgp.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'uploads';
const LOCAL_UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

/**
 * Upload a single file to Supabase Storage
 */
async function uploadFile(localPath, remotePath) {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const ext = path.extname(localPath).toLowerCase();

    // Determine content type
    const contentTypeMap = {
      '.pdf': 'application/pdf',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.txt': 'text/plain',
      '.json': 'application/json',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(remotePath, fileBuffer, {
        contentType,
        upsert: true, // Overwrite if exists
      });

    if (error) {
      throw error;
    }

    return { success: true, path: remotePath };
  } catch (error) {
    return { success: false, path: remotePath, error: error.message };
  }
}

/**
 * Main upload function
 */
async function main() {
  console.log('🚀 Starting file upload to Supabase Storage...\n');
  console.log(`📁 Local directory: ${LOCAL_UPLOADS_DIR}`);
  console.log(`🪣 Supabase bucket: ${BUCKET_NAME}\n`);

  // Check if local directory exists
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    console.error(`❌ Error: Directory not found: ${LOCAL_UPLOADS_DIR}`);
    process.exit(1);
  }

  // Get all files
  const allFiles = getAllFiles(LOCAL_UPLOADS_DIR);
  console.log(`📊 Found ${allFiles.length} files to upload\n`);

  if (allFiles.length === 0) {
    console.log('✅ No files to upload');
    return;
  }

  // Upload files
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  for (let i = 0; i < allFiles.length; i++) {
    const localPath = allFiles[i];
    // Get relative path from uploads directory
    const relativePath = path.relative(LOCAL_UPLOADS_DIR, localPath).replace(/\\/g, '/');

    process.stdout.write(`[${i + 1}/${allFiles.length}] Uploading ${relativePath}... `);

    const result = await uploadFile(localPath, relativePath);

    if (result.success) {
      console.log('✅');
      results.success++;
    } else {
      console.log(`❌ ${result.error}`);
      results.failed++;
      results.errors.push({ path: result.path, error: result.error });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Upload Summary:');
  console.log(`✅ Success: ${results.success}`);
  console.log(`❌ Failed: ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\n❌ Failed uploads:');
    results.errors.forEach(({ path, error }) => {
      console.log(`  - ${path}: ${error}`);
    });
  }

  console.log('='.repeat(50));

  if (results.failed === 0) {
    console.log('\n🎉 All files uploaded successfully!');
  } else {
    console.log(`\n⚠️  ${results.failed} file(s) failed to upload`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
