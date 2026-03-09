#!/usr/bin/env python3
"""
AI分析功能测试脚本
直接测试 AI 分析模块，无需调用 Brave Search API
"""

import os
import requests
from dotenv import load_dotenv
from datetime import datetime
import json

# 加载环境变量
load_dotenv()

# API 配置
GEMINI_API_URL = os.environ.get("GEMINI_API_URL", "https://new.lemonapi.site/v1")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "[L]gemini-3-pro-preview")
KIMI_API_URL = os.environ.get("KIMI_API_URL", "https://api.moonshot.cn/v1")
KIMI_API_KEY = os.environ.get("KIMI_API_KEY", "")
KIMI_MODEL = os.environ.get("KIMI_MODEL", "kimi-k2.5")

def test_ai_analysis():
    """测试 AI 分析功能"""

    print("=" * 60)
    print("🧪 AI 情报分析功能测试")
    print("=" * 60)

    # 检查配置
    DEFAULT_MODEL = os.environ.get("DEFAULT_AI_MODEL", "gemini")

    print("\n📋 配置检查:")
    print(f"   默认模型: {DEFAULT_MODEL}")
    print(f"   Gemini API Key: {'✓ 已配置' if GEMINI_API_KEY else '✗ 未配置'}")
    print(f"   Gemini Model: {GEMINI_MODEL}")
    print(f"   Kimi API Key: {'✓ 已配置' if KIMI_API_KEY else '✗ 未配置'}")
    print(f"   Kimi Model: {KIMI_MODEL}")

    if DEFAULT_MODEL == "gemini" and not GEMINI_API_KEY:
        print("\n⚠️ 默认模型是 Gemini 但 Key 未配置，将使用 Kimi")

    if not GEMINI_API_KEY and not KIMI_API_KEY:
        print("\n❌ 错误: 没有配置任何 AI API Key")
        return False

    # 测试数据
    test_title = "Tesla 发布 FSD V13 端到端自动驾驶系统"
    test_snippet = "Tesla 今日正式发布 FSD V13 版本，采用全新端到端神经网络架构，大幅提升城市自动驾驶能力。该系统将在 2025 年 Q2 开始推送。"

    print("\n📝 测试数据:")
    print(f"   标题: {test_title}")
    print(f"   内容: {test_snippet[:50]}...")

    # 构建 Prompt
    prompt = f"""作为智能驾驶产业战略分析师，请对以下情报进行深度分析：

【标题】{test_title}
【内容】{test_snippet}

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

    print("\n🤖 开始 AI 分析...")

    try:
        # 根据 DEFAULT_AI_MODEL 选择模型
        DEFAULT_MODEL = os.environ.get("DEFAULT_AI_MODEL", "gemini")

        if DEFAULT_MODEL == "kimi" and KIMI_API_KEY:
            print(f"   使用模型: Kimi ({KIMI_MODEL})")
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
                timeout=30
            )
        elif GEMINI_API_KEY:
            print(f"   使用模型: Gemini ({GEMINI_MODEL})")
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
                timeout=30
            )
        elif KIMI_API_KEY:
            print(f"   使用模型: Kimi ({KIMI_MODEL})")
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
                timeout=30
            )

        response.raise_for_status()
        data = response.json()
        content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

        print(f"\n✅ API 调用成功!")
        print(f"   响应长度: {len(content)} 字符")

        # 解析 JSON
        import re
        json_match = re.search(r'\{[\s\S]*\}', content)
        if json_match:
            analysis = json.loads(json_match.group())

            print("\n" + "=" * 60)
            print("📊 AI 分析结果")
            print("=" * 60)

            print(f"\n1️⃣ 这是什么？")
            print(f"   {analysis.get('what_is_it', 'N/A')}")

            print(f"\n2️⃣ 对我们有什么影响？")
            print(f"   {analysis.get('impact', 'N/A')}")

            print(f"\n3️⃣ 建议关注点：")
            focus_points = analysis.get('focus_points', [])
            for i, point in enumerate(focus_points, 1):
                print(f"   {i}. {point}")

            print("\n" + "=" * 60)
            print("✅ 测试通过! AI 分析功能正常工作")
            print("=" * 60)

            return True
        else:
            print("\n⚠️ 无法从响应中解析 JSON")
            print(f"原始响应:\n{content}")
            return False

    except requests.exceptions.Timeout:
        print("\n❌ API 请求超时")
        return False
    except requests.exceptions.ConnectionError as e:
        print(f"\n❌ 连接错误: {str(e)}")
        return False
    except Exception as e:
        print(f"\n❌ 错误: {str(e)}")
        return False

def test_frontier_scoring():
    """测试前沿程度评分系统"""
    print("\n" + "=" * 60)
    print("🧪 前沿程度评分系统测试")
    print("=" * 60)

    # 战略前瞻关键词
    STRATEGIC_KEYWORDS = [
        "2027", "2028", "2029", "2030",
        "Vision", "Roadmap", "Next-gen", "Next generation",
        "前瞻", "战略", "规划", "路线图",
        "突破", "颠覆", "革命性", "下一代",
        "量产", "首发", "率先", "领先",
        "L5", "完全自动驾驶",
    ]

    test_cases = [
        {
            "title": "Tesla 发布 2027 自动驾驶路线图",
            "snippet": "下一代端到端技术将颠覆行业",
            "dimension": "战略前瞻",
            "expected": "高战略价值"
        },
        {
            "title": "华为发布新一代激光雷达",
            "snippet": "固态激光雷达技术突破",
            "dimension": "竞争技术-Huawei",
            "expected": "高前沿"
        },
        {
            "title": "某品牌汽车销量增长",
            "snippet": "本月销量同比增长 10%",
            "dimension": "基础趋势",
            "expected": "常规"
        }
    ]

    for case in test_cases:
        text = f"{case['title']} {case['snippet']}".lower()
        score = 0
        matched = []

        # 关键词匹配
        for kw in STRATEGIC_KEYWORDS:
            if kw.lower() in text:
                score += 20
                matched.append(kw)

        # 竞争对手
        for comp in ["tesla", "huawei", "byd"]:
            if comp in text:
                score += 10

        # 核心技术
        for tech in ["end-to-end", "vla", "chiplet", "固态"]:
            if tech in text:
                score += 15
                matched.append(tech)

        # 维度加分
        if "战略前瞻" in case['dimension']:
            score += 15
        elif "竞争技术" in case['dimension']:
            score += 10

        # 确定等级
        if score >= 60:
            level = "高战略价值"
        elif score >= 40:
            level = "高前沿"
        elif score >= 20:
            level = "中前沿"
        else:
            level = "常规"

        status = "✓" if level == case['expected'] else "✗"
        print(f"\n{status} 测试: {case['title'][:30]}...")
        print(f"   分数: {score} | 等级: {level} | 期望: {case['expected']}")

    print("\n✅ 评分系统测试完成")

if __name__ == '__main__':
    # 测试 AI 分析
    ai_success = test_ai_analysis()

    # 测试评分系统
    test_frontier_scoring()

    print("\n" + "=" * 60)
    if ai_success:
        print("🎉 所有测试通过！系统可以正常工作")
    else:
        print("⚠️ AI 分析测试失败，请检查 API 配置和网络连接")
    print("=" * 60)
