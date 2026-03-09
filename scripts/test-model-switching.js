// 测试 Kimi 和 Gemini 模型切换
const fetch = require('node-fetch');
require('dotenv').config();

const BASE_URL = 'https://new.lemonapi.site/v1';
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const KIMI_URL = 'https://api.moonshot.cn/v1';
const KIMI_KEY = process.env.KIMI_API_KEY;

async function testModel(provider, model, apiUrl, apiKey) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`🤖 测试: ${provider} (${model})`);
  console.log('='.repeat(50));

  const startTime = Date.now();

  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: '你是一个助手，请简短回答。' },
          { role: 'user', content: `你是谁？请说明你的模型名称。` }
        ],
        temperature: provider === 'Kimi' ? 1 : 0.7,
        max_tokens: 100
      })
    });

    const latency = Date.now() - startTime;
    const data = await response.json();

    if (response.ok) {
      console.log('✅ 成功');
      console.log(`⏱️  延迟: ${latency}ms`);
      console.log(`📝 回复: ${data.choices?.[0]?.message?.content}`);
      console.log(`📊 Tokens: ${data.usage?.total_tokens || 'N/A'}`);
      return true;
    } else {
      console.log('❌ 失败');
      console.log(`错误: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log('❌ 出错:', error.message);
    return false;
  }
}

async function testSwitching() {
  console.log('🧪 测试模型切换功能');
  console.log('当前配置:');
  console.log(`  默认模型: ${process.env.DEFAULT_AI_MODEL}`);
  console.log(`  Kimi: ${process.env.KIMI_MODEL}`);
  console.log(`  Gemini: ${process.env.GEMINI_MODEL}`);

  const results = {
    kimi: false,
    gemini: false
  };

  // 测试 1: Gemini
  if (GEMINI_KEY) {
    results.gemini = await testModel('Gemini', '[L]gemini-2.5-pro', BASE_URL, GEMINI_KEY);
  } else {
    console.log('\n⚠️ Gemini API Key 未配置');
  }

  // 测试 2: Kimi
  if (KIMI_KEY) {
    results.kimi = await testModel('Kimi', 'kimi-k2.5', KIMI_URL, KIMI_KEY);
  } else {
    console.log('\n⚠️ Kimi API Key 未配置');
  }

  // 模拟快速切换场景
  console.log('\n' + '='.repeat(50));
  console.log('🔄 模拟快速切换场景');
  console.log('='.repeat(50));

  const questions = [
    { q: '1+1等于几？', model: 'kimi-k2.5', provider: 'Kimi' },
    { q: '2+2等于几？', model: '[L]gemini-2.5-pro', provider: 'Gemini' },
    { q: '3+3等于几？', model: 'kimi-k2.5', provider: 'Kimi' },
    { q: '4+4等于几？', model: '[L]gemini-2.5-pro', provider: 'Gemini' }
  ];

  for (const item of questions) {
    const apiUrl = item.provider === 'Kimi' ? KIMI_URL : BASE_URL;
    const apiKey = item.provider === 'Kimi' ? KIMI_KEY : GEMINI_KEY;

    try {
      const res = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: item.model,
          messages: [{ role: 'user', content: item.q }],
          temperature: item.provider === 'Kimi' ? 1 : 0.7,
          max_tokens: 50
        })
      });

      const data = await res.json();
      const answer = data.choices?.[0]?.message?.content?.trim() || '无回复';
      console.log(`[${item.provider}] Q: ${item.q} A: ${answer}`);

      // 添加小延迟避免限流
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`[${item.provider}] Q: ${item.q} 错误: ${e.message}`);
    }
  }

  // 总结
  console.log('\n' + '='.repeat(50));
  console.log('📊 测试结果总结');
  console.log('='.repeat(50));
  console.log(`Gemini: ${results.gemini ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`Kimi:   ${results.kimi ? '✅ 可用' : '❌ 不可用'}`);
  console.log(`切换:   ${results.gemini && results.kimi ? '✅ 支持' : '⚠️ 部分支持'}`);

  if (results.gemini && results.kimi) {
    console.log('\n✅ 两个模型都可以正常使用，切换功能正常！');
  }
}

testSwitching().catch(console.error);
