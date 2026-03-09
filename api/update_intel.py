# api/update_intel.py
# 重构版：多维查询矩阵 + 前沿深度评分 + 实时新鲜度

import os
import requests
from dotenv import load_dotenv
from supabase import create_client, Client
from http.server import BaseHTTPRequestHandler
from datetime import datetime
from typing import List, Dict, Any

# 强制加载项目根目录下的 .env 文件
load_dotenv()

# 配置环境变量
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ==========================================
# 1. 搜索词矩阵定义
# ==========================================

# 竞争对手维度
COMPETITORS = {
    "Tesla": ["Tesla FSD", "Tesla 自动驾驶", "Tesla 智驾方案", "Tesla 视觉方案"],
    "Huawei": ["华为 ADS", "华为智驾", "鸿蒙智行", "华为激光雷达", "华为乾崑"],
    "BYD": ["比亚迪 天神之眼", "BYD 智驾", "比亚迪 自动驾驶", "比亚迪 智能化"],
    "NIO": ["蔚来 NAD", "NIO 智驾", "蔚来 自动驾驶"],
    "XPeng": ["小鹏 XNGP", "小鹏 自动驾驶", "小鹏 智驾方案"],
    "Li Auto": ["理想 AD Max", "理想 智驾", "理想 自动驾驶"],
    "Xiaomi": ["小米 智驾", "小米汽车 自动驾驶", "小米 SU7 智驾"],
    "Waymo": ["Waymo", "Waymo 无人驾驶", "Waymo 商业化"],
}

# 核心技术维度
CORE_TECH = {
    "End-to-End": ["端到端", "End-to-End", "E2E 自动驾驶", "端到端大模型"],
    "VLA": ["VLA 模型", "视觉语言动作模型", "Vision Language Action"],
    "Chiplet": ["芯粒", "Chiplet", "先进封装", "汽车芯片封装"],
    "Solid-state": ["固态激光雷达", "固态雷达", "Solid-state LiDAR"],
    "Transformer": ["BEV Transformer", "Transformer 自动驾驶", "BEV 架构"],
    "Foundation Model": ["基础模型", "大模型 自动驾驶", "Foundation Model"],
}

# 准入法规维度
REGULATIONS = {
    "L3/L4 Pilot": ["L3 自动驾驶试点", "L4 自动驾驶", "自动驾驶准入", "智能网联汽车试点"],
    "UN R157": ["UN R157", "ALKS 车道保持", "自动车道保持系统"],
    "Data Security": ["汽车数据安全", "自动驾驶数据安全", "智能网联汽车数据"],
    "Commercial License": ["自动驾驶商业化", "无人车运营牌照", "Robotaxi 牌照"],
}

# 战略前瞻关键词 (用于前沿程度评分)
STRATEGIC_KEYWORDS = [
    "2027", "2028", "2029", "2030",
    "Vision", "Roadmap", "Next-gen", "Next generation",
    "前瞻", "战略", "规划", "路线图",
    "突破", "颠覆", "革命性", "下一代",
    "量产", "首发", "率先", "领先",
    "L5", "完全自动驾驶",
]


# ==========================================
# 2. 查询矩阵生成器
# ==========================================

def generate_search_matrix() -> List[Dict[str, Any]]:
    """
    生成多维查询矩阵
    返回: [{"query": "搜索词", "category": "分类", "dimension": "维度"}]
    """
    queries = []

    # 核心类别定义
    categories = {
        "smart-cockpit": ["智能座舱", "智能座舱 2026", "座舱芯片", "座舱操作系统"],
        "autonomous-driving": ["智能驾驶", "自动驾驶", "智驾方案", "ADAS"],
        "sensors": ["激光雷达", "毫米波雷达", "视觉传感器", "车载芯片"],
        "ota": ["OTA升级", "固件更新", "汽车软件更新"],
        "sentiment": ["智驾评价", "自动驾驶吐槽", "智能驾驶体验"],
    }

    # 基础查询
    for category, base_terms in categories.items():
        for term in base_terms:
            queries.append({
                "query": f"2026 {term} 行业趋势",
                "category": category,
                "dimension": "基础趋势"
            })

    # 竞争对手 x 核心技术 交叉查询 (高价值)
    for comp_name, comp_terms in COMPETITORS.items():
        for tech_name, tech_terms in CORE_TECH.items():
            for comp_term in comp_terms[:2]:  # 每个竞争对手取2个关键词
                for tech_term in tech_terms[:2]:  # 每个技术取2个关键词
                    category = "autonomous-driving" if "驾驶" in tech_term or "智驾" in tech_term else "sensors"
                    queries.append({
                        "query": f"{comp_term} {tech_term} 2026",
                        "category": category,
                        "dimension": f"竞争技术-{comp_name}"
                    })

    # 竞争对手 x 法规 交叉查询 (政策风险)
    for comp_name, comp_terms in COMPETITORS.items():
        for reg_name, reg_terms in REGULATIONS.items():
            for comp_term in comp_terms[:1]:
                for reg_term in reg_terms[:2]:
                    queries.append({
                        "query": f"{comp_term} {reg_term}",
                        "category": "autonomous-driving",
                        "dimension": f"法规合规-{comp_name}"
                    })

    # 核心技术 x 法规 交叉查询 (技术准入)
    for tech_name, tech_terms in CORE_TECH.items():
        for reg_name, reg_terms in REGULATIONS.items():
            for tech_term in tech_terms[:1]:
                for reg_term in reg_terms[:2]:
                    queries.append({
                        "query": f"{tech_term} {reg_term}",
                        "category": "autonomous-driving",
                        "dimension": f"技术准入-{tech_name}"
                    })

    # 高战略价值专项查询
    strategic_queries = [
        "2027 自动驾驶路线图",
        "2027 智能驾驶 Roadmap",
        "Next-gen 智驾方案 2027",
        "下一代 自动驾驶 2027",
        "L4 商业化 2027",
        "端到端 量产 2027",
    ]
    for query in strategic_queries:
        queries.append({
            "query": query,
            "category": "autonomous-driving",
            "dimension": "战略前瞻"
        })

    return queries


# ==========================================
# 3. 前沿程度评分系统
# ==========================================

def calculate_frontier_score(title: str, snippet: str, query_dimension: str) -> Dict[str, Any]:
    """
    计算情报的前沿程度和战略价值
    """
    text = f"{title} {snippet}".lower()
    score = 0
    matched_keywords = []

    # 战略前瞻关键词匹配 (每个+20分)
    for keyword in STRATEGIC_KEYWORDS:
        if keyword.lower() in text:
            score += 20
            matched_keywords.append(keyword)

    # 竞争对手提及 (每个+10分)
    for comp in COMPETITORS.keys():
        if comp.lower() in text or comp.lower().replace(" ", "") in text:
            score += 10
            matched_keywords.append(comp)

    # 核心技术提及 (每个+15分)
    for tech in ["end-to-end", "vla", "chiplet", "solid-state", "transformer"]:
        if tech in text:
            score += 15
            matched_keywords.append(tech)

    # 法规相关 (每个+10分)
    for reg in ["l3", "l4", "un r157", "商业化", "牌照"]:
        if reg in text:
            score += 10
            matched_keywords.append(reg)

    # 维度加分
    if "战略前瞻" in query_dimension:
        score += 15
    elif "竞争技术" in query_dimension:
        score += 10
    elif "技术准入" in query_dimension:
        score += 10

    # 确定等级
    if score >= 60:
        frontier_level = "高战略价值"
        frontier_badge = "🔥"
    elif score >= 40:
        frontier_level = "高前沿"
        frontier_badge = "⚡"
    elif score >= 20:
        frontier_level = "中前沿"
        frontier_badge = "📌"
    else:
        frontier_level = "常规"
        frontier_badge = ""

    return {
        "score": min(score, 100),  # 最高100分
        "level": frontier_level,
        "badge": frontier_badge,
        "keywords": list(set(matched_keywords))[:5]  # 最多5个关键词
    }


# ==========================================
# 4. 深度搜索逻辑
# ==========================================

def fetch_with_depth(query_info: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    深度搜索：获取过去24小时的高质量链接
    """
    query = query_info["query"]
    category = query_info["category"]
    dimension = query_info["dimension"]

    headers = {
        "X-Subscription-Token": BRAVE_API_KEY,
        "Accept": "application/json"
    }

    # 深度搜索参数
    params = {
        "q": query,
        "count": 10,              # 获取更多结果
        "freshness": "pd",        # 过去24小时 (past day)
        "search_lang": "zh-hans", # 中文优先
        "text_decorations": "false",
        "safesearch": "off"
    }

    try:
        response = requests.get(
            "https://api.search.brave.com/res/v1/web/search",
            headers=headers,
            params=params,
            timeout=10
        )
        response.raise_for_status()
        results = response.json().get("web", {}).get("results", [])

        items = []
        for res in results:
            title = res.get("title", "")
            snippet = res.get("description", "")

            # 计算前沿程度评分
            frontier = calculate_frontier_score(title, snippet, dimension)

            items.append({
                "title": title,
                "link": res.get("url"),
                "snippet": snippet,
                "source": res.get("meta_url", {}).get("hostname", "Unknown"),
                "category": category,
                "dimension": dimension,              # 查询维度
                "frontier_score": frontier["score"],  # 前沿分数
                "frontier_level": frontier["level"],  # 前沿等级
                "frontier_badge": frontier["badge"],  # 徽章
                "frontier_keywords": frontier["keywords"],  # 匹配关键词
                "published_at": res.get("page_age"),  # 发布时间
                "collected_at": datetime.now().isoformat(),  # 采集时间
            })

        return items

    except Exception as e:
        print(f"⚠️ 搜索失败 [{query}]: {str(e)}")
        return []


# ==========================================
# 5. 主逻辑
# ==========================================

def update_intelligence() -> Dict[str, Any]:
    """
    主更新逻辑
    """
    print("🚀 启动情报深度采集...")

    # 生成查询矩阵
    queries = generate_search_matrix()
    print(f"📋 生成 {len(queries)} 个多维查询")

    all_items = []
    stats = {
        "total_queries": len(queries),
        "successful_queries": 0,
        "total_items": 0,
        "high_strategic": 0,
        "high_frontier": 0,
        "medium_frontier": 0
    }

    # 执行深度搜索
    for idx, query_info in enumerate(queries, 1):
        print(f"\n[{idx}/{len(queries)}] 🔍 {query_info['dimension']} | {query_info['query']}")

        items = fetch_with_depth(query_info)

        if items:
            stats["successful_queries"] += 1
            stats["total_items"] += len(items)

            for item in items:
                if item["frontier_level"] == "高战略价值":
                    stats["high_strategic"] += 1
                elif item["frontier_level"] == "高前沿":
                    stats["high_frontier"] += 1
                elif item["frontier_level"] == "中前沿":
                    stats["medium_frontier"] += 1

            all_items.extend(items)
            print(f"   ✓ 获取 {len(items)} 条 | 高战略: {sum(1 for i in items if i['frontier_level'] == '高战略价值')}")

    # 批量写入数据库
    if all_items:
        print(f"\n💾 写入 {len(all_items)} 条情报到数据库...")

        try:
            # 使用 upsert 避免重复 (根据 link 去重)
            result = supabase.table("industry_intelligence").upsert(
                all_items,
                on_conflict="link"
            ).execute()

            stats["saved"] = len(all_items)
            print(f"✅ 采集完成！")
            print(f"   - 总查询: {stats['total_queries']}")
            print(f"   - 成功查询: {stats['successful_queries']}")
            print(f"   - 总情报: {stats['total_items']}")
            print(f"   - 🔥高战略价值: {stats['high_strategic']}")
            print(f"   - ⚡高前沿: {stats['high_frontier']}")
            print(f"   - 📌中前沿: {stats['medium_frontier']}")

        except Exception as e:
            print(f"❌ 数据库写入失败: {str(e)}")
            stats["error"] = str(e)

    return stats


# ==========================================
# 6. API Handler
# ==========================================

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            stats = update_intelligence()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()

            import json
            self.wfile.write(json.dumps({
                "status": "success",
                "stats": stats,
                "message": "Intelligence updated with frontier depth"
            }, ensure_ascii=False).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "error",
                "message": str(e)
            }, ensure_ascii=False).encode())


# ==========================================
# 7. 本地测试
# ==========================================

if __name__ == '__main__':
    update_intelligence()
