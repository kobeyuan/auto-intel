#!/usr/bin/env node
// 数据库迁移脚本 V2 - 添加情报系统优化字段

const fs = require('fs');
const path = require('path');

function showMigrationSQL() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     数据库迁移 V2 - 情报系统优化       ║');
  console.log('╚════════════════════════════════════════╝\n');

  const sqlFile = path.join(__dirname, 'migration-v2.sql');

  if (fs.existsSync(sqlFile)) {
    const sql = fs.readFileSync(sqlFile, 'utf-8');
    console.log('📋 请复制以下 SQL 到 Supabase SQL Editor 执行:\n');
    console.log('─'.repeat(60));
    console.log(sql);
    console.log('─'.repeat(60));
    console.log('\n✅ SQL 文件位置: scripts/migration-v2.sql');
  } else {
    console.error('❌ 找不到 SQL 文件: scripts/migration-v2.sql');
    process.exit(1);
  }
}

function showStatus() {
  console.log('\n📊 迁移检查清单:\n');
  console.log('  □ 1. 在 Supabase SQL Editor 执行 migration-v2.sql');
  console.log('  □ 2. 验证新字段已添加');
  console.log('  □ 3. 运行 npm run intel:crawl -- --save 测试数据保存');
  console.log('  □ 4. 检查数据是否正常写入\n');
}

// 直接运行
if (require.main === module) {
  showMigrationSQL();
  showStatus();
}
