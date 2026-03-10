# 情报系统时效性、准确性、可靠性解决方案

## 一、问题诊断

### 当前痛点

| 问题 | 影响 | 严重程度 |
|------|------|----------|
| Brave API 不可用 | 无法自动采集最新情报 | 🔴 高 |
| AI 模型训练数据过时 | 回答可能基于旧信息（如 FSD V12 vs V14） | 🔴 高 |
| 消息源未验证 | 可能收录不准确或虚假信息 | 🟡 中 |
| 缺乏交叉验证 | 单一来源信息无法确认真实性 | 🟡 中 |

---

## 二、解决方案架构

### 2.1 多源数据采集策略

由于 Brave API 在当前网络环境受限，采用**多源互补采集**方案：

```
┌─────────────────────────────────────────────────────────────┐
│                    情报采集层                               │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│  官方渠道   │  媒体RSS    │  社交媒体   │   手动录入      │
├─────────────┼─────────────┼─────────────┼─────────────────┤
│ Tesla官网   │ 36氪RSS     │ 微博API     │  前端录入界面   │
│ 华为官网    │ 品玩RSS     │ Twitter API │  微信机器人     │
│ 蔚来APP     │ CnEVPost    │             │  邮件订阅       │
│ 小鹏社区    │ Electrek    │             │                 │
└─────────────┴─────────────┴─────────────┴─────────────────┘
                           │
                    ┌──────▼──────┐
                    │  数据清洗    │
                    │  去重/格式化 │
                    └──────┬──────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      ┌──────────┐  ┌──────────┐  ┌──────────┐
      │ 质量评估  │  │ AI分析   │  │ 交叉验证  │
      │ 时效性评分 │  │ 联网搜索 │  │ 多源确认  │
      └──────────┘  └──────────┘  └──────────┘
```

### 2.2 联网搜索 AI 模型配置

使用支持**实时联网搜索**的模型版本：

```env
# .env 配置

# 标准模型（用于分析）
GEMINI_MODEL=[L]gemini-2.5-pro

# 联网搜索模型（用于获取实时信息）
GEMINI_SEARCH_MODEL=[L]gemini-3.1-pro-preview-search
```

**模型功能对比：**

| 模型 | 联网搜索 | 适用场景 | 响应速度 |
|------|---------|---------|----------|
| gemini-2.5-pro | ❌ | 深度分析、推理 | 快 |
| gemini-3.1-pro-preview-search | ✅ | 实时信息查询 | 中等 |
| kimi-k2.5 | ❌ | 备选分析 | 快 |

### 2.3 消息源可信度评级

已创建 `/src/lib/intelligence-quality.ts`，实现三级评级：

#### Tier 1 - 官方/权威（可信度 90-95%）
- Tesla/华为/蔚来/小鹏/理想/小米/比亚迪 官网
- 官方微博/X 认证账号
- 官方新闻稿

#### Tier 2 - 专业媒体（可信度 80-85%）
- 36氪、品玩、极客公园
- CnEVPost、Electrek、InsideEVs
- 汽车之家、懂车帝（需验证）

#### Tier 3 - 社区/自媒体（可信度 55-65%）
- 知乎、B站、YouTube
- 需要交叉验证才能使用

---

## 三、具体实施步骤

### 步骤 1：启用联网搜索模型

修改 `api/update_intel.py`，优先使用联网模型：

```python
# 使用联网模型获取实时信息
def search_with_ai(query: str) -> str:
    """使用 AI 联网搜索获取实时信息"""
    search_model = os.environ.get("GEMINI_SEARCH_MODEL", "[L]gemini-3.1-pro-preview-search")

    prompt = f"""
    请搜索并总结以下问题的最新信息：

    问题：{query}

    要求：
    1. 搜索最新的公开信息
    2. 说明信息来源
    3. 如果涉及版本号、时间，请务必准确
    4. 如果信息不确定，请明确说明

    当前日期：{datetime.now().strftime('%Y-%m-%d')}
    """

    response = requests.post(
        f"{GEMINI_API_URL}/chat/completions",
        headers={"Authorization": f"Bearer {GEMINI_API_KEY}"},
        json={
            "model": search_model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 1000
        },
        timeout=30
    )

    return response.json()["choices"][0]["message"]["content"]
```

### 步骤 2：实现数据源轮换

由于 Brave API 不可用，创建多个备选数据源：

```python
# api/data_sources.py

DATA_SOURCES = {
    "official_sites": [
        {"name": "Tesla", "url": "https://www.tesla.com/news", "parser": "rss"},
        {"name": "Huawei", "url": "https://consumer.huawei.com/cn/press/news/", "parser": "html"},
        {"name": "NIO", "url": "https://www.nio.com/news", "parser": "json"},
    ],
    "media_rss": [
        {"name": "36氪", "url": "https://36kr.com/feed", "category": "tech"},
        {"name": "CnEVPost", "url": "https://cnevpost.com/feed", "category": "ev"},
        {"name": "Electrek", "url": "https://electrek.co/feed", "category": "ev"},
    ],
    "social": [
        {"name": "微博", "api": "weibo", "accounts": ["特斯拉", "华为"]},
    ]
}
```

### 步骤 3：质量评估流水线

```python
# 情报入库前的质量检查
def process_intelligence(raw_data):
    # 1. 来源评估
    credibility = assessSourceCredibility(raw_data['link'])

    # 2. 时效性检查
    freshness = calculateFreshnessScore(raw_data['published_at'])

    # 3. 内容去重
    is_duplicate = check_duplicate(raw_data['title'])
    if is_duplicate:
        return None

    # 4. AI 分析（使用联网模型验证）
    if credibility.tier in ['tier2', 'tier3']:
        verification = verify_with_ai_search(raw_data)
        if not verification.is_confirmed:
            raw_data['warning'] = '待人工核实'

    # 5. 综合评分
    quality = calculateOverallQuality(raw_data)

    return {
        **raw_data,
        'credibility_tier': credibility.tier,
        'credibility_score': credibility.score,
        'freshness_score': freshness.score,
        'quality_score': quality.overall,
        'verified': quality.verdict == 'high_quality'
    }
```

---

## 四、准确性保障机制

### 4.1 版本号自动校验

```typescript
// 维护最新版本号数据库
const VERSION_DATABASE = {
  'Tesla FSD': { current: 'V13', lastUpdate: '2025-02', source: 'tesla.com' },
  'Huawei ADS': { current: '3.0', lastUpdate: '2024-12', source: 'huawei.com' },
  'Xiaomi SU7': { current: '1.4.0', lastUpdate: '2025-01', source: 'xiaomi.com' },
}

// 检测版本号异常
function detectVersionAnomaly(title: string): {
  isAnomaly: boolean;
  expected: string;
  found: string;
} {
  // 提取标题中的版本号
  // 与数据库对比
  // 标记异常（如标题说 FSD V12，但数据库显示 V13）
}
```

### 4.2 交叉验证流程

对于重要情报，必须**至少 2 个独立来源**确认：

```
情报采集
    │
    ├── 来源 A (Tier 1) ──┐
    │                      ├──▶ 自动确认 ✅
    ├── 来源 B (Tier 1) ──┘
    │
    ├── 来源 A (Tier 2) ──┐
    │                      ├──▶ AI 联网验证 ──▶ 确认 ✅
    ├── 来源 B (Tier 2) ──┘      或
    │                      └──▶ 人工审核 ⏳
    └── 来源 A (Tier 3) ──▶ 标记为"待验证" ⚠️
```

---

## 五、实施优先级

### 🔴 P0 - 立即执行（1-2 天）

1. **启用联网搜索模型**
   ```bash
   # 修改 .env
   GEMINI_SEARCH_MODEL=[L]gemini-3.1-pro-preview-search
   ```

2. **部署到 Vercel**
   ```bash
   vercel --prod
   ```

3. **添加质量评估字段到数据库**
   ```sql
   ALTER TABLE industry_intelligence ADD COLUMN credibility_tier TEXT;
   ALTER TABLE industry_intelligence ADD COLUMN quality_score INTEGER;
   ALTER TABLE industry_intelligence ADD COLUMN verified BOOLEAN DEFAULT false;
   ```

### 🟡 P1 - 短期执行（1 周）

1. 实现 RSS 数据源采集
2. 添加来源可信度自动标记
3. 创建人工审核界面

### 🟢 P2 - 中期规划（1 月）

1. 开发版本号自动校验
2. 实现交叉验证系统
3. 建立数据源轮换机制

---

## 六、验证测试

### 测试 1：联网搜索能力

```bash
python -c "
import os
from api.update_intel import search_with_ai

# 测试获取 Tesla FSD 最新版本
result = search_with_ai('Tesla FSD 最新版本号是多少？')
print(result)
"
```

### 测试 2：来源可信度评估

```typescript
import { assessSourceCredibility } from '@/lib/intelligence-quality';

// 测试不同来源
const tests = [
  'https://www.tesla.com/news',
  'https://36kr.com/news',
  'https://zhihu.com/question/123',
];

tests.forEach(url => {
  const result = assessSourceCredibility(url);
  console.log(`${url}: ${result.tier} (${result.score})`);
});
```

---

## 七、监控指标

| 指标 | 目标值 | 监控方式 |
|------|--------|----------|
| 情报准确率 | > 90% | 人工抽样审核 |
| 平均响应时效 | < 1 小时 | 采集时间统计 |
| 高可信来源占比 | > 70% | 来源分级统计 |
| AI 分析成功率 | > 95% | API 调用日志 |

---

## 八、总结

### 核心改进点

1. ✅ **时效性**：使用联网搜索模型 + 多源采集
2. ✅ **准确性**：版本号校验 + 交叉验证
3. ✅ **可靠性**：三级来源评级 + 质量评分

### 下一步行动

请告诉我你想先实施哪一步：

1. **部署到 Vercel** - 立即恢复完整网络访问
2. **添加 RSS 数据源** - 实现多源采集
3. **更新数据库字段** - 添加质量评估字段
4. **测试联网搜索** - 验证实时信息获取能力
