#!/bin/bash

echo "🎋 使用 Token 推送到 GitHub"
echo ""
echo "⚠️ 注意：输入密码时，粘贴你的 GitHub Token（不是 GitHub 密码）"
echo ""
echo "Token 格式：ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
echo ""

# 删除旧的远程
git remote remove origin 2>/dev/null

# 添加新的远程
git remote add origin https://kobeyuan@github.com/kobeyuan/auto-intel.git

# 推送
git push -u origin main
