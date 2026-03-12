# api/update_intel.py
# 重构版：多维查询矩阵 + 前沿深度评分 + 实时新鲜度

import os
import requests
import time
from dotenv import load_dotenv
from supabase import create_client, Client
from http.server import BaseHTTPRequestHandler
from datetime import datetime
from typing import List, Dict, Any

# 强制加载项目根目录下的 .env 文件
load_dotenv()

# 获取当前年份和季度（用于动态搜索词生成）
CURRENT_YEAR = datetime.now().year
CURRENT_QUARTER = (datetime.now().month - 1) // 3 + 1
NEXT_YEAR = CURRENT_YEAR + 1

# 配置环境变量
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY")

# 代理配置（用于解决网络限制问题）
HTTP_PROXY = os.environ.get("HTTP_PROXY")
HTTPS_PROXY = os.environ.get("HTTPS_PROXY")
PROXIES = {}
if HTTP_PROXY:
    PROXIES['http'] = HTTP_PROXY
if HTTPS_PROXY:
    PROXIES['https'] = HTTPS_PROXY

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# 请求会话配置（支持代理和重试）
def create_session():
    """创建配置好的请求会话"""
    session = requests.Session()
    if PROXIES:
        session.proxies.update(PROXIES)
        print(f"   使用代理: {PROXIES}")
    return session


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
    "End-to-End": ["端到端", "End-to-End", "E2E 自动驾驶", "端到端 2.0"],
    "VLA": ["VLA 模型", "视觉语言动作模型", "Vision Language Action", "Grok"],
    "Chiplet": ["芯粒", "Chiplet", "先进封装", "汽车芯片封装"],
    "Solid-state": ["固态激光雷达", "896线激光雷达", "Solid-state LiDAR", "192线 激光雷达"],
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
    "L5", "完全自动驾驶", "FSD v14", "Grok AI", "896线", "端到端 2.0",
]


# ==========================================
# 2. 查询矩阵生成器
# ==========================================

def generate_search_matrix() -> List[Dict[str, Any]]:
    """
    生成多维查询矩阵（动态年份，增强实时性）
    返回: [{"query": "搜索词", "category": "分类", "dimension": "维度"}]
    """
    queries = []

    # 动态年份
    current_year = CURRENT_YEAR
    next_year = NEXT_YEAR

    # 核心类别定义（基础关键词，不含年份和修饰词）
    categories = {
        "smart-cockpit": ["智能座舱", "智能座舱系统", "座舱芯片", "座舱操作系统"],
        "autonomous-driving": ["智能驾驶", "自动驾驶", "智驾方案", "ADAS"],
        "sensors": ["激光雷达", "毫米波雷达", "视觉传感器", "车载芯片"],
        "ota": ["OTA升级", "固件更新", "汽车软件更新"],
        "gtc-insight": ["NVIDIA GTC 2026", "比亚迪 智能化 GTC", "DRIVE Thor BYD", "比亚迪 璇玑架构"],
        "sentiment": ["智驾评价", "自动驾驶体验", "智能驾驶口碑"],
    }

    # 基础查询（使用动态年份）
    for category, base_terms in categories.items():
        for term in base_terms:
            # 移除"2026"固定年份，使用更灵活的搜索词
            queries.append({
                "query": f"{term} 最新 行业趋势",
                "category": category,
                "dimension": "基础趋势"
            })
            # 添加实时性搜索词
            queries.append({
                "query": f"{term} 最新发布",
                "category": category,
                "dimension": "最新动态"
            })

    # 实时热点查询（高优先级）
    realtime_keywords = [
        "今日", "刚刚", "最新", "发布", "官宣", "重磅",
        "突破", "首发", "率先", "领先"
    ]
    for keyword in realtime_keywords:
        queries.append({
            "query": f"智能驾驶 {keyword}",
            "category": "autonomous-driving",
            "dimension": "实时热点"
        })

    # 竞争对手 x 核心技术 交叉查询（使用动态年份）
    for comp_name, comp_terms in COMPETITORS.items():
        for tech_name, tech_terms in CORE_TECH.items():
            for comp_term in comp_terms[:2]:
                for tech_term in tech_terms[:2]:
                    category = "autonomous-driving" if "驾驶" in tech_term or "智驾" in tech_term else "sensors"
                    queries.append({
                        "query": f"{comp_term} {tech_term} 最新",
                        "category": category,
                        "dimension": f"竞争技术-{comp_name}"
                    })

    # 竞争对手 x 法规 交叉查询
    for comp_name, comp_terms in COMPETITORS.items():
        for reg_name, reg_terms in REGULATIONS.items():
            for comp_term in comp_terms[:1]:
                for reg_term in reg_terms[:2]:
                    queries.append({
                        "query": f"{comp_term} {reg_term}",
                        "category": "autonomous-driving",
                        "dimension": f"法规合规-{comp_name}"
                    })

    # 核心技术 x 法规 交叉查询
    for tech_name, tech_terms in CORE_TECH.items():
        for reg_name, reg_terms in REGULATIONS.items():
            for tech_term in tech_terms[:1]:
                for reg_term in reg_terms[:2]:
                    queries.append({
                        "query": f"{tech_term} {reg_term}",
                        "category": "autonomous-driving",
                        "dimension": f"技术准入-{tech_name}"
                    })

    # 高战略价值专项查询（使用动态未来年份）
    strategic_queries = [
        f"{next_year} 自动驾驶路线图",
        f"{next_year} 智能驾驶 Roadmap",
        f"{next_year+1} 智驾方案",
        "Next-gen 智驾方案",
        "下一代 自动驾驶",
        "L4 商业化 最新进展",
        "端到端 量产 最新",
        # GTC 2026 专项
        "GTC 2026 自动驾驶",
        "NVIDIA GTC 2026 汽车",
        "比亚迪 GTC 2026 合作",
        "BYD NVIDIA DRIVE Thor",
        "比亚迪 智能化 战略 GTC",
        # 新增：热门车型和品牌
        "Tesla FSD v14 最新版本",
        "Grok AI 整合 车机",
        "华为 896线 激光雷达",
        "ADS 3.5 最新功能",
        "华为 乾崑 智驾",
        "小米 SU7 智驾 v2.0",
        "问界 M9 智驾",
        "蔚来 NAD 最新",
        "小鹏 XNGP 最新",
    ]
    for query in strategic_queries:
        queries.append({
            "query": query,
            "category": "autonomous-driving",
            "dimension": "战略前瞻"
        })

    # ========== OTA 专项查询 ==========
    ota_brands = {
        "Tesla": ["Tesla OTA", "特斯拉 OTA更新", "特斯拉 软件更新"],
        "Huawei": ["华为 鸿蒙座舱 OTA", "问界 OTA", "智界 OTA更新"],
        "NIO": ["蔚来 OTA", "蔚来 智能系统更新", "NIO OS更新"],
        "XPeng": ["小鹏 OTA", "小鹏 XOS更新", "小鹏 天玑系统"],
        "LiAuto": ["理想 OTA", "理想 智能座舱更新", "理想 OTA升级"],
        "Xiaomi": ["小米汽车 OTA", "小米 SU7 OTA", "小米澎湃座舱"],
        "BYD": ["比亚迪 OTA", "腾势 OTA更新", "仰望 OTA"],
    }

    for brand, terms in ota_brands.items():
        for term in terms[:2]:  # 每个品牌取2个关键词
            queries.append({
                "query": f"{term} 最新",
                "category": "ota",
                "dimension": f"OTA更新-{brand}"
            })
            # 座舱功能
            queries.append({
                "query": f"{term} 座舱功能",
                "category": "ota",
                "dimension": f"座舱功能-{brand}"
            })
            # 智驾功能
            queries.append({
                "query": f"{term} 智驾功能",
                "category": "ota",
                "dimension": f"智驾功能-{brand}"
            })

    # ========== 座舱功能专项查询 ==========
    cockpit_features = [
        "智能座舱 芯片升级", "座舱 8295芯片", "座舱 骁龙芯片",
        "鸿蒙座舱 最新功能", "智能座舱 多屏互动",
        "座舱语音助手", "AI大模型 座舱", "智能座舱 手势控制",
        "AR-HUD 抬头显示", "智能座舱 氛围灯",
        "座舱游戏", "车载娱乐", "智能座舱 K歌",
        "华为 鸿蒙座舱 4.0", "小米 澎湃座舱 功能",
        "蔚来 数字座舱", "理想 智能座舱 升级",
    ]
    for query in cockpit_features:
        queries.append({
            "query": query,
            "category": "smart-cockpit",
            "dimension": "座舱功能特性"
        })

    # ========== 智驾功能专项查询 ==========
    ad_features = [
        "城市NOA 最新开通", "城市导航辅助 推送",
        "高速NOA 功能升级", "智能泊车 代客泊车",
        "端到端 智驾推送", "无图智驾 开通城市",
        "华为 ADS 3.0 功能", "小鹏 XNGP 全量推送",
        "理想 AD Max 功能", "蔚来 Banyan 智驾",
        "小米 SU7 城市NOA", "问界 M9 智驾功能",
        "自动驾驶 安全升级", "AEB 功能升级",
        "智能召唤", "自动泊车 机械车位",
    ]
    for query in ad_features:
        queries.append({
            "query": query,
            "category": "autonomous-driving",
            "dimension": "智驾功能特性"
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
# 4. AI 情报分析模块
# ==========================================

# AI 模型配置
AI_MODEL = os.environ.get("DEFAULT_AI_MODEL", "gemini")
GEMINI_API_URL = os.environ.get("GEMINI_API_URL", "https://new.lemonapi.site/v1")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "[L]gemini-3-pro-preview")
# 联网搜索模型（用于获取实时信息）
GEMINI_SEARCH_MODEL = os.environ.get("GEMINI_SEARCH_MODEL", "[L]gemini-3.1-pro-preview-search")
KIMI_API_URL = os.environ.get("KIMI_API_URL", "https://api.moonshot.cn/v1")
KIMI_API_KEY = os.environ.get("KIMI_API_KEY", "")
KIMI_MODEL = os.environ.get("KIMI_MODEL", "kimi-k2.5")

def analyze_with_ai(title: str, snippet: str) -> Dict[str, Any]:
    """
    使用 AI 模型对情报进行深度分析
    产出：这是什么？对我们有什么影响？建议关注点是什么？
    """
    if not GEMINI_API_KEY and not KIMI_API_KEY:
        print("   ⚠️ AI API Key 未配置，跳过 AI 分析")
        return None

    prompt = f"""作为智能驾驶产业战略分析师，请对以下情报进行深度分析。

⚠️ 重要提示：
- 当前日期是 {CURRENT_YEAR} 年
- 请基于情报内容本身进行分析，不要假设额外的背景知识
- 如果涉及版本号、发布时间等具体信息，请以情报内容为准
- 如有不确定性，请在回答中注明

【标题】{title}
【内容】{snippet}

请回答以下三个问题（每点 30-50 字）：

1. 【这是什么？】
简要概括这条情报的核心内容，包括涉及的技术/产品/公司。

2. 【对我们有什么影响？】
分析这条情报对智能驾驶行业的潜在影响，以及对我们竞争策略的启示。

3. 【建议关注点是什么？】
列出 2-3 个需要持续跟踪的关键点或后续可能的发展。

请用中文回答，格式如下：
{{
  "what_is_it": "概括内容...",
  "impact": "影响分析...",
  "focus_points": ["关注点1", "关注点2", "关注点3"]
}}"""

    try:
        # 根据 AI_MODEL 设置选择模型
        if AI_MODEL == "kimi" and KIMI_API_KEY:
            # 使用 Kimi (kimi-k2.5 不支持 temperature 参数)
            response = requests.post(
                f"{KIMI_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {KIMI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": KIMI_MODEL,
                    "messages": [
                        {"role": "system", "content": "你是智能驾驶产业战略分析专家，擅长提炼情报要点并给出战略洞察。"},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 800
                },
                timeout=15
            )
        elif GEMINI_API_KEY:
            # 使用 Gemini
            response = requests.post(
                f"{GEMINI_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GEMINI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GEMINI_MODEL,
                    "messages": [
                        {"role": "system", "content": "你是智能驾驶产业战略分析专家，擅长提炼情报要点并给出战略洞察。"},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 800
                },
                timeout=15
            )
        elif KIMI_API_KEY:
            # 回退到 Kimi
            response = requests.post(
                f"{KIMI_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {KIMI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": KIMI_MODEL,
                    "messages": [
                        {"role": "system", "content": "你是智能驾驶产业战略分析专家，擅长提炼情报要点并给出战略洞察。"},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 800
                },
                timeout=15
            )
        else:
            print("   ⚠️ 没有可用的 AI API Key")
            return None

        response.raise_for_status()
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        # 解析 JSON
        import json
        json_match = __import__('re').search(r'\{[\s\S]*\}', content)
        if json_match:
            analysis = json.loads(json_match.group())
            return {
                "what_is_it": analysis.get("what_is_it", ""),
                "impact": analysis.get("impact", ""),
                "focus_points": analysis.get("focus_points", []),
                "ai_analyzed": True,
                "ai_provider": AI_MODEL,
                "ai_analysis_time": datetime.now().isoformat()
            }

    except Exception as e:
        print(f"   ⚠️ AI 分析失败: {str(e)}")

    return None

def generate_daily_strategic_summary(high_value_intel: List[Dict]) -> str:
    """
    生成『今日 AI 战略精要』
    汇总过去 24 小时高价值情报，生成 200 字以内的行业趋势研判
    """
    if not high_value_intel:
        return "今日暂无高价值情报更新。"

    if not GEMINI_API_KEY and not KIMI_API_KEY:
        return "AI 分析模块未配置，无法生成战略精要。"

    # 准备情报摘要
    intel_summaries = []
    for i, intel in enumerate(high_value_intel[:8], 1):  # 取前 8 条
        intel_summaries.append(f"{i}. {intel['title']} ({intel.get('frontier_level', '常规')})")

    intel_text = "\n".join(intel_summaries)

    prompt = f"""作为智能驾驶行业首席分析师，请基于以下今日采集的高价值情报，生成一段『AI 战略精要』：

【今日高价值情报】
{intel_text}

请生成一段 150-200 字的行业趋势研判，要求：
1. 概括今日最重要的一两个趋势
2. 点明对行业的关键影响
3. 给出明日或近期关注建议
4. 语言简洁有力，适合高管快速阅读

格式：直接输出段落，不需要标题。"""

    try:
        # 根据 AI_MODEL 设置选择模型
        if AI_MODEL == "kimi" and KIMI_API_KEY:
            # 使用 Kimi
            response = requests.post(
                f"{KIMI_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {KIMI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": KIMI_MODEL,
                    "messages": [
                        {"role": "system", "content": "你是智能驾驶行业首席分析师，擅长撰写简洁有力的战略研判。"},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 300
                },
                timeout=20
            )
        elif GEMINI_API_KEY:
            # 使用 Gemini
            response = requests.post(
                f"{GEMINI_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GEMINI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": GEMINI_MODEL,
                    "messages": [
                        {"role": "system", "content": "你是智能驾驶行业首席分析师，擅长撰写简洁有力的战略研判。"},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.5,
                    "max_tokens": 300
                },
                timeout=20
            )
        elif KIMI_API_KEY:
            # 回退到 Kimi
            response = requests.post(
                f"{KIMI_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {KIMI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": KIMI_MODEL,
                    "messages": [
                        {"role": "system", "content": "你是智能驾驶行业首席分析师，擅长撰写简洁有力的战略研判。"},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 300
                },
                timeout=20
            )

        response.raise_for_status()
        data = response.json()
        summary = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        # 保存到数据库
        try:
            supabase.table("intelligence_reports").insert({
                "report_type": "daily",
                "title": f"今日 AI 战略精要 - {datetime.now().strftime('%Y-%m-%d')}",
                "content": summary,
                "overview": summary[:100] + "...",
                "data_period_start": datetime.now().replace(hour=0, minute=0, second=0).isoformat(),
                "data_period_end": datetime.now().isoformat(),
                "intelligence_count": len(high_value_intel),
                "generated_by": AI_MODEL,
                "created_at": datetime.now().isoformat()
            }).execute()
        except Exception as e:
            print(f"   ⚠️ 保存战略精要失败: {str(e)}")

        return summary

    except Exception as e:
        print(f"   ⚠️ 生成战略精要失败: {str(e)}")
        return "战略精要生成失败，请稍后重试。"


# ==========================================
# 5. 深度搜索逻辑
# ==========================================

def fetch_with_depth(query_info: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    深度搜索：获取过去24小时的高质量链接 (带重试逻辑)
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
        "count": 15,              # 增加获取条数
        "freshness": "pw",        # 从 past day (pd) 改为 past week (pw) 以覆盖更多高质量深度分析
        "search_lang": "zh-hans", # 中文优先
        "text_decorations": "false",
        "safesearch": "off"
    }

    max_retries = 3
    retry_delay = 5

    for attempt in range(max_retries):
        try:
            session = create_session()
            response = session.get(
                "https://api.search.brave.com/res/v1/web/search",
                headers=headers,
                params=params,
                timeout=60  # 增加超时时间到 60s
            )
            response.raise_for_status()
            results = response.json().get("web", {}).get("results", [])

            items = []
            for res in results:
                title = res.get("title", "")
                snippet = res.get("description", "")

                # 计算前沿程度评分
                frontier = calculate_frontier_score(title, snippet, dimension)

                # 对高价值情报进行 AI 分析
                ai_analysis = None
                if frontier["score"] >= 40:  # 只对高前沿及以上进行 AI 分析
                    print(f"   🤖 AI 分析: {title[:30]}...")
                    ai_analysis = analyze_with_ai(title, snippet)

                item = {
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
                    "credibility_tier": "tier3",         # 默认搜索结果为 tier3
                    "quality_score": frontier["score"],   # 映射前沿分数到质量分数
                    "verified": False,                   # 搜索结果默认未验证
                    "keywords": frontier["keywords"],     # 映射到 keywords 字段
                }

                # 合并 AI 分析结果
                if ai_analysis:
                    item.update({
                        "ai_what_is_it": ai_analysis.get("what_is_it"),
                        "ai_impact": ai_analysis.get("impact"),
                        "ai_focus_points": ai_analysis.get("focus_points"),
                        "ai_analyzed": True,
                        "ai_provider": ai_analysis.get("ai_provider"),
                        "ai_analysis_time": ai_analysis.get("ai_analysis_time")
                    })

                items.append(item)

            return items

        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            if attempt < max_retries - 1:
                print(f"   ⚠️ 网络连接超时 ({e}), 正在进行第 {attempt + 2} 次重试 (等待 {retry_delay}s)...")
                time.sleep(retry_delay)
                continue
            else:
                print(f"   ❌ 搜索失败 [{query}]: 达到最大重试次数")
                return []
        except Exception as e:
            print(f"   ⚠️ 搜索失败 [{query}]: {str(e)}")
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

            # 生成今日 AI 战略精要
            print("\n📝 生成今日 AI 战略精要...")
            high_value_intel = [i for i in all_items if i.get("frontier_score", 0) >= 40]
            strategic_summary = generate_daily_strategic_summary(high_value_intel)
            stats["strategic_summary"] = strategic_summary
            print(f"\n📊 战略精要 ({len(strategic_summary)} 字):")
            print(f"{strategic_summary}")

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
