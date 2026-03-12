import os
import requests
import time
import json
import re
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from bs4 import BeautifulSoup

# 加载配置
load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
HTTP_PROXY = os.environ.get("HTTP_PROXY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_API_URL = os.environ.get("GEMINI_API_URL", "https://new.lemonapi.site/v1")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "[L]gemini-3-pro-preview")

# 初始化 Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class IntelligenceCrawler:
    def __init__(self):
        self.session = requests.Session()
        if HTTP_PROXY:
            self.session.proxies = {"http": HTTP_PROXY, "https": HTTP_PROXY}
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

    def free_search(self, query: str) -> List[Dict[str, str]]:
        """使用 DuckDuckGo 免费搜索"""
        print(f"🔍 搜索: {query}")
        url = "https://html.duckduckgo.com/html/"
        try:
            # 增加重试逻辑
            for _ in range(3):
                response = self.session.post(url, data={"q": query}, timeout=20)
                if response.status_code == 200:
                    break
                time.sleep(2)

            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            for i, result in enumerate(soup.find_all('div', class_='result')):
                if i >= 6: break # 每条查询取前6个结果
                title_tag = result.find('a', class_='result__a')
                snippet_tag = result.find('a', class_='result__snippet')
                if title_tag:
                    title = title_tag.get_text().strip()
                    snippet = snippet_tag.get_text().strip() if snippet_tag else ""

                    # 严格时效性过滤：如果是 GTC 相关，必须包含 2026
                    if "gtc" in query.lower() or "nvidia" in query.lower():
                        if "2026" not in title and "2026" not in snippet:
                            continue

                    results.append({
                        "title": title,
                        "link": title_tag['href'],
                        "snippet": snippet
                    })
            return results
        except Exception as e:
            print(f"❌ 搜索失败 [{query}]: {e}")
            return []

    def ai_analyze(self, title: str, snippet: str, category: str) -> Dict[str, Any]:
        """AI 深度分析：针对不同类别使用不同视角，中文输出"""
        if not GEMINI_API_KEY:
            return None

        # 动态 Prompt 逻辑
        role_context = "比亚迪【智能化产品规划部 & 战略部】高级分析师"
        if category == "gtc-insight":
            focus = "NVIDIA GTC 2026 行业资讯、Blackwell/DRIVE Thor 架构及对比亚迪的战略意义"
        elif category == "autonomous-driving":
            focus = "自动驾驶（FSD/ADS/NOA）最新进展、端到端技术落地、算法架构演进"
        elif category == "smart-cockpit":
            focus = "智能座舱、车载大模型、人机交互、座舱芯片（8295/澎湃等）趋势"
        else:
            focus = "智能汽车行业前沿动态、供应链革新及市场竞争态势"

        prompt = f"""
        作为{role_context}，请对以下行业资讯进行深度研判。

        【类别】: {category} (重点关注: {focus})
        【资讯标题】: {title}
        【内容摘要】: {snippet}

        请输出以下维度的深度洞察（必须使用中文输出）：
        1. 【这是什么？】: 简要说明技术/事件的核心本质。
        2. 【对比亚迪的影响/启示】: 从战略规划角度，分析对我们智能化产品（璇玑架构、天神之眼等）的具体影响。
        3. 【对策/关注点】: 建议后续如何跟进或应对。

        请严格以 JSON 格式输出，不要包含 Markdown 标签:
        {{
            "what": "研判内容...",
            "impact": "影响分析...",
            "focus": ["要点1", "要点2"]
        }}
        """

        try:
            # 增加重试机制应对 503
            for attempt in range(3):
                resp = requests.post(
                    f"{GEMINI_API_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {GEMINI_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": GEMINI_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3
                    },
                    timeout=45
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data['choices'][0]['message']['content']
                    match = re.search(r'\{.*\}', content, re.DOTALL)
                    if match:
                        return json.loads(match.group())
                elif resp.status_code == 503:
                    print(f"   ⏳ AI 服务繁忙 (503), 第 {attempt+1} 次重试...")
                    time.sleep(5)
                else:
                    break
        except Exception as e:
            print(f"   ⚠️ AI 分析失败: {e}")
        return None

    def run_full_update(self):
        # 针对各板块的搜索矩阵 (重点强化 2026 时效性)
        search_matrix = [
            # GTC 专题 (中文搜索，强制 2026)
            {"query": "NVIDIA GTC 2026 行业资讯 中文", "category": "gtc-insight"},
            {"query": "英伟达 GTC 2026 比亚迪 战略合作", "category": "gtc-insight"},
            {"query": "NVIDIA DRIVE Thor 2026 量产计划", "category": "gtc-insight"},
            {"query": "Blackwell GPU 汽车大模型 训练 2026", "category": "gtc-insight"},

            # 自动驾驶 (强化时效)
            {"query": "2026年 自动驾驶 端到端 行业最新趋势", "category": "autonomous-driving"},
            {"query": "Tesla FSD v14 2026 最新版本 功能", "category": "autonomous-driving"},
            {"query": "华为 乾崑 ADS 3.5 最新资讯", "category": "autonomous-driving"},
            {"query": "小米 SU7 智驾 2026 最新推送", "category": "autonomous-driving"},

            # 智能座舱
            {"query": "2026 智能座舱 芯片 8775 最新应用", "category": "smart-cockpit"},
            {"query": "车载 AI 大模型 交互 2026 趋势", "category": "smart-cockpit"},
            {"query": "鸿蒙座舱 5.0 2026 最新进展", "category": "smart-cockpit"},

            # 传感器/前沿
            {"query": "华为 896线 激光雷达 2026 最新参数", "category": "sensors"},
            {"query": "192线 固态激光雷达 价格战 2026", "category": "sensors"}
        ]

        all_items = []
        for task in search_matrix:
            results = self.free_search(task['query'])
            for res in results:
                print(f"   [分析] {res['title'][:40]}...")
                analysis = self.ai_analyze(res['title'], res['snippet'], task['category'])

                # 构建最终展示的 snippet (三段式中文)
                if analysis:
                    display_snippet = f"【AI分析】\n这是什么？ {analysis.get('what')}\n有什么影响？ {analysis.get('impact')}\n关注要点：\n"
                    for i, p in enumerate(analysis.get('focus', []), 1):
                        display_snippet += f"{i}. {p}\n"
                else:
                    # 如果 AI 分析失败，也要确保内容中包含 2026，否则丢弃以保鲜
                    if "2026" not in res['title'] and "2026" not in res['snippet']:
                        continue
                    display_snippet = res['snippet']

                item = {
                    "title": res['title'],
                    "link": res['link'],
                    "snippet": display_snippet,
                    "category": task['category'],
                    "source": "GTC/Strategic",
                    "quality_score": 98 if analysis else 70,
                    "created_at": datetime.now().isoformat(),
                    "verified": True if analysis else False
                }
                all_items.append(item)
                time.sleep(1.5)

        if all_items:
            # 去重并写入
            unique_items = {item['link']: item for item in all_items}.values()
            try:
                # 写入数据库 (created_at 确保在前端置顶)
                supabase.table("industry_intelligence").upsert(list(unique_items), on_conflict="link").execute()
                print(f"✅ 更新完成！存入 {len(unique_items)} 条 2026 核心情报。")
            except Exception as e:
                print(f"❌ 数据库写入失败: {e}")

if __name__ == "__main__":
    crawler = IntelligenceCrawler()
    crawler.run_full_update()
