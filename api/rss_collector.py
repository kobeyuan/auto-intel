#!/usr/bin/env python3
"""
RSS 订阅采集器 (升级版)
集成质量评估系统，支持多维情报属性
"""

import os
import json
import feedparser
import requests
import hashlib
import re
from datetime import datetime
from typing import List, Dict, Any
from supabase import create_client, Client
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 数据源配置文件
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config', 'data_sources.json')

def load_data_sources() -> Dict:
    """加载数据源配置"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"加载数据源配置失败: {e}")
        return {"sources": {}}

def get_enabled_rss_sources() -> List[Dict]:
    """获取所有启用的 RSS 源"""
    config = load_data_sources()
    sources = []

    for cat_key, cat_data in config.get("sources", {}).items():
        for source in cat_data.get("sources", []):
            if source.get("enabled") and source.get("rss", {}).get("enabled"):
                sources.append({
                    "id": source["id"],
                    "name": source["name"],
                    "url": source["rss"]["url"],
                    "category": source.get("category", "other"),
                    "tier": source.get("tier", 3),
                    "credibility_score": source.get("credibility_score", 60),
                    "focus_areas": source.get("focus_areas", []),
                    "manual_review": source.get("manual_review", False)
                })

    return sources

def assess_sentiment(text: str) -> float:
    """简单情感分析分数 0-1 (0.5 为中性)"""
    pos_keywords = ['突破', '首发', '领先', '合作', '增长', '创新', '优秀', '量产']
    neg_keywords = ['事故', '故障', '召回', '亏损', '下滑', '失败', '调查', '裁员']

    text = text.lower()
    pos_count = sum(1 for k in pos_keywords if k in text)
    neg_count = sum(1 for k in neg_keywords if k in text)

    if pos_count == 0 and neg_count == 0: return 0.5
    total = pos_count + neg_count
    return round(pos_count / total, 2)

def collect_from_rss(source: Dict) -> List[Dict]:
    """从单个 RSS 源采集情报"""
    items = []
    try:
        print(f"  📡 采集: {source['name']}")
        # 使用 headers 模拟浏览器，防止被屏蔽
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(source['url'], headers=headers, timeout=15)
        feed = feedparser.parse(response.content)

        for entry in feed.entries[:15]:
            published = None
            if hasattr(entry, 'published_parsed'):
                published = datetime(*entry.published_parsed[:6]).isoformat()
            elif hasattr(entry, 'updated_parsed'):
                published = datetime(*entry.updated_parsed[:6]).isoformat()
            else:
                published = datetime.now().isoformat()

            content = entry.get('summary', entry.get('description', ''))
            content = re.sub('<[^<]+?>', '', content)[:500]

            item = {
                "title": entry.get('title', ''),
                "link": entry.get('link', ''),
                "snippet": content,
                "source": source['name'],
                "category": source['category'],
                "sentiment_score": assess_sentiment(entry.get('title', '') + content),
                "credibility_tier": f"tier{source['tier']}",
                "quality_score": source['credibility_score'],
                "published_at": published,
                "collected_at": datetime.now().isoformat(),
                "keywords": source['focus_areas'],
                "verified": source['tier'] == 1
            }
            items.append(item)
    except Exception as e:
        print(f"    ❌ {source['name']} 采集失败: {e}")
    return items

def run_rss_collection():
    """执行采集任务"""
    print(f"\n🚀 开始 RSS 情报采集任务 - {datetime.now().isoformat()}")
    sources = get_enabled_rss_sources()
    print(f"📋 发现 {len(sources)} 个已启用的 RSS 源")

    all_items = []
    for source in sources:
        items = collect_from_rss(source)
        all_items.extend(items)

    if not all_items:
        print("📭 未采集到新数据")
        return {"processed": 0, "total": 0}

    print(f"💾 正在将 {len(all_items)} 条情报写入数据库 (industry_intelligence)...")

    try:
        db_data = []
        for item in all_items:
            db_data.append({
                "title": item["title"],
                "link": item["link"],
                "snippet": item["snippet"],
                "source": item["source"],
                "category": item["category"],
                "sentiment_score": item["sentiment_score"],
                "credibility_tier": item["credibility_tier"],
                "quality_score": item["quality_score"],
                "verified": item["verified"],
                "published_at": item["published_at"],
                "created_at": item["collected_at"],
                "keywords": item["keywords"]
            })

        # 批量写入
        result = supabase.table("industry_intelligence").upsert(
            db_data,
            on_conflict="link"
        ).execute()

        count = len(result.data) if result.data else 0
        print(f"✅ 成功处理 {count} 条情报")
        return {"processed": count, "total": len(all_items)}

    except Exception as e:
        print(f"❌ 数据库写入失败: {e}")
        return {"error": str(e)}

if __name__ == "__main__":
    run_rss_collection()
