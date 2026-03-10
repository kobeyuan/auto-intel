# 时效性、准确性、可靠性 - 实施指南

## 当前问题确认

### 1. AI 模型知识截止日期
- **Gemini 2.5 Pro**: 知识截止日期约 2023 年中
- **测试结果**: 认为 FSD V12 是最新版本，不知道 V13/V14
- **影响**: 无法提供准确的实时信息

### 2. 联网搜索模型状态
- **gemini-3.1-pro-preview-search**: 503 服务不可用
- **原因**: 可能是临时故障或该模型不稳定

### 3. 数据采集瓶颈
- **Brave API**: 网络限制无法访问
- **替代方案**: 需要建立多源采集系统

---

## 推荐实施方案

### 阶段一：立即修复（今天完成）

#### 1.1 部署到 Vercel（解决网络问题）

```bash
# 1. 部署
vercel --prod

# 2. 配置环境变量
vercel env add BRAVE_API_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add GEMINI_API_KEY

# 3. 验证部署
# 访问部署后的 URL，测试 Brave API 是否可用
```

**预期效果**:
- ✅ Brave API 可正常访问
- ✅ 自动采集恢复
- ✅ 实时信息获取

#### 1.2 添加 RSS 数据源（备选方案）

如果 Vercel 部署后 Brave API 仍有问题，立即启用 RSS 采集：

```python
# api/rss_collector.py

import feedparser
import requests
from datetime import datetime

RSS_SOURCES = [
    {"name": "36氪", "url": "https://36kr.com/feed", "category": "tech"},
    {"name": "CnEVPost", "url": "https://cnevpost.com/feed", "category": "ev"},
    {"name": "Electrek", "url": "https://electrek.co/feed", "category": "ev"},
    {"name": "TeslaMotors", "url": "https://www.reddit.com/r/teslamotors.rss", "category": "tesla"},
]

def collect_from_rss():
    """从 RSS 源采集情报"""
    items = []
    for source in RSS_SOURCES:
        try:
            feed = feedparser.parse(source["url"])
            for entry in feed.entries[:5]:  # 每个源取最新5条
                items.append({
                    "title": entry.title,
                    "link": entry.link,
                    "snippet": entry.get("summary", ""),
                    "source": source["name"],
                    "category": source["category"],
                    "published_at": entry.get("published"),
                    "collected_at": datetime.now().isoformat()
                })
        except Exception as e:
            print(f"RSS 采集失败 {source['name']}: {e}")
    return items
```

#### 1.3 手动录入界面（保底方案）

创建简单的手动录入界面，支持：
- 粘贴新闻链接
- 自动抓取标题和内容
- AI 自动分析
- 质量评分

```typescript
// src/app/manual-add/page.tsx
"use client";

import { useState } from "react";

export default function ManualAddPage() {
  const [url, setUrl] = useState("");
  const [analysis, setAnalysis] = useState(null);

  const handleSubmit = async () => {
    // 1. 抓取网页内容
    // 2. AI 分析
    // 3. 质量评估
    // 4. 入库
  };

  return (
    <div className="p-6">
      <h1>手动添加情报</h1>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="粘贴新闻链接"
        className="w-full p-2 border rounded"
      />
      <button onClick={handleSubmit} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        AI 分析与入库
      </button>
    </div>
  );
}
```

---

### 阶段二：质量体系建设（本周完成）

#### 2.1 数据库字段更新

```sql
-- 执行 migration
ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS credibility_tier TEXT DEFAULT 'unverified';
ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS credibility_score INTEGER DEFAULT 0;
ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS freshness_score INTEGER DEFAULT 0;
ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;
ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS cross_references JSONB DEFAULT '[]'::jsonb;
ALTER TABLE industry_intelligence ADD COLUMN IF NOT EXISTS warnings TEXT[] DEFAULT '{}';

-- 创建索引
CREATE INDEX idx_intel_quality ON industry_intelligence(quality_score DESC);
CREATE INDEX idx_intel_verified ON industry_intelligence(verified);
```

#### 2.2 来源可信度自动标记

在 `api/update_intel.py` 中添加：

```python
def assess_source_credibility(url: str) -> dict:
    """评估来源可信度"""
    tier1_domains = ['tesla.com', 'huawei.com', 'nio.com', 'xiaomi.com', 'xpeng.com', 'lixiang.com']
    tier2_domains = ['36kr.com', 'cnevpost.com', 'electrek.co', 'insideevs.com', 'autohome.com.cn']

    domain = extract_domain(url)

    if any(d in domain for d in tier1_domains):
        return {"tier": "tier1", "score": 95, "description": "官方来源"}
    elif any(d in domain for d in tier2_domains):
        return {"tier": "tier2", "score": 80, "description": "专业媒体"}
    else:
        return {"tier": "unverified", "score": 50, "description": "未验证来源"}
```

#### 2.3 交叉验证系统

```python
def cross_verify_intelligence(new_item: dict, existing_items: list) -> dict:
    """
    交叉验证新情报
    如果新情报与数据库中已有情报标题相似度 > 70%，则标记为已验证
    """
    from difflib import SequenceMatcher

    verification = {
        "is_verified": False,
        "confidence": 0,
        "cross_references": []
    }

    for existing in existing_items:
        similarity = SequenceMatcher(None, new_item["title"], existing["title"]).ratio()
        if similarity > 0.7:
            verification["cross_references"].append(existing["link"])
            verification["confidence"] += 20

    # 如果有至少 2 个交叉验证，且来源可信
    if len(verification["cross_references"]) >= 1:
        source_cred = assess_source_credibility(new_item["link"])
        if source_cred["score"] >= 80:
            verification["is_verified"] = True
            verification["confidence"] = min(verification["confidence"] + source_cred["score"], 100)

    return verification
```

---

### 阶段三：自动化流程（下周完成）

#### 3.1 定时采集任务

```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/collect",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

```python
# api/collect.py
from http.server import BaseHTTPRequestHandler
import update_intel

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Vercel Cron 触发器"""
        try:
            stats = update_intel.update_intelligence()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "success",
                "stats": stats,
                "timestamp": datetime.now().isoformat()
            }).encode())
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())
```

#### 3.2 质量监控 Dashboard

创建监控面板，显示：
- 今日采集情报数量
- 质量分数分布
- 来源占比
- 待验证情报列表

```typescript
// src/app/admin/quality-dashboard.tsx
export default function QualityDashboard() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <StatCard title="今日采集" value={120} trend="+15%" />
      <StatCard title="高可信度" value={85} trend="+5%" />
      <StatCard title="待验证" value={12} />
      <StatCard title="平均质量分" value={78} trend="+3%" />
    </div>
  );
}
```

---

## 四、验证清单

### 部署验证
- [ ] Vercel 部署成功
- [ ] Brave API 可访问
- [ ] 自动采集正常
- [ ] 数据入库成功

### 质量验证
- [ ] 来源可信度自动标记
- [ ] 时效性分数计算
- [ ] 交叉验证流程
- [ ] 质量徽章显示

### 准确性验证
- [ ] Tesla FSD 版本号准确
- [ ] 华为 ADS 版本号准确
- [ ] OTA 更新内容准确
- [ ] 发布时间准确

---

## 五、立即行动项

请选择你的下一步行动：

### 🔴 立即执行（推荐）

```bash
# 1. 部署到 Vercel
vercel --prod

# 2. 配置环境变量
vercel env add BRAVE_API_KEY

# 3. 测试 API
# 访问 https://your-project.vercel.app/api/update_intel
```

### 🟡 备选方案

如果不想部署，可以先实现：
1. RSS 数据采集
2. 手动录入界面
3. 质量评估系统

### 🟢 长期规划

1. 申请多个搜索 API (SerpAPI, Bing)
2. 建立数据源轮换机制
3. 开发 AI 驱动的质量预测

---

## 六、预期效果

### 解决前
- ❌ Brave API 不可用
- ❌ AI 知识过时 (2023)
- ❌ 消息源未验证
- ❌ 缺乏交叉验证

### 解决后
- ✅ Vercel 环境网络通畅
- ✅ 实时数据采集
- ✅ 三级来源评级
- ✅ 自动交叉验证
- ✅ 质量分数显示

---

**请告诉我你想立即执行哪一步？我可以协助你完成部署或代码实现。**
