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

KIMI_API_KEY = os.environ.get("KIMI_API_KEY")
KIMI_API_URL = os.environ.get("KIMI_API_URL", "https://api.moonshot.cn/v1")
KIMI_MODEL = os.environ.get("KIMI_MODEL", "kimi-k2.5")

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

    def ai_filter(self, title: str, snippet: str) -> Dict[str, Any]:
        """使用 Gemini AI 作为行业战略总监进行情报过滤打分"""
        if not GEMINI_API_KEY:
            return {"score": 10, "reason": "GEMINI_API_KEY 未配置，默认通过"}

        prompt = f"""
        作为资深的汽车行业战略总监，请对以下资讯进行【严苛】的情报价值评估。

        【资讯标题】: {title}
        【内容摘要】: {snippet}

        打分规则 (0-10分):
        1. 0-6分 (垃圾噪音，坚决丢弃):
           - 普通车型上市、降价促销、经销商活动。
           - 单一零部件常规发布（如普通激光雷达更新、内饰件）。
           - 基础财报数据罗列、普通媒体试驾/车评。
           - 行业八卦、非实质性的人事变动、基础市场占有率波动。
        2. 7-8分 (核心战略情报，允许入库):
           - 关键技术实质性突破（如固态电池 SOP 节点、舱驾一体算力架构革新）。
           - 重点准入法规落地、全球化战略重大受阻或突破。
           - 头部竞品（特斯拉、华为、蔚小理）重大组织架构调整。
        3. 9-10分 (顶级行业核弹，战略聚焦):
           - 行业范式转移（如特斯拉 FSD 端到端大规模推送、GTC 发布 2000T+ 算力芯片）。
           - 足以彻底改变竞争格局的并购、跨界巨巨头（如苹果、英伟达）的底层战略入局。

        请严格以 JSON 格式输出:
        {{
            "score": 评分数字,
            "reason": "简短的打分理由"
        }}
        """

        try:
            for attempt in range(2):
                resp = requests.post(
                    f"{GEMINI_API_URL}/chat/completions",
                    headers={"Authorization": f"Bearer {GEMINI_API_KEY}", "Content-Type": "application/json"},
                    json={
                        "model": GEMINI_MODEL,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.5
                    },
                    timeout=30
                )
                if resp.status_code == 200:
                    data = resp.json()
                    content = data['choices'][0]['message']['content']

                    # 强力解析逻辑：处理 Markdown 块或脏数据
                    json_str = content
                    if "```" in content:
                        # 提取第一个 JSON 块
                        blocks = re.findall(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
                        if blocks:
                            json_str = blocks[0]
                        else:
                            # 尝试正则匹配最外层的 {}
                            match = re.search(r'(\{.*\})', content, re.DOTALL)
                            if match:
                                json_str = match.group(1)

                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        # 最后的尝试：提取标题和分数
                        score_match = re.search(r'"score":\s*(\d+)', content)
                        reason_match = re.search(r'"reason":\s*"([^"]+)"', content)
                        if score_match:
                            return {
                                "score": int(score_match.group(1)),
                                "reason": reason_match.group(1) if reason_match else "解析失败，仅提取到分数"
                            }
                else:
                    print(f"   ⚠️ Gemini 响应错误 ({resp.status_code}): {resp.text}")
                time.sleep(2)
        except Exception as e:
            print(f"   ⚠️ AI 过滤失败: {e}")
        return {"score": 5, "reason": "分析异常，默认中等分数"}

    def ai_analyze(self, title: str, snippet: str, category: str) -> Dict[str, Any]:
        """AI 深度分析：NotebookLM 级战略简报，强制深度穿透"""
        if not GEMINI_API_KEY:
            return None

        # 针对不同分类定制化 Prompt，确保“智能驾驶”不再输出代码相关内容
        category_focus = ""
        if category == "autonomous-driving":
            category_focus = "【智驾专项要求】禁止输出任何代码、Git 仓库或具体编程实现。必须聚焦于：算法架构演进（如端到端、世界模型）、算力平台竞争、行业准入政策、量产体验对比及对比亚迪的战略挤压。"

        prompt = f"""
        作为比亚迪【战略委员会 & 智能化技术中心】顶级研究员，请对以下资讯进行 NotebookLM 级别的“战略深度研判 (Strategic Briefing)”。

        {category_focus}

        【研判规则】
        1. 深度穿透：禁止复述事实。必须挖掘表象背后的底层逻辑（如：供应链控制权转移、技术代际降维打击）。
        2. 战略协同：从比亚迪“璇玑架构”和“垂直整合”的角度，思考这对我们的威胁或机遇。
        3. 具身智能专项：如果涉及 Robotics/Isaac，必须探讨其在工业制造与实车大脑中的协同。

        【资讯标题】: {title}
        【内容摘要】: {snippet}

        请严格以 JSON 格式输出（中英双语核心词）：
        {{
            "executive_summary": "【战略执行摘要】一句话概括技术/商业本质及对比亚迪的直接冲击。",
            "strategic_countermeasures": "【战略对策】针对此动态，比亚迪技术研发或产品规划应采取的具体行动点（2-3点）。",
            "industry_trajectory": "【行业轨迹】判断该动态如何改变未来 12-24 个月的竞争范式。",
            "sentiment": "positive/neutral/negative",
            "keywords": ["中英关键词1", "中英关键词2"]
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

                    # 强力解析逻辑：处理 Markdown 块或脏数据
                    json_str = content
                    if "```" in content:
                        # 提取第一个 JSON 块
                        blocks = re.findall(r'```(?:json)?\s*(\{.*?\})\s*```', content, re.DOTALL)
                        if blocks:
                            json_str = blocks[0]
                        else:
                            # 尝试正则匹配最外层的 {}
                            match = re.search(r'(\{.*\})', content, re.DOTALL)
                            if match:
                                json_str = match.group(1)

                    try:
                        return json.loads(json_str)
                    except json.JSONDecodeError:
                        print(f"   ⚠️ JSON 解析失败，原文: {content[:100]}...")
                elif resp.status_code == 503:
                    print(f"   ⏳ AI 服务繁忙 (503), 第 {attempt+1} 次重试...")
                    time.sleep(5)
                else:
                    print(f"   ⚠️ Gemini 响应错误 ({resp.status_code}): {resp.text}")
                    break
        except Exception as e:
            print(f"   ⚠️ AI 分析失败: {e}")
        return None

    def run_full_update(self):
        # 针对各板块的搜索矩阵 (重点强化 2026 时效性 & 多元化洞察)
        # 深度参考 api/update_intel.py 的多维矩阵策略
        search_matrix = [
            # GTC 专题 (多元化战略资讯)
            {"query": "NVIDIA GTC 2026 Jensen Huang keynote highlights", "category": "gtc-insight"},
            {"query": "英伟达 GTC 2026 全球 AI 战略 趋势", "category": "gtc-insight"},
            {"query": "NVIDIA Blackwell Ultra B300 架构 细节 2026", "category": "gtc-insight"},
            {"query": "NVIDIA Omniverse 2026 工业数字孪生 汽车制造", "category": "gtc-insight"},
            {"query": "GTC 2026 AI Agents NIMs 企业级应用", "category": "gtc-insight"},
            {"query": "比亚迪 智能化 GTC 2026 合作", "category": "gtc-insight"},
            {"query": "BYD NVIDIA DRIVE Thor GTC 2026", "category": "gtc-insight"},

            # OpenClaw & 具身智能 (重点强化 - 深度对标 Embodied AI)
            {"query": "OpenClaw Embodied AI Robotics integration Isaac platform", "category": "openclaw"},
            {"query": "智爪大模型 具身智能 机器人 璇玑架构 协同", "category": "openclaw"},
            {"query": "OpenClaw 1.0 2.0 architecture deep learning robotics", "category": "openclaw"},
            {"query": "OpenClaw Isaac Lab 仿真 环境 具身智能", "category": "openclaw"},
            {"query": "特斯拉 Optimus Gen 3 vs OpenClaw 具身智能 对比", "category": "openclaw"},

            # 自动驾驶 (端到端与大模型 - 聚焦行业趋势与技术演进)
            {"query": "Autonomous driving end-to-end foundation models 2026 trends", "category": "autonomous-driving"},
            {"query": "Tesla FSD v14 v15 technical architecture evolution 2026", "category": "autonomous-driving"},
            {"query": "Waymo vs Tesla FSD technical roadmap 2026 comparison", "category": "autonomous-driving"},
            {"query": "华为 乾崑 ADS 4.0 5.0 架构 演进 2026", "category": "autonomous-driving"},
            {"query": "端到端 自动驾驶 世界模型 World Models 行业 洞察", "category": "autonomous-driving"},
            {"query": "L3 L4 自动驾驶 政策 准入 2026 趋势", "category": "autonomous-driving"},
            {"query": "自动驾驶 芯片 算力 平台 演进 2026 NVIDIA Thor vs Huawei", "category": "autonomous-driving"},
            {"query": "Tesla FSD 视觉方案 vs 华为 激光雷达方案 2026 演进", "category": "autonomous-driving"},

            # 定向 OTA 专项搜索 (精准狙击头部新势力)
            {"query": "Tesla FSD V13 V14 推送 更新 最新", "category": "ota"},
            {"query": "理想汽车 OTA 智能座舱 6.0 7.0 路线图", "category": "ota"},
            {"query": "小鹏汽车 天玑系统 XOS 5.5 6.0 升级", "category": "ota"},
            {"query": "蔚来汽车 Banyan 3.0 4.0 智驾 系统更新", "category": "ota"},
            {"query": "小米汽车 SU7 OTA 城市NOA 全量推送 计划", "category": "ota"},
            {"query": "华为 乾崑 ADS 3.5 4.0 OTA 更新 功能", "category": "ota"},

            # 智能座舱
            {"query": "骁龙 8775P 8295 舱驾一体 2026 趋势", "category": "smart-cockpit"},
            {"query": "车载 端侧 大模型 2026 落地 厂商", "category": "smart-cockpit"},
            {"query": "鸿蒙座舱 5.0 原生鸿蒙 汽车 生态 2026", "category": "smart-cockpit"},
            {"query": "AI Agents 车载座舱 2026 落地 场景", "category": "smart-cockpit"},

            # 传感器/前沿 (深度强化 4D Radar/Solid-state LiDAR/Next-gen Perception)
            {"query": "Next-gen 4D Imaging Radar 2026 automotive breakthrough", "category": "sensors"},
            {"query": "Solid-state LiDAR 192线 896线 breakthroughs 2026", "category": "sensors"},
            {"query": "华为 896线 激光雷达 尊界 S800 搭载 技术细节", "category": "sensors"},
            {"query": "Perception Hub next-gen sensor fusion 2026 架构", "category": "sensors"},
            {"query": "特斯拉 4D 毫米波雷达 vs 纯视觉 2026 战略 变化", "category": "sensors"},
            {"query": "固态激光雷达 量产 SOP 2026 厂商 进度", "category": "sensors"}
        ]

        all_items = []
        for task in search_matrix:
            results = self.free_search(task['query'], category=task['category'])
            for res in results:
                # 1. 强力 AI 过滤层
                print(f"   [过滤] {res['title'][:40]}...")
                filter_res = self.ai_filter(res['title'], res['snippet'])
                score = filter_res.get('score', 0)

                # 提高门槛，NotebookLM 级质量要求
                if score < 7.5:
                    print(f"   🗑️ 过滤丢弃 (得分: {score}): {filter_res.get('reason')}")
                    continue

                print(f"   💎 高价值情报 (得分: {score}): {res['title'][:40]}...")

                # 2. AI 深度研判 (仅对通过过滤的数据进行分析)
                analysis = self.ai_analyze(res['title'], res['snippet'], task['category'])

                # 构建最终展示的 snippet (NotebookLM 风格战略简报)
                if analysis:
                    display_snippet = f"【战略执行摘要】\n{analysis.get('executive_summary')}\n\n"
                    display_snippet += f"【战略对策】\n{analysis.get('strategic_countermeasures')}\n\n"
                    display_snippet += f"【行业轨迹】\n{analysis.get('industry_trajectory')}"
                else:
                    # 如果 AI 分析失败，也要确保内容中包含 2026，否则丢弃以保鲜
                    if "2026" not in res['title'] and "2026" not in res['snippet']:
                        continue
                    display_snippet = res['snippet']

                # 提取关键词作为战略标签
                tags = []
                if analysis and isinstance(analysis, dict):
                    tags = analysis.get('keywords', [])

                # 注入 2026 核心标签
                if "2026" in res['title'] or "2026" in res['snippet']:
                    if "2026_TREND" not in tags:
                        tags.append("2026_TREND")

                item = {
                    "title": res['title'],
                    "link": res['link'],
                    "snippet": display_snippet,
                    "category": task['category'],
                    "source": "NotebookLM/Strategic",
                    "quality_score": score,
                    "verified": True if analysis else False,
                    "keywords": tags[:6],
                    "created_at": datetime.now().isoformat(),
                    "published_at": datetime.now().isoformat(),
                    "sentiment": analysis.get('sentiment', 'neutral') if analysis else 'neutral'
                }

                all_items.append(item)
                time.sleep(1.5)
                # 额外映射 (适配现有表结构)
                if "credibility_tier" in res: # 这里的 res 是搜索结果，不是 DB 字段
                    pass

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
