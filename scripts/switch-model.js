#!/usr/bin/env node
// AI 模型切换工具
// 用法: node scripts/switch-model.js [kimi|gemini|status]

const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

function readEnv() {
  if (!fs.existsSync(ENV_PATH)) {
    console.log('❌ .env 文件不存在');
    process.exit(1);
  }
  return fs.readFileSync(ENV_PATH, 'utf8');
}

function writeEnv(content) {
  fs.writeFileSync(ENV_PATH, content);
}

function switchModel(model) {
  const envContent = readEnv();

  const newContent = envContent.replace(
    /DEFAULT_AI_MODEL=.*/,
    `DEFAULT_AI_MODEL=${model}`
  );

  writeEnv(newContent);
  console.log(`✅ 默认 AI 模型已切换为: ${model}`);
  console.log(`📝 修改已保存到 .env 文件`);
  console.log(`⚠️  重启 dev 服务器后生效 (如果正在运行)`);
}

function showStatus() {
  const envContent = readEnv();

  const defaultModel = envContent.match(/DEFAULT_AI_MODEL=(.+)/)?.[1] || '未设置';
  const kimiKey = envContent.match(/KIMI_API_KEY=(.+)/)?.[1];
  const geminiKey = envContent.match(/GEMINI_API_KEY=(.+)/)?.[1];
  const kimiModel = envContent.match(/KIMI_MODEL=(.+)/)?.[1] || '未设置';
  const geminiModel = envContent.match(/GEMINI_MODEL=(.+)/)?.[1] || '未设置';

  console.log('\n📊 AI 模型状态\n');
  console.log('默认模型:', defaultModel);
  console.log('');
  console.log('Kimi:');
  console.log('  模型:', kimiModel);
  console.log('  API Key:', kimiKey ? `✅ 已配置 (${kimiKey.slice(0, 8)}...${kimiKey.slice(-4)})` : '❌ 未配置');
  console.log('');
  console.log('Gemini:');
  console.log('  模型:', geminiModel);
  console.log('  API Key:', geminiKey ? `✅ 已配置 (${geminiKey.slice(0, 8)}...${geminiKey.slice(-4)})` : '❌ 未配置');
  console.log('');
}

function showHelp() {
  console.log(`
🤖 AI 模型切换工具

用法:
  npm run ai:kimi      切换到 Kimi 模型
  npm run ai:gemini    切换到 Gemini 模型
  npm run ai:status    查看当前配置状态
  npm run ai:test      测试模型连接

或直接运行:
  node scripts/switch-model.js [kimi|gemini|status]
`);
}

const command = process.argv[2];

switch (command) {
  case 'kimi':
    switchModel('kimi');
    break;
  case 'gemini':
    switchModel('gemini');
    break;
  case 'status':
    showStatus();
    break;
  case '--help':
  case '-h':
  default:
    showHelp();
    break;
}
