#!/usr/bin/env python3
"""
RSS 订阅采集器
管理所有 RSS 数据源的情报采集
支持人工审核和来源管理
"""

import os
import json
import feedparser
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from supabase import create_client, Client
from urllib.parse import urlparse
import hashlib

# 加载环境变量
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 加载数据源配置
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '..', 'config', 'data_sources.json')

def load_data_sources() -> Dict:
    """加载数据源配置"""
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"加载数据源配置失败: {e}")
        return {"sources": {}}

def save_data_sources(config: Dict):
    """保存数据源配置"""
    try:
        with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"保存数据源配置失败: {e}")

def get_enabled_rss_sources() -> List[Dict]:
    """获取所有启用的 RSS 源"""
    config = load_data_sources()
    sources = []

    for category, data in config.get("sources", {}).items():
        for source in data.get("sources", []):
            if source.get("enabled") and source.get("rss", {}).get("enabled"):
                sources.append({
                    "id": source["id"],
                    "name": source["name"],
                    "url": source["rss"]["url"],
                    "category": source.get("category", "general"),
                    "tier": source.get("tier", 3),
                    "focus_areas": source.get("focus_areas", []),
                    "manual_review": source.get("manual_review", False)
                })

    return sources

def collect_from_rss(source: Dict) -> List[Dict]:
    """从单个 RSS 源采集情报"""
    items = []

    try:
        print(f"  📡 采集: {source['name']} ({source['url']})")

        # 解析 RSS
        feed = feedparser.parse(source['url'])

        if feed.bozo:
            print(f"    ⚠️ RSS 解析警告: {feed.bozo_exception}")

        for entry in feed.entries[:10]:  # 每个源取最新10条
            # 提取发布时间
            published = None
            if hasattr(entry, 'published'):
                published = entry.published
            elif hasattr(entry, 'updated'):
                published = entry.updated

            # 生成唯一 ID
            unique_str = f"{source['id']}-{entry.get('title', '')}-{entry.get('link', '')}"
            item_id = hashlib.md5(unique_str.encode()).hexdigest()

            item = {
                "id": item_id,
                "title": entry.get('title', ''),
                "link": entry.get('link', ''),
                "snippet": entry.get('summary', entry.get('description', ''))[:500],
                "source": source['name'],
                "source_id": source['id'],
                "source_tier": source['tier'],
                "category": source['category'],
                "focus_areas": source['focus_areas'],
                "published_at": published,
                "collected_at": datetime.now().isoformat(),
                "manual_review_required": source.get('manual_review', False),
                "status": "pending_review" if source.get('manual_review') else "approved",
                "credibility_score": 80 if source['tier'] == 2 else 95
            }

            items.append(item)

        print(f"    ✅ 采集 {len(items)} 条")

    except Exception as e:
        print(f"    ❌ 采集失败: {str(e)}")

    return items

def check_duplicate(title: str, link: str) -> bool:
    """检查是否已存在"""
    try:
        # 检查标题相似度
        response = supabase.table("industry_intelligence")\
            .select("title, link")\
            .ilike("title", f"%{title[:30]}%")\
            .execute()

        if response.data:
            return True

        # 检查链接
        response = supabase.table("industry_intelligence")\
            .select("link")\
            .eq("link", link)\
            .execute()

        return len(response.data) > 0

    except Exception as e:
        print(f"查重失败: {e}")
        return False

def store_intelligence(items: List[Dict]) -> Dict[str, int]:
    """存储情报到数据库"""
    stats = {"new": 0, "duplicate": 0, "error": 0}

    for item in items:
        try:
            # 查重
            if check_duplicate(item['title'], item['link']):
                stats["duplicate"] += 1
                continue

            # 准备数据
            data = {
                "title": item['title'],
                "link": item['link'],
                "snippet": item['snippet'],
                "source": item['source'],
                "category": item['category'],
                "frontier_score": 50,  # 默认分数
                "frontier_level": "常规",
                "source_tier": f"tier{item['source_tier']}",
                "credibility_score": item['credibility_score'],
                "published_at": item['published_at'],
                "collected_at": item['collected_at'],
                "status": item['status'],
                "ai_analyzed": False
            }

            # 入库
            supabase.table("industry_intelligence").insert(data).execute()
            stats["new"] += 1

        except Exception as e:
            print(f"存储失败: {e}")
            stats["error"] += 1

    return stats

def run_rss_collection():
    """运行 RSS 采集"""
    print("=" * 70)
    print(f"🚀 RSS 情报采集 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # 获取启用的 RSS 源
    sources = get_enabled_rss_sources()
    print(f"\n📋 启用 RSS 源: {len(sources)} 个\n")

    all_items = []
    source_stats = {}

    # 采集每个源
    for source in sources:
        items = collect_from_rss(source)
        all_items.extend(items)
        source_stats[source['name']] = len(items)

    # 存储情报
    print(f"\n💾 存储情报...")
    stats = store_intelligence(all_items)

    print(f"\n" + "=" * 70)
    print("📊 采集统计")
    print("=" * 70)
    print(f"  总采集: {len(all_items)}")
    print(f"  新情报: {stats['new']}")
    print(f"  重复: {stats['duplicate']}")
    print(f"  错误: {stats['error']}")

    return {
        "total_collected": len(all_items),
        "new_items": stats['new'],
        "duplicates": stats['duplicate'],
        "errors": stats['error'],
        "source_stats": source_stats
    }

# API Handler for Vercel
class handler:
    def __init__(self):
        pass

    def do_GET(self):
        """HTTP GET Handler"""
        try:
            result = run_rss_collection()
            return {
                "statusCode": 200,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({
                    "status": "success",
                    "data": result,
                    "timestamp": datetime.now().isoformat()
                }, ensure_ascii=False)
            }
        except Exception as e:
            return {
                "statusCode": 500,
                "headers": {"Content-Type": "application/json"},
                "body": json.dumps({
                    "status": "error",
                    "message": str(e)
                }, ensure_ascii=False)
            }

if __name__ == '__main__':
    run_rss_collection()
