#!/usr/bin/env node
// 安全预提交检查 - 防止敏感信息泄露

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const SENSITIVE_PATTERNS = [
  // API Keys
  { pattern: /sk-[a-zA-Z0-9]{20,}/g, name: 'API Key (sk-...)' },
  { pattern: /sk-[a-zA-Z0-9]{8}-[a-zA-Z0-9]{20,}/g, name: 'Moonshot API Key' },
  // Supabase keys
  { pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, name: 'JWT Token' },
  // Generic secrets
  { pattern: /api[_-]?key\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/gi, name: 'API_KEY' },
  { pattern: /secret\s*[:=]\s*['"][a-zA-Z0-9]{16,}['"]/gi, name: 'SECRET' },
  { pattern: /password\s*[:=]\s*['"][^'"]{8,}['"]/gi, name: 'PASSWORD' },
  // Private keys
  { pattern: /-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g, name: 'Private Key' },
  // URLs with credentials
  { pattern: /https?:\/\/[^:]+:[^@]+@[^\s]+/g, name: 'URL with credentials' },
];

const FILES_TO_CHECK = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'src/**/*.js',
  'scripts/**/*.js',
  'lib/**/*.ts',
  'components/**/*.tsx',
  'app/**/*.ts',
  'app/**/*.tsx',
];

const EXCLUDED_FILES = [
  '.env',
  '.env.local',
  '.env.*.local',
  'node_modules',
  '.git',
  'venv',
  '**/*.test.ts',
  '**/*.test.js',
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];

  for (const { pattern, name } of SENSITIVE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      // 检查是否是示例/占位符
      const isPlaceholder = matches.every(m =>
        m.includes('example') ||
        m.includes('placeholder') ||
        m.includes('your-') ||
        m.includes('xxx') ||
        m.includes('***')
      );

      if (!isPlaceholder) {
        issues.push({
          type: name,
          matches: matches.slice(0, 3), // 最多显示3个
          count: matches.length
        });
      }
    }
  }

  return issues;
}

function getFilesToScan() {
  try {
    // 获取 git 暂存区的文件
    const output = execSync('git diff --cached --name-only --diff-filter=ACM', {
      encoding: 'utf8',
      cwd: process.cwd()
    });
    return output.trim().split('\n').filter(f => f && !f.includes('node_modules'));
  } catch (e) {
    // 如果不是 git 仓库或出错，扫描 src 目录
    return [];
  }
}

function main() {
  console.log('🔒 运行安全预提交检查...\n');

  const filesToCheck = getFilesToScan();

  if (filesToCheck.length === 0) {
    console.log(YELLOW + '⚠️  没有检测到暂存文件，跳过检查' + RESET);
    process.exit(0);
  }

  let totalIssues = 0;
  const filesWithIssues = [];

  for (const file of filesToCheck) {
    const fullPath = path.join(process.cwd(), file);

    // 跳过不存在的文件和二进制文件
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
      continue;
    }

    // 跳过特定文件类型
    if (/\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot|mp4|webm)$/i.test(file)) {
      continue;
    }

    try {
      const issues = scanFile(fullPath);
      if (issues.length > 0) {
        totalIssues += issues.length;
        filesWithIssues.push({ file, issues });
      }
    } catch (e) {
      // 无法读取的文件（可能是二进制）跳过
    }
  }

  if (totalIssues > 0) {
    console.log(RED + `❌ 发现 ${totalIssues} 个潜在安全问题:\n` + RESET);

    for (const { file, issues } of filesWithIssues) {
      console.log(RED + `📄 ${file}` + RESET);
      for (const issue of issues) {
        console.log(`   - ${issue.type}: ${issue.count} 个匹配`);
        if (issue.matches.length > 0) {
          console.log(`     示例: ${issue.matches[0].substring(0, 50)}...`);
        }
      }
      console.log('');
    }

    console.log(RED + '⛔ 提交被阻止！请在修复后重试。' + RESET);
    console.log('\n解决方案:');
    console.log('1. 将敏感信息移至 .env 文件（确保 .env 在 .gitignore 中）');
    console.log('2. 使用环境变量而非硬编码');
    console.log('3. 如果这是误报，使用 git commit --no-verify 跳过检查');
    process.exit(1);
  }

  console.log(GREEN + '✅ 安全检查通过，未发现敏感信息泄露' + RESET);
  process.exit(0);
}

main();
