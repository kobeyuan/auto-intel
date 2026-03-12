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
        # 移除强制代理，改用动态检测，防止 ProxyError 导致崩溃
        if HTTP_PROXY and os.environ.get("USE_PROXY", "true").lower() == "true":
            self.session.proxies = {"http": HTTP_PROXY, "https": HTTP_PROXY}
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

    def free_search(self, query: str, category: str = None) -> List[Dict[str, str]]:
        """使用 DuckDuckGo 免费搜索 (增加多来源回退)"""
        print(f"🔍 搜索: {query}")

        # 尝试来源 1: DuckDuckGo HTML
        results = self._search_duckduckgo(query, category)
        if results:
            return results

        # 尝试来源 2: DuckDuckGo Lite
        print(f"   ⚠️ DDG HTML 受限，尝试 DuckDuckGo Lite...")
        time.sleep(3)
        results = self._search_duckduckgo_lite(query, category)
        if results:
            return results

        # 尝试来源 3: 百度资讯 (作为中文来源回退)
        print(f"   ⚠️ DDG 全面受限，尝试 百度资讯...")
        time.sleep(2)
        return self._search_baidu_news(query, category)

    def _search_baidu_news(self, query: str, category: str = None) -> List[Dict[str, str]]:
        """百度资讯回退方案"""
        url = f"https://www.baidu.com/s?tn=news&word={query}"
        try:
            # 百度搜索不强制使用代理
            proxies = None
            response = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15, proxies=proxies)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            for item in soup.find_all('div', class_='result-op'):
                if len(results) >= 5: break
                title_tag = item.find('h3')
                if title_tag:
                    title = title_tag.get_text().strip()
                    link = title_tag.find('a')['href']
                    snippet = item.get_text().strip()[:200]
                    results.append({"title": title, "link": link, "snippet": snippet})
            return results
        except Exception as e:
            print(f"   ⚠️ 百度回退失败: {e}")
            return []

    def _search_duckduckgo_lite(self, query: str, category: str = None) -> List[Dict[str, str]]:
        """DuckDuckGo Lite 版本的爬取 (通常比 HTML 版更稳定)"""
        url = "https://lite.duckduckgo.com/lite/"
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Content-Type": "application/x-www-form-urlencoded"
            }
            response = self.session.post(url, data={"q": query}, headers=headers, timeout=20)
            if response.status_code != 200:
                return []

            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            # Lite 版的结构是 table
            rows = soup.find_all('tr')
            for i in range(0, len(rows), 4): # Lite 版每条结果占几行
                if len(results) >= 5: break
                try:
                    title_row = rows[i]
                    snippet_row = rows[i+1] if i+1 < len(rows) else None

                    link_tag = title_row.find('a', class_='result-link')
                    if not link_tag: continue

                    title = link_tag.get_text().strip()
                    link = link_tag['href']

                    # 清理 DDG 跳转链接
                    if link.startswith('//duckduckgo.com/l/?kh=-1&uddg='):
                        link = re.search(r'uddg=([^&]+)', link).group(1)
                        import urllib.parse
                        link = urllib.parse.unquote(link)

                    snippet = ""
                    if snippet_row:
                        snippet_tag = snippet_row.find('td', class_='result-snippet')
                        snippet = snippet_tag.get_text().strip() if snippet_tag else ""

                    # 2026 过滤逻辑复用
                    if "2026" not in title and "2026" not in snippet:
                        if "gtc" in query.lower() or "nvidia" in query.lower():
                            continue

                    results.append({"title": title, "link": link, "snippet": snippet})
                except:
                    continue
            return results
        except Exception as e:
            print(f"   ⚠️ Lite 搜索失败: {e}")
            return []

    def _search_duckduckgo(self, query: str, category: str = None) -> List[Dict[str, str]]:
        url = "https://html.duckduckgo.com/html/"
        try:
            # 随机化 User-Agent 进一步降低被封概率
            headers = {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
            }
            response = self.session.post(url, data={"q": f"{query} l:cn-zh"}, headers=headers, timeout=20)

            if response.status_code == 403:
                print(f"   🚫 DDG 拒绝访问 (403)，可能触发了频率限制")
                return []

            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            results = []
            for i, result in enumerate(soup.find_all('div', class_='result')):
                if i >= 6: break
                title_tag = result.find('a', class_='result__a')
                snippet_tag = result.find('a', class_='result__snippet')
                if title_tag:
                    title = title_tag.get_text().strip()
                    link = title_tag['href']
                    snippet = snippet_tag.get_text().strip() if snippet_tag else ""

                    # 严格时效性过滤
                    if "gtc" in query.lower() or "nvidia" in query.lower():
                        if "2026" not in title and "2026" not in snippet:
                            continue
                        if ("2024" in title or "2025" in title) and "2026" not in title:
                            continue

                    # 板块去噪
                    if category == "gtc-insight" and ("Thor" in title or "芯片" in title):
                        if not any(k in (title + snippet) for k in ["Blackwell", "B300", "2026", "Strategic", "Keynote"]):
                            continue

                    # 来源过滤
                    forbidden_domains = ["newtalk.tw", "example.com"]
                    if any(domain in link for domain in forbidden_domains):
                        continue

                    # 严格 2026+ 及相关关键词过滤 (强化版)
                    # 1. 如果标题或摘要包含 2024, 2025, 则除非显式包含 2026/2027，否则跳过
                    content_lower = (title + snippet).lower()
                    if any(y in content_lower for y in ["2024", "2025"]):
                        if not any(y in content_lower for y in ["2026", "2027"]):
                            continue

                    # 2. 彻底屏蔽 user 提到的陈旧话题
                    stale_topics = ["吴新宙", "极越", "ces 2025", "fsd v12", "fsd v13"]
                    if any(topic in content_lower for topic in stale_topics):
                        continue

                    # 3. 针对 Thor 进行更严格的鲜度校验 (必须包含 Blackwell 或 B300 等 2026 核心词)
                    if "thor" in content_lower:
                        if not any(k in content_lower for k in ["blackwell", "b300", "2026", "ultra", "keynote"]):
                            continue

                    results.append({"title": title, "link": link, "snippet": snippet})
            return results
        except Exception as e:
            print(f"   ⚠️ 内部搜索细节失败: {e}")
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
        # 针对各板块的搜索矩阵 (重点强化 2026 时效性 & 多元化洞察)
        # 移除过度聚焦 Thor 芯片的查询，转向全方位 GTC 战略洞察
        search_matrix = [
            # GTC 专题 (多元化战略资讯)
            {"query": "NVIDIA GTC 2026 Jensen Huang keynote highlights", "category": "gtc-insight"},
            {"query": "英伟达 GTC 2026 全球 AI 战略 趋势", "category": "gtc-insight"},
            {"query": "NVIDIA Blackwell Ultra B300 架构 细节 2026", "category": "gtc-insight"},
            {"query": "GTC 2026 具身智能 机器人 Isaac 平台 最新", "category": "gtc-insight"},
            {"query": "NVIDIA Omniverse 2026 工业数字孪生 汽车制造", "category": "gtc-insight"},
            {"query": "GTC 2026 AI Agents NIMs 企业级应用", "category": "gtc-insight"},

            # 自动驾驶 (端到端与大模型)
            {"query": "Tesla FSD v14 2026 最新评价 体验", "category": "autonomous-driving"},
            {"query": "华为 乾崑 ADS 3.5 4.0 路线图 2026", "category": "autonomous-driving"},
            {"query": "2026 端到端 自动驾驶 算法 架构 突破", "category": "autonomous-driving"},
            {"query": "小米 SU7 Ultra 智驾系统 2026 进展", "category": "autonomous-driving"},

            # 智能座舱
            {"query": "骁龙 8775P 舱驾一体 2026 首发车型", "category": "smart-cockpit"},
            {"query": "车载 端侧 大模型 2026 落地 厂商", "category": "smart-cockpit"},
            {"query": "鸿蒙座舱 5.0 原生鸿蒙 汽车 生态 2026", "category": "smart-cockpit"},

            # 传感器/前沿
            {"query": "华为 896线 激光雷达 尊界 S800 搭载 2026", "category": "sensors"},
            {"query": "千线级 激光雷达 2026 行业 排名", "category": "sensors"}
        ]

        all_items = []
        for task in search_matrix:
            results = self.free_search(task['query'], category=task['category'])
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
