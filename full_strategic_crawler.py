import os
import requests
import time
import json
import re
import feedparser
from datetime import datetime
from typing import List, Dict, Any
from dotenv import load_dotenv
from supabase import create_client, Client
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse

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
        if HTTP_PROXY and os.environ.get("USE_PROXY", "true").lower() == "true":
            self.session.proxies = {"http": HTTP_PROXY, "https": HTTP_PROXY}
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        })

        # 加载数据源配置
        with open('config/data_sources.json', 'r') as f:
            self.config = json.load(f)

    def _extract_image_from_html(self, html: str, base_url: str) -> str:
        """从 HTML 中提取最可能的封面图"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            # 1. 尝试 og:image
            og_image = soup.find('meta', property='og:image')
            if og_image and og_image.get('content'):
                return urljoin(base_url, og_image['content'])

            # 2. 尝试 twitter:image
            twitter_image = soup.find('meta', name='twitter:image')
            if twitter_image and twitter_image.get('content'):
                return urljoin(base_url, twitter_image['content'])

            # 3. 尝试文章主体内的第一张大图 (简单启发式)
            for img in soup.find_all('img'):
                src = img.get('src')
                if not src: continue
                # 排除小图标
                width = img.get('width')
                height = img.get('height')
                if width and int(width) < 100: continue
                if height and int(height) < 100: continue
                return urljoin(base_url, src)
        except:
            pass
        return ""

    def scrape_official_sites(self) -> List[Dict[str, Any]]:
        """抓取官方站点"""
        all_items = []
        sources = self.config['sources']['official_sites']['sources']

        for source in sources:
            if not source.get('enabled') or not source.get('scraping', {}).get('enabled'):
                continue

            print(f"🌐 正在抓取官方源: {source['name']}")
            target_url = source['urls'].get('news') or source['urls'].get('homepage')
            if not target_url: continue

            try:
                resp = self.session.get(target_url, timeout=20)
                resp.raise_for_status()
                soup = BeautifulSoup(resp.text, 'html.parser')

                selector = source['scraping'].get('selector', 'a')
                # 这是一个简化的通用抓取逻辑，实际可能需要针对每个 site 定制
                # 但为了系统健壮性，我们先实现一个基于选择器的通用逻辑
                found_links = []
                for element in soup.select(selector):
                    link_tag = element if element.name == 'a' else element.find('a')
                    if link_tag and link_tag.get('href'):
                        href = urljoin(target_url, link_tag['href'])
                        title = element.get_text().strip()
                        if len(title) > 5:
                            found_links.append({"title": title, "link": href})

                # 对发现的链接进行深度抓取（获取图片和详情）
                for link_info in found_links[:5]:
                    item = self.process_article(link_info['link'], link_info['title'], source)
                    if item:
                        all_items.append(item)
                    time.sleep(1)
            except Exception as e:
                print(f"   ⚠️ 抓取 {source['name']} 失败: {e}")

        return all_items

    def collect_rss_feeds(self) -> List[Dict[str, Any]]:
        """收集 RSS 源"""
        all_items = []
        # 合并媒体和开源社区的 RSS
        rss_sources = []
        if 'media_rss' in self.config['sources']:
            rss_sources.extend(self.config['sources']['media_rss']['sources'])
        if 'github_community' in self.config['sources']:
            rss_sources.extend(self.config['sources']['github_community']['sources'])

        for source in rss_sources:
            if not source.get('enabled') or not source.get('rss', {}).get('enabled'):
                continue

            print(f"📡 正在收集 RSS: {source['name']}")
            feed_url = source['rss']['url']
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:10]:
                    title = entry.title
                    link = entry.link
                    published = entry.get('published') or entry.get('updated')

                    # 尝试从 entry 中直接提取图片
                    image_url = ""
                    if 'media_content' in entry:
                        image_url = entry.media_content[0]['url']
                    elif 'links' in entry:
                        for l in entry.links:
                            if 'image' in l.get('type', ''):
                                image_url = l.href
                                break

                    item = self.process_article(link, title, source, entry.get('summary', ''), image_url)
                    if item:
                        all_items.append(item)
                    time.sleep(0.5)
            except Exception as e:
                print(f"   ⚠️ RSS {source['name']} 失败: {e}")

        return all_items

    def process_article(self, link: str, title: str, source_config: Dict, summary: str = "", image_url: str = "") -> Dict[str, Any]:
        """处理单篇文章：抓取图片、AI过滤、AI分析"""
        try:
            # 如果没有图片，尝试从详情页抓取
            if not image_url:
                resp = self.session.get(link, timeout=15)
                if resp.status_code == 200:
                    image_url = self._extract_image_from_html(resp.text, link)
                    if not summary:
                        soup = BeautifulSoup(resp.text, 'html.parser')
                        # 提取前 500 个字符作为摘要
                        summary = soup.get_text().strip()[:500]

            # 1. AI 过滤
            filter_res = self.ai_filter(title, summary)
            score = filter_res.get('score', 0)
            if score < 7.5:
                return None

            # 2. AI 分析
            analysis = self.ai_analyze(title, summary, source_config.get('category', 'general'))

            # 构建 snippet
            if analysis:
                display_snippet = f"【战略执行摘要】\n{analysis.get('executive_summary')}\n\n"
                display_snippet += f"【战略对策】\n{analysis.get('strategic_countermeasures')}\n\n"
                display_snippet += f"【行业轨迹】\n{analysis.get('industry_trajectory')}"
            else:
                display_snippet = summary

            tags = analysis.get('keywords', []) if analysis else []

            return {
                "title": title,
                "link": link,
                "snippet": display_snippet,
                "category": source_config.get('category', 'general'),
                "source": source_config['name'],
                "image_url": image_url,
                "quality_score": score,
                "verified": True if analysis else False,
                "keywords": tags[:6],
                "created_at": datetime.now().isoformat(),
                "published_at": datetime.now().isoformat(),
                "sentiment": analysis.get('sentiment', 'neutral') if analysis else 'neutral'
            }
        except Exception as e:
            print(f"   ⚠️ 处理文章失败 {link}: {e}")
            return None

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
           - 单一零部件常规发布、基础财报数据、普通媒体试驾。
        2. 7-8分 (核心战略情报，允许入库):
           - 关键技术实质性突破、重点准入法规落地。
        3. 9-10分 (顶级行业核弹，战略聚焦):
           - 行业范式转移、全球大厂底层战略入局。

        请严格以 JSON 格式输出:
        {{
            "score": 评分数字,
            "reason": "简短的打分理由"
        }}
        """
        try:
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
                content = resp.json()['choices'][0]['message']['content']
                match = re.search(r'(\{.*\})', content, re.DOTALL)
                if match:
                    return json.loads(match.group(1))
        except:
            pass
        return {"score": 5, "reason": "分析异常"}

    def ai_analyze(self, title: str, snippet: str, category: str) -> Dict[str, Any]:
        """AI 深度分析"""
        if not GEMINI_API_KEY:
            return None

        prompt = f"""
        作为比亚迪战略研究员，请对以下资讯进行 NotebookLM 级别的“战略深度研判”。
        类别: {category}
        标题: {title}
        摘要: {snippet}

        请严格以 JSON 格式输出：
        {{
            "executive_summary": "一句话概括本质及对比亚迪的冲击。",
            "strategic_countermeasures": "比亚迪应采取的具体行动点。",
            "industry_trajectory": "如何改变未来 12-24 个月的竞争范式。",
            "sentiment": "positive/neutral/negative",
            "keywords": ["关键词1", "关键词2"]
        }}
        """
        try:
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
                content = resp.json()['choices'][0]['message']['content']
                match = re.search(r'(\{.*\})', content, re.DOTALL)
                if match:
                    return json.loads(match.group(1))
        except:
            pass
        return None

    def run_full_update(self):
        print("🚀 启动混合模式情报采集引擎...")

        all_items = []

        # 1. 抓取官方站点
        all_items.extend(self.scrape_official_sites())

        # 2. 收集 RSS 源
        all_items.extend(self.collect_rss_feeds())

        if all_items:
            # 去重
            unique_items = {item['link']: item for item in all_items}.values()
            try:
                supabase.table("industry_intelligence").upsert(list(unique_items), on_conflict="link").execute()
                print(f"✅ 更新完成！存入 {len(unique_items)} 条核心情报。")
            except Exception as e:
                print(f"❌ 数据库写入失败: {e}")
        else:
            print("📭 本次未发现高价值情报。")

if __name__ == "__main__":
    crawler = IntelligenceCrawler()
    crawler.run_full_update()
