// 增强版情报采集脚本
// 支持 AI 深度分析、趋势判断、多维度总结

require('dotenv').config();
const fetch = require('node-fetch');

const GEMINI_API_URL = process.env.GEMINI_API_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || '[L]gemini-3-pro-preview';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

// 扩展关键词库
const KEYWORDS = {
  // 传感器 - 重点关注
  sensor: {
    lidar: [
      '华为激光雷达', '华为192线激光雷达', '华为D3激光雷达', '华为问界激光雷达',
      '禾赛激光雷达', '禾赛AT128', '禾赛AT512', '禾赛FT120',
      '速腾聚创激光雷达', '速腾M1 Plus', '速腾M2', '速腾E1',
      '大疆激光雷达', '大疆 Livox', '览沃激光雷达',
      '图达通激光雷达', 'Innovusion Falcon',
      '补盲激光雷达', '4D激光雷达', 'FMCW激光雷达',
      '固态激光雷达', 'MEMS激光雷达', 'OPA激光雷达'
    ],
    radar: [
      '4D毫米波雷达', '4D成像雷达', '华为4D雷达',
      '森思泰克雷达', '楚航科技雷达', '华域汽车雷达',
      '博世第五代雷达', '大陆第六代雷达', '采埃孚雷达'
    ],
    camera: [
      '800万像素摄像头', '1200万像素摄像头', '前视双摄像头',
      'Mobileye EyeQ6', '地平线J6', '征程6',
      '黑芝麻华山A2000', '英伟达Orin', '高通骁龙Ride'
    ]
  },
  // 智驾方案
  ad: {
    huawei: ['华为ADS 3.0', '华为乾崑智驾', '华为问界智驾', '华为享界智驾'],
    xiaopeng: ['小鹏XNGP', '小鹏XBrain', '小鹏端到端'],
    li: ['理想AD Max 3.0', '理想城市NOA', '理想端到端'],
    nio: ['蔚来NOP+', '蔚来NAD', '蔚来世界模型'],
    others: ['特斯拉FSD入华', '小米智驾', '百度Apollo', '比亚迪天神之眼']
  },
  // 座舱
  cockpit: {
    os: ['鸿蒙座舱', '小米澎湃OS', '蔚来Banyan 3.0', '理想Mind GPT'],
    interaction: ['AR-HUD', '光场屏', '空中成像', '手势识别', 'DMS']
  }
};

// 搜索新闻
async function searchNews(query, maxResults = 5) {
  if (!BRAVE_API_KEY) {
    console.error('❌ BRAVE_API_KEY 未配置');
    return [];
  }

  try {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}&freshness=pd&search_lang=zh`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Brave API error: ${response.status}`);
    }

    const data = await response.json();
    return data.web?.results || [];
  } catch (error) {
    console.error('搜索失败:', error);
    return [];
  }
}

// AI 深度分析
async function analyzeWithAI(title, content) {
  if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY 未配置');
    return null;
  }

  const prompt = `作为智能驾驶行业分析师，请对以下情报进行深度分析：

标题：${title}
内容：${content}

请返回 JSON 格式分析结果：
{
  "summary": "一句话核心摘要（20字以内）",
  "key_insights": ["关键洞察1", "关键洞察2"],
  "sentiment": "positive|neutral|negative",
  "importance": "high|medium|low",
  "related_tech": ["相关技术1", "相关技术2"],
  "impact": "影响评估（30字以内）",
  "companies": ["涉及公司1", "涉及公司2"]
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
          { role: 'system', content: '你是智能驾驶行业资深分析师，擅长技术分析和产业洞察。只返回JSON格式。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const data = await response.json();
    const content_text = data.choices?.[0]?.message?.content;

    if (!content_text) return null;

    // 提取 JSON
    const jsonMatch = content_text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('AI 分析失败:', error);
    return null;
  }
}

// 采集传感器情报
async function crawlSensors() {
  console.log('\n🔍 开始采集传感器情报...\n');

  const results = [];

  // 采集激光雷达情报
  for (const keyword of KEYWORDS.sensor.lidar.slice(0, 5)) {
    console.log(`搜索: ${keyword}`);
    const news = await searchNews(`${keyword} 发布 新品`, 3);

    for (const item of news) {
      console.log(`  找到: ${item.title}`);

      // AI 分析
      const analysis = await analyzeWithAI(item.title, item.description || item.snippet);

      results.push({
        title: item.title,
        snippet: item.description || item.snippet,
        source: extractSource(item.url),
        source_url: item.url,
        category: 'sensors',
        ...analysis
      });

      // 避免限流
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return results;
}

// 采集智驾情报
async function crawlAD() {
  console.log('\n🚗 开始采集智驾情报...\n');

  const results = [];

  for (const [brand, keywords] of Object.entries(KEYWORDS.ad)) {
    for (const keyword of keywords.slice(0, 2)) {
      console.log(`搜索: ${keyword}`);
      const news = await searchNews(`${keyword} 智驾 更新`, 2);

      for (const item of news) {
        console.log(`  找到: ${item.title}`);

        const analysis = await analyzeWithAI(item.title, item.description || item.snippet);

        results.push({
          title: item.title,
          snippet: item.description || item.snippet,
          source: extractSource(item.url),
          source_url: item.url,
          category: 'autonomous-driving',
          ...analysis
        });

        await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  return results;
}

// 提取来源
function extractSource(url) {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    const sourceMap = {
      '36kr.com': '36氪',
      'autohome.com.cn': '汽车之家',
      'xueqiu.com': '雪球',
      'caixin.com': '财新',
      'yicai.com': '第一财经',
      'jiemian.com': '界面',
      'thepaper.cn': '澎湃'
    };
    return sourceMap[domain] || domain;
  } catch {
    return '未知来源';
  }
}

// 生成趋势报告
async function generateTrendReport(allResults) {
  if (allResults.length === 0) return '暂无数据';

  const newsText = allResults.slice(0, 10).map((n, i) =>
    `${i + 1}. ${n.title}${n.summary ? ` - ${n.summary}` : ''}`
  ).join('\n');

  const prompt = `基于以下情报，生成本周智能驾驶行业趋势简报（300字以内）：

${newsText}

要求：
1. 分点列出主要趋势
2. 重点关注华为、激光雷达、城市NOA等热点
3. 给出下周关注建议`;

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
          { role: 'system', content: '你是智能驾驶行业研究专家，擅长趋势分析。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 600
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '生成失败';
  } catch (error) {
    console.error('生成报告失败:', error);
    return '生成失败';
  }
}

// 主函数
async function main() {
  console.log('🚀 增强版情报采集启动');
  console.log('========================\n');
  console.log(`使用模型: ${GEMINI_MODEL}`);
  console.log(`时间: ${new Date().toLocaleString('zh-CN')}\n`);

  // 采集各类型情报
  const sensorResults = await crawlSensors();
  const adResults = await crawlAD();

  const allResults = [...sensorResults, ...adResults];

  console.log('\n📊 采集统计:');
  console.log(`  传感器情报: ${sensorResults.length} 条`);
  console.log(`  智驾情报: ${adResults.length} 条`);
  console.log(`  总计: ${allResults.length} 条`);

  // 生成趋势报告
  console.log('\n📝 生成趋势报告...\n');
  const report = await generateTrendReport(allResults);
  console.log(report);

  // 输出结果摘要
  console.log('\n📋 情报摘要:');
  allResults.slice(0, 5).forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   摘要: ${item.summary || '无'}`);
    console.log(`   重要度: ${item.importance || '中'}`);
    console.log(`   情感: ${item.sentiment || '中性'}`);
  });

  console.log('\n✅ 采集完成');
}

main().catch(console.error);
