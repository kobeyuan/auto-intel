#!/usr/bin/env python3
"""
系统状态全面检查
分析情报时效性、数据质量、API 可用性
"""

import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
BRAVE_API_KEY = os.environ.get("BRAVE_API_KEY")

def check_database():
    """检查数据库状态"""
    print("=" * 70)
    print("📊 数据库情报时效性检查")
    print("=" * 70)

    try:
        # 查询最近情报
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/industry_intelligence",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Accept": "application/json"
            },
            params={
                "select": "title,category,collected_at,frontier_level,ai_analyzed",
                "order": "collected_at.desc",
                "limit": 10
            },
            timeout=10
        )

        if response.status_code == 200:
            data = response.json()
            print(f"\n✓ 成功获取 {len(data)} 条最近情报\n")

            now = datetime.now()

            for item in data:
                collected = item.get('collected_at', '')
                title = item.get('title', 'N/A')[:45]
                category = item.get('category', 'N/A')
                level = item.get('frontier_level', 'N/A')
                ai = '✓AI' if item.get('ai_analyzed') else '✗AI'

                # 计算时效性
                if collected:
                    try:
                        collected_dt = datetime.fromisoformat(collected.replace('Z', '+00:00'))
                        days_ago = (now - collected_dt.replace(tzinfo=None)).days
                        fresh = "🟢" if days_ago < 1 else "🟡" if days_ago < 3 else "🔴"
                    except:
                        days_ago = "?"
                        fresh = "⚪"
                else:
                    days_ago = "?"
                    fresh = "⚪"

                print(f"{fresh} {collected[:10] if collected else 'N/A'} ({days_ago}天前) | {category[:10]:<10} | {level[:6]:<6} | {ai} | {title}...")

            # 统计
            print(f"\n📈 统计信息:")

            # 查询总数
            count_resp = requests.get(
                f"{SUPABASE_URL}/rest/v1/industry_intelligence",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Accept": "application/json",
                    "Prefer": "count=exact"
                },
                params={"limit": 0},
                timeout=10
            )

            total = count_resp.headers.get('content-range', '0').split('/')[-1]
            print(f"   总情报数: {total}")

            # 查询最近24小时
            yesterday = (now - timedelta(days=1)).isoformat()
            recent_resp = requests.get(
                f"{SUPABASE_URL}/rest/v1/industry_intelligence",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Accept": "application/json",
                    "Prefer": "count=exact"
                },
                params={
                    "collected_at": f"gte.{yesterday}",
                    "limit": 0
                },
                timeout=10
            )
            recent_count = recent_resp.headers.get('content-range', '0').split('/')[-1]
            print(f"   最近24小时: {recent_count}")

            # AI分析统计
            ai_resp = requests.get(
                f"{SUPABASE_URL}/rest/v1/industry_intelligence",
                headers={
                    "apikey": SUPABASE_KEY,
                    "Authorization": f"Bearer {SUPABASE_KEY}",
                    "Accept": "application/json",
                    "Prefer": "count=exact"
                },
                params={"ai_analyzed": "eq.true", "limit": 0},
                timeout=10
            )
            ai_count = ai_resp.headers.get('content-range', '0').split('/')[-1]
            print(f"   AI分析数: {ai_count}")

        else:
            print(f"✗ 查询失败: {response.status_code}")
            print(f"   {response.text[:200]}")

    except Exception as e:
        print(f"✗ 错误: {str(e)}")

def check_api_status():
    """检查各 API 可用性"""
    print("\n" + "=" * 70)
    print("🔌 API 可用性检查")
    print("=" * 70)

    # 1. Supabase
    print("\n1. Supabase 数据库:")
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/",
            headers={"apikey": SUPABASE_KEY},
            timeout=5
        )
        if response.status_code == 200:
            print("   ✓ 正常")
        else:
            print(f"   ✗ 异常 ({response.status_code})")
    except Exception as e:
        print(f"   ✗ 错误: {str(e)}")

    # 2. Brave Search
    print("\n2. Brave Search API:")
    if not BRAVE_API_KEY:
        print("   ✗ API Key 未配置")
    else:
        try:
            response = requests.get(
                "https://api.search.brave.com/res/v1/web/search",
                headers={"X-Subscription-Token": BRAVE_API_KEY},
                params={"q": "test", "count": 1},
                timeout=10
            )
            if response.status_code == 200:
                print("   ✓ 正常")
            elif response.status_code == 401:
                print("   ✗ API Key 无效 (401)")
            elif response.status_code == 403:
                print("   ✗ 访问被禁止 (403) - 可能被封禁")
            else:
                print(f"   ✗ 异常 ({response.status_code})")
        except requests.exceptions.Timeout:
            print("   ✗ 连接超时 - 网络限制或被拦截")
        except requests.exceptions.SSLError:
            print("   ✗ SSL 错误 - 证书问题或中间人拦截")
        except Exception as e:
            print(f"   ✗ 错误: {str(e)[:50]}")

    # 3. Gemini
    print("\n3. Gemini API:")
    gemini_key = os.environ.get("GEMINI_API_KEY")
    gemini_url = os.environ.get("GEMINI_API_URL")
    if not gemini_key:
        print("   ✗ API Key 未配置")
    else:
        try:
            response = requests.get(
                f"{gemini_url}/models",
                headers={"Authorization": f"Bearer {gemini_key}"},
                timeout=10
            )
            if response.status_code == 200:
                models = response.json().get("data", [])
                print(f"   ✓ 正常 ({len(models)} 个模型可用)")
            else:
                print(f"   ✗ 异常 ({response.status_code})")
        except Exception as e:
            print(f"   ✗ 错误: {str(e)[:50]}")

    # 4. Kimi
    print("\n4. Kimi API:")
    kimi_key = os.environ.get("KIMI_API_KEY")
    if not kimi_key:
        print("   ✗ API Key 未配置")
    else:
        try:
            response = requests.get(
                "https://api.moonshot.cn/v1/models",
                headers={"Authorization": f"Bearer {kimi_key}"},
                timeout=10
            )
            if response.status_code == 200:
                models = response.json().get("data", [])
                print(f"   ✓ 正常 ({len(models)} 个模型可用)")
            else:
                print(f"   ✗ 异常 ({response.status_code})")
        except Exception as e:
            print(f"   ✗ 错误: {str(e)[:50]}")

def analyze_data_freshness():
    """分析数据时效性问题"""
    print("\n" + "=" * 70)
    print("⚠️  数据时效性问题分析")
    print("=" * 70)

    print("""
基于检查结果，可能存在的时效性问题：

1. 【Brave Search API 不可用】
   状态: 连接超时/SSL错误
   原因: 当前网络环境限制访问 api.search.brave.com
   影响: 无法自动采集最新情报，数据库数据可能过时
   修复方案:
   - 方案A: 更换网络环境 (部署到 Vercel/Cloudflare)
   - 方案B: 使用代理/VPN
   - 方案C: 更换搜索 API (如 SerpAPI、Google Custom Search)

2. 【AI 模型知识截止日期】
   问题: Gemini 3.1 Pro 回答 FSD V12 是最新版本
   实际: FSD V13 已于 2025 年初发布
   原因: 模型训练数据有截止日期
   修复方案:
   - 通过搜索 API 获取实时信息补充
   - 在 Prompt 中明确提示"请基于当前最新公开信息"
   - 使用联网搜索功能的模型 (如 gemini-3.1-pro-preview-search)

3. 【数据采集策略】
   问题: 当前搜索词矩阵固定为"2026"年份
   建议: 动态生成当前年份/季度的搜索词
""")

if __name__ == '__main__':
    check_database()
    check_api_status()
    analyze_data_freshness()

    print("\n" + "=" * 70)
    print("📋 建议修复步骤")
    print("=" * 70)
    print("""
1. 立即修复:
   - 部署到 Vercel 等有正常网络访问的环境
   - 或使用带联网功能的 Gemini 模型

2. 优化搜索策略:
   - 更新搜索词矩阵，移除固定年份限制
   - 添加更多实时性关键词 ("刚刚发布", "今日", "最新")

3. 增强 AI 分析:
   - 使用联网模型版本 (-search 后缀)
   - 在 Prompt 中添加时效性提示
""")
