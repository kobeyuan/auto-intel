import os
import requests
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from bs4 import BeautifulSoup

load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
HTTP_PROXY = os.environ.get("HTTP_PROXY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
GEMINI_API_URL = os.environ.get("GEMINI_API_URL", "https://new.lemonapi.site/v1")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "[L]gemini-3-pro-preview")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_session():
    session = requests.Session()
    if HTTP_PROXY:
        session.proxies = {"http": HTTP_PROXY, "https": HTTP_PROXY}
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    })
    return session

def search_free_duckduckgo(query):
    """使用 DuckDuckGo HTML 版本的免费搜索（无需 API Key）"""
    print(f"正在通过 DuckDuckGo 搜索: {query}")
    session = get_session()
    url = "https://html.duckduckgo.com/html/"
    try:
        response = session.post(url, data={"q": query}, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        results = []
        for i, result in enumerate(soup.find_all('div', class_='result')):
            if i >= 5: break
            title_tag = result.find('a', class_='result__a')
            snippet_tag = result.find('a', class_='result__snippet')
            if title_tag:
                results.append({
                    "title": title_tag.get_text().strip(),
                    "link": title_tag['href'],
                    "snippet": snippet_tag.get_text().strip() if snippet_tag else ""
                })
        return results
    except Exception as e:
        print(f"免费搜索失败: {e}")
        return []

def analyze_gtc_strategic(title, snippet):
    """从比亚迪产品规划与战略部的视角进行 AI 深度洞察"""
    if not GEMINI_API_KEY:
        print("   ⚠️ GEMINI_API_KEY 未配置")
        return None

    prompt = f"""
    作为比亚迪【智能化产品规划部 & 战略部】的高级分析师，请对以下 NVIDIA GTC 2026 行业资讯进行战略评估。

    【资讯标题】: {title}
    【内容摘要】: {snippet}

    请输出以下维度的深度洞察：
    1. 【核心技术研判】: 这项发布代表了什么底层技术趋势？
    2. 【对比亚迪的影响】: 对我们现有的璇玑架构、天神之眼或未来 DRIVE Thor 的落地有何具体启示？
    3. 【竞争/合作对策】: 我们应该如何调整与 NVIDIA 的合作深度，或者如何应对竞品利用此技术带来的威胁？

    请严格以 JSON 格式输出，不要包含任何 Markdown 代码块标签:
    {{
        "what_is_it": "技术研判内容...",
        "impact": "对比亚迪的具体影响...",
        "focus_points": ["对策1", "对策2"]
    }}
    """

    try:
        resp = requests.post(
            f"{GEMINI_API_URL}/chat/completions",
            headers={"Authorization": f"Bearer {GEMINI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": GEMINI_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2
            },
            timeout=30
        )
        resp.raise_for_status()
        data = resp.json()
        if 'choices' not in data:
            print(f"   ❌ AI 响应异常: {data}")
            return None

        content = data['choices'][0]['message']['content']
        import json
        import re
        # 尝试提取 JSON
        match = re.search(r'\{.*\}', content, re.DOTALL)
        if match:
            return json.loads(match.group())
    except Exception as e:
        print(f"   ⚠️ AI 战略分析失败: {e}")
    return None

def run_gtc_strategic_update():
    queries = [
        "NVIDIA GTC 2026 key announcements automotive news",
        "NVIDIA DRIVE Thor Blackwell architecture release date",
        "NVIDIA GTC 2026 humanoid robotics AI manufacturing",
        "NVIDIA Blackwell Ultra GPU automotive cloud",
        "NVIDIA GTC 2026 digital twin Omniverse automotive"
    ]

    all_news = []
    for q in queries:
        results = search_free_duckduckgo(q)
        for res in results:
            print(f"分析中: {res['title'][:30]}...")
            analysis = analyze_gtc_strategic(res['title'], res['snippet'])

            # 统一字段名以匹配 Supabase 实际架构
            # 这里的 snippet 采用了特殊的【AI分析】格式以便前端解析
            final_snippet = res['snippet']
            if analysis:
                final_snippet = f"【AI分析】\n这是什么？ {analysis.get('what_is_it')}\n有什么影响？ {analysis.get('impact')}\n关注要点：\n"
                for i, p in enumerate(analysis.get('focus_points', []), 1):
                    final_snippet += f"{i}. {p}\n"

            item = {
                "title": res['title'],
                "link": res['link'],
                "snippet": final_snippet,
                "category": "gtc-insight",
                "source": "GTC/Strategic",
                "quality_score": 98,
                "created_at": datetime.now().isoformat(),
                "verified": True
            }
            all_news.append(item)
            time.sleep(1)

    if all_news:
        try:
            # 过滤掉重复链接
            unique_news = {item['link']: item for item in all_news}.values()
            supabase.table("industry_intelligence").upsert(list(unique_news), on_conflict="link").execute()
            print(f"成功存入 {len(unique_news)} 条 GTC 战略洞察情报")
        except Exception as e:
            print(f"数据库存入失败: {e}")

if __name__ == "__main__":
    run_gtc_strategic_update()
