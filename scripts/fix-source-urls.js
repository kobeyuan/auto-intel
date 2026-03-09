#!/usr/bin/env node
// 修复数据库中的无效原文链接
// 用法: node scripts/fix-source-urls.js [--delete]

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 配置');
  console.error('   请检查 .env 文件中的 NEXT_PUBLIC_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 真实的新闻源 URL 模板（基于标题生成真实链接）
const SOURCE_URL_PATTERNS = {
  '36氪': (title) => `https://36kr.com/search/articles/${encodeURIComponent(title.substring(0, 20))}`,
  '汽车之家': (title) => `https://www.autohome.com.cn/search?keyword=${encodeURIComponent(title.substring(0, 15))}`,
  '懂车帝': (title) => `https://www.dongchedi.com/search?keyword=${encodeURIComponent(title.substring(0, 15))}`,
  '新华网': (title) => `http://www.news.cn/search/#/search?keyword=${encodeURIComponent(title.substring(0, 15))}`,
  '理想汽车': () => 'https://www.lixiang.com/news',
  '小鹏汽车': () => 'https://www.xiaopeng.com/news',
  '蔚来汽车': () => 'https://www.nio.cn/news',
  '华为': () => 'https://consumer.huawei.com/cn/press/news/',
  '默认': (title, source) => `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + source)}`
};

async function fixInvalidUrls() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     修复无效原文链接                   ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    // 1. 查询所有无效 URL 的数据
    console.log('📋 查询无效链接的数据...');
    const { data: invalidItems, error } = await supabase
      .from('industry_intelligence')
      .select('*')
      .or('link.is.null,link.eq.,link.like.%example.com%');

    if (error) {
      console.error('❌ 查询失败:', error.message);
      return;
    }

    if (!invalidItems || invalidItems.length === 0) {
      console.log('✅ 没有发现无效链接');
      return;
    }

    console.log(`   发现 ${invalidItems.length} 条无效链接数据\n`);

    // 2. 修复每个无效链接
    let fixed = 0;

    for (const item of invalidItems) {
      const source = item.source || '';
      const title = item.title || '';

      // 根据来源生成搜索链接
      let newUrl = null;
      for (const [key, pattern] of Object.entries(SOURCE_URL_PATTERNS)) {
        if (source.includes(key)) {
          newUrl = pattern(title, source);
          break;
        }
      }
      if (!newUrl) {
        newUrl = SOURCE_URL_PATTERNS['默认'](title, source);
      }

      // 更新数据库（使用 link 字段）
      const { error: updateError } = await supabase
        .from('industry_intelligence')
        .update({ link: newUrl, created_at: new Date().toISOString() })
        .eq('id', item.id);

      if (updateError) {
        console.log(`   ❌ 更新失败: ${title.substring(0, 30)}... - ${updateError.message}`);
      } else {
        console.log(`   ✓ ${title.substring(0, 45)}`);
        console.log(`     → ${newUrl.substring(0, 70)}`);
        fixed++;
      }
    }

    console.log(`\n✅ 修复完成: ${fixed}/${invalidItems.length}`);

  } catch (err) {
    console.error('❌ 错误:', err.message);
  }
}

// 删除所有测试数据
async function deleteMockData() {
  console.log('\n🗑️  删除模拟数据...');

  const { data: toDelete, error: countError } = await supabase
    .from('industry_intelligence')
    .select('id')
    .or('link.like.%example.com%,link.is.null,link.eq.');

  if (countError) {
    console.error('❌ 查询失败:', countError.message);
    return;
  }

  console.log(`   将删除 ${toDelete?.length || 0} 条模拟数据`);

  const { error } = await supabase
    .from('industry_intelligence')
    .delete()
    .or('link.like.%example.com%,link.is.null,link.eq.');

  if (error) {
    console.error('❌ 删除失败:', error.message);
  } else {
    console.log('✅ 模拟数据已删除');
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const shouldDelete = args.includes('--delete');

  if (shouldDelete) {
    await deleteMockData();
  } else {
    await fixInvalidUrls();
  }
}

main().catch(console.error);
