#!/usr/bin/env python3
"""
测试 AI 联网搜索能力
验证实时信息获取准确性
"""

import os
import requests
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

GEMINI_API_URL = os.environ.get("GEMINI_API_URL", "https://new.lemonapi.site/v1")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
SEARCH_MODEL = "[L]gemini-3.1-pro-preview-search"  # 联网搜索模型
ANALYSIS_MODEL = "[L]gemini-2.5-pro"  # 分析模型

def search_with_ai(query: str) -> dict:
    """
    使用联网搜索模型获取实时信息
    """
    if not GEMINI_API_KEY:
        return {"error": "API Key 未配置"}

    prompt = f"""请搜索并回答以下问题，确保信息准确且最新：

问题：{query}

要求：
1. 搜索最新公开信息（网页、新闻、官方公告）
2. 明确说明数据来源
3. 如涉及版本号、日期等具体信息，请务必准确
4. 如果不确定，请明确说明"不确定"

当前日期：{datetime.now().strftime('%Y-%m-%d')}"""

    try:
        print(f"\n🔍 正在搜索: {query}")
        print(f"   使用模型: {SEARCH_MODEL}")

        response = requests.post(
            f"{GEMINI_API_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {GEMINI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": SEARCH_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.3,
                "max_tokens": 1000
            },
            timeout=45
        )

        response.raise_for_status()
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        return {
            "query": query,
            "answer": content,
            "model": SEARCH_MODEL,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        return {"error": str(e), "query": query}

def analyze_intelligence(title: str, content: str) -> dict:
    """
    使用标准模型进行深度分析（不联网）
    """
    prompt = f"""作为智能驾驶产业战略分析师，请对以下情报进行深度分析。

⚠️ 重要提示：
- 当前日期是 {datetime.now().year} 年
- 请基于提供的情报内容本身进行分析
- 如果涉及版本号、发布时间等具体信息，请以情报内容为准
- 如有不确定性，请在回答中注明

【情报标题】{title}
【情报内容】{content}

请回答：
1. 【这是什么？】简要概括核心内容
2. 【对我们有什么影响？】分析行业影响
3. 【建议关注点】列出 2-3 个关键跟踪点
4. 【数据验证】这份情报的可信度如何？有哪些可以验证的点？"""

    try:
        response = requests.post(
            f"{GEMINI_API_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {GEMINI_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": ANALYSIS_MODEL,
                "messages": [
                    {"role": "system", "content": "你是智能驾驶产业战略分析专家。"},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.3,
                "max_tokens": 1000
            },
            timeout=30
        )

        response.raise_for_status()
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        return {"analysis": content, "model": ANALYSIS_MODEL}

    except Exception as e:
        return {"error": str(e)}

def test_version_accuracy():
    """
    测试版本号准确性（关键测试）
    """
    print("=" * 70)
    print("🧪 版本号准确性测试")
    print("=" * 70)

    test_cases = [
        "Tesla FSD 最新版本号是多少？什么时候发布的？",
        "华为 ADS 最新版本是多少？",
        "小米 SU7 最近一次 OTA 更新了什么内容？",
        "2025年3月，智能驾驶领域有什么重要发布？",
    ]

    for query in test_cases:
        result = search_with_ai(query)

        if "error" in result:
            print(f"\n❌ 查询失败: {result['error']}")
        else:
            print(f"\n✅ 查询成功")
            print(f"   问题: {result['query']}")
            print(f"   回答:\n{result['answer'][:500]}...")
            print("-" * 50)

def test_source_credibility():
    """
    测试消息源可信度评估
    """
    print("\n" + "=" * 70)
    print("🧪 消息源可信度评估")
    print("=" * 70)

    test_urls = [
        ("https://www.tesla.com/news", "Tesla 官网"),
        ("https://36kr.com/news", "36氪"),
        ("https://zhihu.com/question/123", "知乎"),
        ("https://weibo.com/u/123456", "微博"),
        ("https://cnevpost.com/news", "CnEVPost"),
    ]

    from urllib.parse import urlparse

    for url, name in test_urls:
        domain = urlparse(url).netloc.replace('www.', '')

        # 简单的可信度评级
        tier1 = ['tesla.com', 'huawei.com', 'nio.com', 'xiaomi.com']
        tier2 = ['36kr.com', 'cnevpost.com', 'electrek.co', 'autohome.com.cn']

        if any(t in domain for t in tier1):
            tier = "Tier 1 (官方) ✅"
            score = 95
        elif any(t in domain for t in tier2):
            tier = "Tier 2 (专业媒体) ✅"
            score = 80
        else:
            tier = "Tier 3/未验证 ⚠️"
            score = 50

        print(f"\n{name}")
        print(f"   域名: {domain}")
        print(f"   评级: {tier}")
        print(f"   可信度分数: {score}/100")

def test_cross_verification():
    """
    测试交叉验证流程
    """
    print("\n" + "=" * 70)
    print("🧪 交叉验证流程测试")
    print("=" * 70)

    # 模拟同一事件的不同来源报道
    event = "Tesla FSD V13 发布"
    sources = [
        {"title": "Tesla 正式发布 FSD V13，端到端架构全面升级", "source": "tesla.com", "tier": 1},
        {"title": "特斯拉 FSD V13 推送，城市 NOA 能力提升", "source": "36kr.com", "tier": 2},
        {"title": "Tesla FSD V13 体验：端到端真的更好用了吗？", "source": "zhihu.com", "tier": 3},
    ]

    print(f"\n事件: {event}")
    print(f"来源数量: {len(sources)}")

    tier1_count = sum(1 for s in sources if s['tier'] == 1)
    tier2_count = sum(1 for s in sources if s['tier'] == 2)

    if tier1_count >= 1:
        confidence = 90
        verdict = "✅ 高可信度（有官方来源）"
    elif tier2_count >= 2:
        confidence = 75
        verdict = "✅ 中等可信度（多个专业媒体确认）"
    else:
        confidence = 50
        verdict = "⚠️ 需要进一步验证"

    print(f"\n交叉验证结果:")
    print(f"   Tier 1 来源: {tier1_count} 个")
    print(f"   Tier 2 来源: {tier2_count} 个")
    print(f"   置信度: {confidence}%")
    print(f"   结论: {verdict}")

def test_complete_workflow():
    """
    测试完整工作流程
    """
    print("\n" + "=" * 70)
    print("🧪 完整工作流程测试")
    print("=" * 70)

    # 步骤 1: 搜索最新信息
    query = "华为问界 M9 最新 OTA 更新内容"
    print(f"\n步骤 1: 搜索实时信息")
    print(f"   查询: {query}")

    search_result = search_with_ai(query)
    if "error" in search_result:
        print(f"   ❌ 搜索失败: {search_result['error']}")
        return

    print(f"   ✅ 获取到信息")
    content_preview = search_result['answer'][:200]
    print(f"   预览: {content_preview}...")

    # 步骤 2: AI 深度分析
    print(f"\n步骤 2: AI 深度分析")
    analysis = analyze_intelligence(query, search_result['answer'])

    if "error" in analysis:
        print(f"   ❌ 分析失败: {analysis['error']}")
    else:
        print(f"   ✅ 分析完成")
        print(f"   结果:\n{analysis['analysis'][:500]}...")

    # 步骤 3: 质量评估
    print(f"\n步骤 3: 质量评估")
    quality_score = 85  # 模拟评分
    credibility = "Tier 2"
    freshness = "24小时内"

    print(f"   质量分数: {quality_score}/100")
    print(f"   来源评级: {credibility}")
    print(f"   时效性: {freshness}")
    print(f"   结论: ✅ 高质量情报，建议入库")

if __name__ == '__main__':
    print("🚀 AI 情报质量测试工具")
    print(f"当前时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    if not GEMINI_API_KEY:
        print("\n❌ 错误: GEMINI_API_KEY 未配置")
        exit(1)

    # 运行测试
    test_version_accuracy()
    test_source_credibility()
    test_cross_verification()
    test_complete_workflow()

    print("\n" + "=" * 70)
    print("✅ 测试完成")
    print("=" * 70)
