#!/usr/bin/env python3
"""
Gemini 模型支持能力测试
测试 Gemini API 连接和可用模型
"""

import os
import requests
from dotenv import load_dotenv
import json

# 加载环境变量
load_dotenv()

# Gemini 配置
GEMINI_API_URL = os.environ.get("GEMINI_API_URL", "https://new.lemonapi.site/v1")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def test_gemini_connection():
    """测试 Gemini API 连接"""
    print("=" * 60)
    print("🧪 Gemini API 连接测试")
    print("=" * 60)

    print(f"\n📋 配置信息:")
    print(f"   API URL: {GEMINI_API_URL}")
    print(f"   API Key: {'✓ 已配置' if GEMINI_API_KEY else '✗ 未配置'}")
    print(f"   Key 前缀: {GEMINI_API_KEY[:20]}..." if GEMINI_API_KEY else "")

    if not GEMINI_API_KEY:
        print("\n❌ 错误: GEMINI_API_KEY 未配置")
        return False

    # 测试 1: 获取模型列表
    print("\n🔍 测试 1: 获取可用模型列表...")
    try:
        response = requests.get(
            f"{GEMINI_API_URL}/models",
            headers={"Authorization": f"Bearer {GEMINI_API_KEY}"},
            timeout=15
        )
        print(f"   状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            models = data.get("data", [])
            print(f"   ✓ 成功获取 {len(models)} 个模型")

            print("\n📋 可用模型列表:")
            for model in models:
                model_id = model.get("id", "N/A")
                context = model.get("context_length", "N/A")
                print(f"   • {model_id}")
                if context != "N/A":
                    print(f"     上下文: {context:,} tokens")
            return True
        else:
            error = response.json().get("error", {})
            print(f"   ✗ 失败: {error.get('message', response.text)}")
            return False

    except requests.exceptions.Timeout:
        print("   ✗ 请求超时")
        return False
    except Exception as e:
        print(f"   ✗ 错误: {str(e)}")
        return False

def test_gemini_chat():
    """测试 Gemini 聊天功能"""
    print("\n" + "=" * 60)
    print("🧪 Gemini 聊天功能测试")
    print("=" * 60)

    # 测试不同模型
    test_models = [
        "[L]gemini-3-pro-preview",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
    ]

    for model in test_models:
        print(f"\n📝 测试模型: {model}")
        try:
            response = requests.post(
                f"{GEMINI_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GEMINI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "user", "content": "你好，请用一句话介绍自己"}
                    ],
                    "max_tokens": 100
                },
                timeout=15
            )

            if response.status_code == 200:
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                print(f"   ✓ 成功")
                print(f"   回复: {content[:50]}...")
            else:
                error = response.json().get("error", {})
                print(f"   ✗ 失败: {error.get('message', response.text)}")

        except Exception as e:
            print(f"   ✗ 错误: {str(e)}")

def test_gemini_analysis():
    """测试 Gemini 情报分析能力"""
    print("\n" + "=" * 60)
    print("🧪 Gemini 情报分析测试")
    print("=" * 60)

    test_title = "华为发布 ADS 3.0 智能驾驶系统"
    test_snippet = "华为正式发布 ADS 3.0，采用端到端架构，支持城市 NOA 全国开通"

    prompt = f"""作为智能驾驶产业战略分析师，请对以下情报进行深度分析：

【标题】{test_title}
【内容】{test_snippet}

请回答以下三个问题（每点 30-50 字）：

1. 【这是什么？】
简要概括这条情报的核心内容。

2. 【对我们有什么影响？】
分析这条情报对智能驾驶行业的潜在影响。

3. 【建议关注点是什么？】
列出 2-3 个需要持续跟踪的关键点。

请用中文回答，格式如下：
{{
  "what_is_it": "概括内容...",
  "impact": "影响分析...",
  "focus_points": ["关注点1", "关注点2", "关注点3"]
}}"""

    print(f"\n📝 测试数据: {test_title}")

    # 尝试不同模型
    models_to_test = [
        "[L]gemini-3-pro-preview",
        "gemini-2.0-flash",
    ]

    for model in models_to_test:
        print(f"\n🤖 使用模型: {model}")
        try:
            response = requests.post(
                f"{GEMINI_API_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GEMINI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "你是智能驾驶产业战略分析专家。"},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.3,
                    "max_tokens": 800
                },
                timeout=20
            )

            if response.status_code == 200:
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")

                # 解析 JSON
                import re
                json_match = re.search(r'\{[\s\S]*\}', content)
                if json_match:
                    analysis = json.loads(json_match.group())
                    print(f"   ✓ 成功生成分析")
                    print(f"   这是什么: {analysis.get('what_is_it', 'N/A')[:40]}...")
                    return True
                else:
                    print(f"   ⚠ 无法解析 JSON 响应")
                    print(f"   原始响应: {content[:100]}...")
            else:
                error = response.json().get("error", {})
                print(f"   ✗ 失败: {error.get('message', response.text)}")

        except Exception as e:
            print(f"   ✗ 错误: {str(e)}")

    return False

if __name__ == '__main__':
    # 测试连接
    connected = test_gemini_connection()

    if connected:
        # 测试聊天功能
        test_gemini_chat()

        # 测试分析功能
        test_gemini_analysis()
    else:
        print("\n" + "=" * 60)
        print("⚠️ 无法连接到 Gemini API")
        print("=" * 60)
        print("\n可能的原因:")
        print("   1. API Key 无效或已过期")
        print("   2. API 代理地址不正确")
        print("   3. 网络连接问题")
        print("\n建议:")
        print("   - 检查 GEMINI_API_KEY 是否正确")
        print("   - 验证 API 代理地址 (new.lemonapi.site)")
        print("   - 联系 API 提供商确认 Key 状态")
