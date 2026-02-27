#!/bin/bash

# 智能驾驶情报平台 - 爬虫脚本
# 采集真实的行业新闻

echo "🎋 开始采集智能驾驶行业新闻..."

# 触发行业新闻采集
curl -X POST http://localhost:3000/api/crawl/industry \
  -H "Content-Type: application/json" \
  -d '{
    "maxResults": 5,
    "debug": true
  }' 2>/dev/null | jq '.'

echo ""
echo "✅ 采集完成"
echo ""
echo "📊 查看数据："
echo "  - 前端页面：http://localhost:3000"
echo "  - API接口：http://localhost:3000/api/industry-news"
