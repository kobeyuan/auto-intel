// Node.js 16 兼容的 AI 测试脚本
const fetch = require('node-fetch');
require('dotenv').config();

const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://new.lemonapi.site/v1';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGemini() {
  console.log('🧪 测试 Gemini API');
  console.log('==================\n');
  console.log('URL:', GEMINI_API_URL);
  console.log('Key:', GEMINI_API_KEY ? `${GEMINI_API_KEY.slice(0, 8)}...${GEMINI_API_KEY.slice(-4)}` : '未设置');
  console.log();

  if (!GEMINI_API_KEY) {
    console.log('❌ GEMINI_API_KEY 未配置');
    return;
  }

  console.log('🤖 发送请求...\n');

  try {
    const response = await fetch(`${GEMINI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: '[L]gemini-2.5-pro',
        messages: [
          { role: 'user', content: '你好，请回复"Gemini API 测试成功"' }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 请求成功!');
      console.log('模型:', data.model);
      console.log('回复:', data.choices?.[0]?.message?.content);
      console.log('Token 使用:', data.usage);
    } else {
      console.log('❌ 请求失败:', response.status);
      console.log('错误:', data);
    }
  } catch (error) {
    console.log('❌ 请求出错:', error.message);
  }
}

async function testKimi() {
  console.log('\n\n🧪 测试 Kimi API');
  console.log('==================\n');

  const KIMI_API_URL = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1';
  const KIMI_API_KEY = process.env.KIMI_API_KEY;

  console.log('URL:', KIMI_API_URL);
  console.log('Key:', KIMI_API_KEY ? `${KIMI_API_KEY.slice(0, 8)}...${KIMI_API_KEY.slice(-4)}` : '未设置');
  console.log();

  if (!KIMI_API_KEY) {
    console.log('⚠️ KIMI_API_KEY 未配置，跳过测试');
    return;
  }

  console.log('🤖 发送请求...\n');

  try {
    const response = await fetch(`${KIMI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
        messages: [
          { role: 'user', content: '你好，请回复"Kimi API 测试成功"' }
        ],
        temperature: 1  // kimi-k2.5 只支持 temperature=1
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ 请求成功!');
      console.log('模型:', data.model);
      console.log('回复:', data.choices?.[0]?.message?.content);
      console.log('Token 使用:', data.usage);
    } else {
      console.log('❌ 请求失败:', response.status);
      console.log('错误:', data);
    }
  } catch (error) {
    console.log('❌ 请求出错:', error.message);
  }
}

async function main() {
  await testGemini();
  await testKimi();
  console.log('\n\n✅ 所有测试完成!');
}

main().catch(console.error);
