#!/usr/bin/env node
// 直接执行数据库迁移（使用 Supabase RPC）

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  console.error('   需要 SUPABASE_SERVICE_ROLE_KEY (不是 ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const MIGRATION_SQL = `
-- 新增字段
ALTER TABLE industry_intelligence
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS source_credibility TEXT,
ADD COLUMN IF NOT EXISTS publish_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS sub_category TEXT,
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT,
ADD COLUMN IF NOT EXISTS importance_score FLOAT,
ADD COLUMN IF NOT EXISTS key_insights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS industry_impact TEXT,
ADD COLUMN IF NOT EXISTS tech_innovation TEXT,
ADD COLUMN IF NOT EXISTS market_trend TEXT,
ADD COLUMN IF NOT EXISTS competitive_dynamics TEXT,
ADD COLUMN IF NOT EXISTS related_companies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_technologies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_products JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS time_sensitivity TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS ai_analyzed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_provider TEXT,
ADD COLUMN IF NOT EXISTS confidence FLOAT;

-- 索引
CREATE INDEX IF NOT EXISTS idx_intel_source_credibility ON industry_intelligence(source_credibility);
CREATE INDEX IF NOT EXISTS idx_intel_time_sensitivity ON industry_intelligence(time_sensitivity);

SELECT '迁移完成' as result;
`;

async function migrate() {
  console.log('🚀 执行数据库迁移...\n');

  try {
    // 尝试执行 SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: MIGRATION_SQL });

    if (error) {
      console.log('⚠️  exec_sql RPC 不可用，尝试直接查询...');

      // 备选方案：逐个添加列
      const columns = [
        { name: 'source_url', type: 'TEXT' },
        { name: 'summary', type: 'TEXT' },
        { name: 'source_credibility', type: 'TEXT' },
        { name: 'publish_time', type: 'TIMESTAMP' },
        { name: 'sentiment_score', type: 'FLOAT' },
        { name: 'importance_score', type: 'FLOAT' },
        { name: 'key_insights', type: 'JSONB', default: "'[]'::jsonb" },
        { name: 'time_sensitivity', type: 'TEXT', default: "'normal'" },
        { name: 'ai_analyzed', type: 'BOOLEAN', default: 'false' },
      ];

      let added = 0;
      for (const col of columns) {
        const { error: colError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}${col.default ? ' DEFAULT ' + col.default : ''};`
        });
        if (!colError) {
          console.log(`   ✓ ${col.name}`);
          added++;
        }
      }

      console.log(`\n✅ 添加了 ${added} 个字段`);
    } else {
      console.log('✅ 迁移成功:', data);
    }

  } catch (err) {
    console.error('❌ 迁移失败:', err.message);
    console.log('\n请手动执行 scripts/migration-v2.sql');
  }
}

migrate();
