#!/usr/bin/env node
// 行业情报采集V2 - 优化时效性、准确性、洞察质量

require('dotenv').config();
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || '[L]gemini-3-pro-preview';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

// Supabase 客户端（懒加载，避免Node.js版本问题）
let supabase = null;
function getSupabase() {
  if (supabase) return supabase;
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
    }
  } catch (e) {
    console.log('⚠️ Supabase 初始化失败，将使用模拟模式');
    supabase = null;
  }
  return supabase;
}

// 解析命令行参数
const args = process.argv.slice(2);
const shouldSaveToDB = args.includes('--save');
const categoryFilter = args.find(arg => arg.startsWith('--category='))?.split('=')[1];

// 高优先级情报源（确保时效性）
const HIGH_PRIORITY_SOURCES = {
  official: [
    { name: '华为智能汽车', keywords: ['华为智能汽车', '华为智选车', '鸿蒙智行'] },
    { name: '小鹏汽车', keywords: ['小鹏OTA', '小鹏XNGP', '小鹏智驾'] },
    { name: '理想汽车', keywords: ['理想OTA', '理想AD Max', '理想智驾'] },
    { name: '蔚来汽车', keywords: ['蔚来Banyan', '蔚来NOP', '蔚来NAD'] }
  ],
  media: [
    { name: '36氪', keywords: ['36氪汽车', '36氪智驾'] },
    { name: '汽车之家', keywords: ['汽车之家新闻'] },
    { name: '懂车帝', keywords: ['懂车帝原创'] }
  ]
};

// 传感器专项关键词（含华为896线等最新技术）
const SENSOR_KEYWORDS = {
  lidar: [
    '华为激光雷达 896线', '华为192线激光雷达', '华为D3激光雷达',
    '华为激光雷达 新品', '华为激光雷达 发布',
    '禾赛激光雷达 新品', '禾赛AT512', '禾赛AT128',
    '速腾聚创激光雷达', '速腾M1 Plus', '速腾M2',
    '览沃激光雷达', '大疆激光雷达',
    '补盲激光雷达', '4D激光雷达', 'FMCW激光雷达'
  ],
  radar: [
    '4D毫米波雷达', '华为4D成像雷达',
    '森思泰克雷达', '楚航科技雷达',
    '前向雷达 新品', '角雷达 新品'
  ],
  camera: [
    '800万像素摄像头', '车载摄像头 1200万',
    '地平线征程6', '地平线J6', 'J6芯片',
    '黑芝麻华山A2000', '华山A2000芯片',
    '英伟达Thor', 'DRIVE Thor', 'Thor芯片'
  ]
};

// OTA专项关键词
const OTA_KEYWORDS = [
  '蔚来OTA', '蔚来Banyan 3.0', '蔚来系统升级',
  '小鹏OTA', '小鹏Xmart OS', '小鹏天玑升级',
  '理想OTA', '理想OTA 5.0', '理想OTA 6.0', '理想车机升级',
  '极氪OTA', 'ZEEKR OS 6.0', '极氪OS升级',
  '问界OTA', '鸿蒙座舱升级', '问界系统更新',
  '特斯拉OTA', '特斯拉FSD更新',
  '小米OTA', '小米澎湃OS升级'
];

// 搜索函数（使用 Brave Search API）
async function searchWithRetry(query, maxRetries = 3) {
  console.log(`  🔍 搜索: ${query}`);

  if (!BRAVE_API_KEY) {
    console.log('  ⚠️  BRAVE_API_KEY 未配置，使用模拟数据');
    return getMockResults(query);
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/news/search?q=${encodeURIComponent(query)}&count=5&offset=0&language=zh`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'X-Subscription-Token': BRAVE_API_KEY
          }
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`  ⏳ 请求频率限制，等待2秒后重试...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
        throw new Error(`Brave API错误: ${response.status}`);
      }

      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        return [];
      }

      // 转换Brave API响应格式
      return data.results.map(item => ({
        title: item.title || '',
        snippet: item.description || '',
        url: item.url || '',
        source: item.meta?.url?.hostname || item.source || '未知来源',
        publishedAt: item.page_age || new Date().toISOString()
      }));

    } catch (error) {
      console.log(`  ⚠️  第${attempt}次尝试失败: ${error.message}`);
      if (attempt === maxRetries) {
        console.log(`  ❌ 搜索失败，返回模拟数据`);
        return getMockResults(query);
      }
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  return [];
}

// 模拟搜索结果（作为备用）
function getMockResults(query) {
  if (query.includes('华为') && query.includes('激光雷达')) {
    return [{
      title: '华为发布192线激光雷达，问界M9率先搭载',
      snippet: '华为在2024年智能汽车解决方案发布会上推出192线激光雷达，探测距离达到250米@10%，点云密度提升3倍。该雷达将首先搭载于问界M9，预计2024年Q2开始交付。',
      url: 'https://auto.home.news.cn/2024/0301/c88a99.htm',
      source: '新华网汽车',
      publishedAt: new Date().toISOString()
    }];
  }

  if (query.includes('禾赛')) {
    return [{
      title: '禾赛发布AT512激光雷达，分辨率超高清',
      snippet: '禾赛科技发布AT512超高清超远距激光雷达，拥有512线，探测距离400米@10%，将为L3级自动驾驶提供强有力支撑。',
      url: 'https://36kr.com/p/2625898.html',
      source: '36氪',
      publishedAt: new Date().toISOString()
    }];
  }

  if (query.includes('理想') && query.includes('OTA')) {
    return [{
      title: '理想汽车推送OTA 5.2，城市NOA覆盖100城',
      snippet: '理想汽车开始推送OTA 5.2版本，城市NOA功能覆盖扩大至100个城市，同时优化了高速NOA的舒适性和安全性。',
      url: 'https://www.lixiang.com/news/ota5-2.html',
      source: '理想汽车',
      publishedAt: new Date().toISOString()
    }];
  }

  return [];
}

// AI深度分析情报
async function analyzeIntelligence(title, content, category) {
  if (!GEMINI_API_KEY) {
    console.log('  ⚠️  Gemini API Key未配置，跳过AI分析');
    return null;
  }

  const prompt = `作为智能驾驶产业分析师，分析以下情报：

【标题】${title}
【内容】${content}
【类别】${category}

返回JSON格式：
{
  "summary": "核心摘要（25字内）",
  "sentiment": "positive/neutral/negative",
  "sentimentScore": 0.8,
  "importance": "critical/high/medium/low",
  "importanceScore": 0.85,
  "keyInsights": ["洞察1", "洞察2", "洞察3"],
  "industryImpact": "产业影响（40字）",
  "relatedCompanies": ["华为", "小鹏", "蔚来"],
  "relatedTechnologies": ["激光雷达", "芯片"],
  "timeSensitivity": "breaking/trending/normal"
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [
          { role: 'system', content: '你是智能驾驶产业研究专家，擅长情报分析。只返回JSON格式。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 800
      })
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text) return null;

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('  ❌ AI分析失败:', error.message);
    return null;
  }
}

// 采集传感器情报
async function crawlSensors() {
  console.log('\n📡 采集传感器情报...');
  const results = [];

  // 采集激光雷达
  for (const keyword of SENSOR_KEYWORDS.lidar) {
    const news = await searchWithRetry(keyword, 2);
    for (const item of news) {
      console.log(`  ✓ ${item.title}`);
      const analysis = await analyzeIntelligence(item.title, item.snippet, 'sensor');
      results.push({ ...item, category: 'sensor', ...analysis });
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 采集毫米波雷达
  for (const keyword of SENSOR_KEYWORDS.radar) {
    const news = await searchWithRetry(keyword, 2);
    for (const item of news) {
      console.log(`  ✓ ${item.title}`);
      const analysis = await analyzeIntelligence(item.title, item.snippet, 'sensor');
      results.push({ ...item, category: 'sensor', ...analysis });
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  // 采集摄像头和芯片
  for (const keyword of SENSOR_KEYWORDS.camera) {
    const news = await searchWithRetry(keyword, 2);
    for (const item of news) {
      console.log(`  ✓ ${item.title}`);
      const analysis = await analyzeIntelligence(item.title, item.snippet, 'sensor');
      results.push({ ...item, category: 'sensor', ...analysis });
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return results;
}

// 采集OTA情报
async function crawlOTA() {
  console.log('\n🚗 采集OTA更新情报...');
  const results = [];

  for (const keyword of OTA_KEYWORDS) {
    const news = await searchWithRetry(keyword, 2);
    for (const item of news) {
      console.log(`  ✓ ${item.title}`);

      // OTA专项分析
      const prompt = `分析以下OTA更新：
标题：${item.title}
内容：${item.snippet}

返回JSON：
{
  "brand": "品牌",
  "model": "车型",
  "version": "版本号",
  "updateType": "major/minor/hotfix",
  "keyFeatures": ["功能1", "功能2"],
  "competitiveAnalysis": "竞品对比分析（50字）"
}`;

      try {
        const response = await fetch(`${GEMINI_API_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GEMINI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: GEMINI_MODEL,
            messages: [
              { role: 'system', content: '你是智能汽车OTA分析专家。只返回JSON格式。' },
              { role: 'user', content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500
          })
        });

        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;

        if (text) {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            results.push({ ...item, category: 'ota', ...analysis });
          }
        }
      } catch (error) {
        console.error('  OTA分析失败:', error.message);
      }

      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return results;
}

// 验证URL是否有效
function isValidUrl(url) {
  if (!url || url === '') return false;
  if (url.includes('example.com')) return false;
  if (url.includes('localhost')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 保存到数据库
async function saveToDatabase(items) {
  const client = getSupabase();
  if (!client) {
    console.log('\n⚠️  Supabase 未配置，跳过数据库保存');
    console.log('   请在 .env 中配置 SUPABASE_SERVICE_ROLE_KEY');
    return { saved: 0, errors: [] };
  }

  console.log('\n💾 保存到数据库...');
  let saved = 0;
  let updated = 0;
  const errors = [];

  for (const item of items) {
    try {
      // 验证URL有效性
      const url = item.url || item.source_url;
      if (!isValidUrl(url)) {
        console.log(`   ⚠️  跳过无效URL: ${item.title.substring(0, 30)}...`);
        continue;
      }

      // 构建数据库记录
      const record = {
        title: item.title,
        content: item.snippet || item.content,
        summary: item.summary,
        source: item.source,
        source_url: url,
        source_credibility: item.sourceCredibility || getSourceCredibility(item.source),
        publish_time: item.publishedAt || new Date().toISOString(),
        category: item.category || 'sensor',
        sentiment: item.sentiment || 'neutral',
        sentiment_score: item.sentimentScore || 0.5,
        importance: item.importance || 'medium',
        importance_score: item.importanceScore || 0.5,
        key_insights: item.keyInsights || [],
        industry_impact: item.industryImpact,
        tech_innovation: item.techInnovation,
        market_trend: item.marketTrend,
        competitive_dynamics: item.competitiveDynamics,
        related_companies: item.relatedCompanies || [],
        related_technologies: item.relatedTechnologies || [],
        related_products: item.relatedProducts || [],
        time_sensitivity: item.timeSensitivity || 'normal',
        ai_analyzed: true,
        ai_provider: 'gemini',
        confidence: item.confidence || 0.7,
        updated_at: new Date().toISOString()
      };

      // 先检查是否已存在相同URL的数据
      const { data: existing } = await client
        .from('industry_intelligence')
        .select('id, source_url')
        .eq('source_url', url)
        .single();

      if (existing) {
        // 更新现有记录
        const { error } = await client
          .from('industry_intelligence')
          .update(record)
          .eq('id', existing.id);

        if (error) {
          errors.push({ title: item.title, error: error.message });
        } else {
          updated++;
          console.log(`   ↻ ${item.title.substring(0, 40)}...`);
        }
      } else {
        // 插入新记录
        const { error } = await client
          .from('industry_intelligence')
          .insert(record);

        if (error) {
          if (error.message?.includes('does not exist')) {
            console.log('   ⚠️  表不存在，请先执行数据库迁移');
            console.log('   运行: npm run db:migrate');
            return { saved, errors: ['表不存在'] };
          }
          errors.push({ title: item.title, error: error.message });
        } else {
          saved++;
          console.log(`   ✓ ${item.title.substring(0, 40)}...`);
        }
      }
    } catch (err) {
      errors.push({ title: item.title, error: err.message });
    }
  }

  console.log(`\n   新增: ${saved} | 更新: ${updated} | 失败: ${errors.length}`);
  return { saved: saved + updated, errors };
}

// 根据来源判断可信度
function getSourceCredibility(source) {
  const official = ['华为官网', '小鹏官网', '蔚来官网', '理想官网', '官方公告', '工信部', '新华网'];
  const tier1 = ['36氪', '财新', '第一财经', '界面', '澎湃', '人民网'];

  if (official.some(s => source?.includes(s))) return 'official';
  if (tier1.some(s => source?.includes(s))) return 'tier1';
  return 'tier2';
}

// 生成行业周报
async function generateWeeklyReport(allResults) {
  if (allResults.length === 0) {
    return '暂无数据';
  }

  const newsText = allResults.slice(0, 10).map((n, i) =>
    `${i + 1}. ${n.title}`
  ).join('\n');

  const prompt = `基于以下智能驾驶行业情报，生成周报（600字内）：

${newsText}

请包含：
1. 本周热点事件（带数据）
2. 传感器技术进展
3. OTA更新动态
4. 下周关注要点`;

  try {
    const response = await fetch(`${GEMINI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [
          { role: 'system', content: '你是智能驾驶行业研究专家，擅长撰写周报。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '生成失败';
  } catch (error) {
    return '生成失败';
  }
}

// 主函数
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║     行业情报采集V2 - 优化版            ║');
  console.log('╚════════════════════════════════════════╝');
  console.log(`\n⏰ ${new Date().toLocaleString('zh-CN')}`);
  console.log(`🤖 使用模型: ${GEMINI_MODEL}`);
  console.log(`💾 保存到数据库: ${shouldSaveToDB ? '是' : '否'}\n`);

  const allResults = [];

  // 根据类别过滤
  if (!categoryFilter || categoryFilter === 'sensor') {
    const sensorResults = await crawlSensors();
    allResults.push(...sensorResults);
  }

  if (!categoryFilter || categoryFilter === 'ota') {
    const otaResults = await crawlOTA();
    allResults.push(...otaResults);
  }

  // 统计
  console.log('\n📊 采集统计:');
  const sensorCount = allResults.filter(r => r.category === 'sensor').length;
  const otaCount = allResults.filter(r => r.category === 'ota').length;
  console.log(`  传感器情报: ${sensorCount} 条`);
  console.log(`  OTA情报: ${otaCount} 条`);
  console.log(`  总计: ${allResults.length} 条`);

  // 保存到数据库
  if (shouldSaveToDB && allResults.length > 0) {
    await saveToDatabase(allResults);
  }

  // 生成周报
  console.log('\n📝 生成行业周报...\n');
  const report = await generateWeeklyReport(allResults);
  console.log(report);

  // 输出详情
  console.log('\n📋 情报详情:');
  allResults.forEach((item, i) => {
    console.log(`\n${i + 1}. [${item.category?.toUpperCase() || 'UNKNOWN'}] ${item.title}`);
    console.log(`   来源: ${item.source}`);
    console.log(`   AI摘要: ${item.summary || '无'}`);
    console.log(`   重要度: ${item.importance || '中'} | 时效性: ${item.timeSensitivity || 'normal'}`);
  });

  console.log('\n✅ 采集完成');
}

main().catch(console.error);
