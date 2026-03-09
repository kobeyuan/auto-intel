// 通过 AI 客户端测试模型切换
require('dotenv').config();
const fetch = require('node-fetch');

// 模拟 AI 客户端功能
async function chatWithAI(messages, provider = 'kimi') {
  const configs = {
    kimi: {
      url: process.env.KIMI_API_URL,
      key: process.env.KIMI_API_KEY,
      model: process.env.KIMI_MODEL,
      temperature: 1
    },
    gemini: {
      url: process.env.GEMINI_API_URL,
      key: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL,
      temperature: 0.7
    }
  };

  const config = configs[provider];
  if (!config || !config.key) {
    throw new Error(`${provider} 未配置`);
  }

  const res = await fetch(`${config.url}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature: config.temperature,
      max_tokens: 100
    })
  });

  const data = await res.json();
  return {
    content: data.choices?.[0]?.message?.content,
    model: data.model,
    provider
  };
}

async function askAI(prompt, provider) {
  const res = await chatWithAI([{ role: 'user', content: prompt }], provider);
  return res.content;
}

async function test() {
  console.log('🧪 测试 AI 客户端模型切换\n');

  // 测试 1: 使用默认模型 (kimi)
  console.log('1️⃣  使用默认模型 (kimi):');
  const reply1 = await askAI('你好，请说"我是Kimi"', 'kimi');
  console.log(`   回复: ${reply1?.slice(0, 50)}...\n`);

  // 测试 2: 切换到 Gemini
  console.log('2️⃣  切换到 Gemini:');
  const reply2 = await askAI('你好，请说"我是Gemini"', 'gemini');
  console.log(`   回复: ${reply2?.slice(0, 50)}...\n`);

  // 测试 3: 再切回 Kimi
  console.log('3️⃣  切回 Kimi:');
  const reply3 = await askAI('你好，请说"我又变回Kimi了"', 'kimi');
  console.log(`   回复: ${reply3?.slice(0, 50)}...\n`);

  // 测试 4: 对比两个模型的回答
  console.log('4️⃣  对比回答（同一问题）:\n');
  const question = '用一句话介绍自己';

  console.log('   问 Kimi:');
  const kimiAnswer = await askAI(question, 'kimi');
  console.log(`   ${kimiAnswer?.slice(0, 100)}...`);

  console.log('\n   问 Gemini:');
  const geminiAnswer = await askAI(question, 'gemini');
  console.log(`   ${geminiAnswer?.slice(0, 100)}...`);

  console.log('\n✅ 模型切换测试完成！');
}

test().catch(e => console.error('❌ 错误:', e.message));
