# 数据库Schema V2 - 优化版

## 概述
为支持增强版情报洞察系统，数据库结构已优化，提升时效性、准确性和洞察质量。

---

## 表结构

### 1. industry_intelligence (行业情报表)

存储采集的行业情报，包含AI深度分析结果。

```sql
CREATE TABLE industry_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基础信息
  title TEXT NOT NULL,
  content TEXT,
  summary TEXT,                    -- AI生成摘要
  source TEXT NOT NULL,
  source_credibility TEXT,         -- official/tier1/tier2/tier3
  source_url TEXT NOT NULL,
  publish_time TIMESTAMP,

  -- 分类
  category TEXT NOT NULL,          -- sensor/autonomous-driving/cockpit/policy/market
  sub_category TEXT,

  -- AI分析结果
  sentiment TEXT,                  -- positive/neutral/negative
  sentiment_score FLOAT,           -- 0-1
  importance TEXT,                 -- critical/high/medium/low
  importance_score FLOAT,          -- 0-1

  -- 洞察字段
  key_insights JSONB,              -- 关键洞察数组
  industry_impact TEXT,            -- 产业影响
  tech_innovation TEXT,            -- 技术创新点
  market_trend TEXT,               -- 市场趋势
  competitive_dynamics TEXT,       -- 竞争格局变化

  -- 关联信息
  related_companies JSONB,         -- 相关公司
  related_technologies JSONB,      -- 相关技术
  related_products JSONB,          -- 相关产品

  -- 时效性
  time_sensitivity TEXT,           -- breaking/trending/normal/archived
  valid_until TIMESTAMP,

  -- 元数据
  ai_analyzed BOOLEAN DEFAULT false,
  ai_provider TEXT,
  confidence FLOAT,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_intel_category ON industry_intelligence(category);
CREATE INDEX idx_intel_importance ON industry_intelligence(importance);
CREATE INDEX idx_intel_sentiment ON industry_intelligence(sentiment);
CREATE INDEX idx_intel_time ON industry_intelligence(created_at DESC);
CREATE INDEX idx_intel_sensitivity ON industry_intelligence(time_sensitivity);
```

### 2. ota_updates (OTA更新表)

存储各品牌OTA版本更新信息。

```sql
CREATE TABLE ota_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基础信息
  brand TEXT NOT NULL,             -- 品牌
  model TEXT,                      -- 车型
  version TEXT NOT NULL,           -- 版本号
  version_number TEXT,             -- 数字版本号
  update_type TEXT,                -- major/minor/hotfix

  -- 更新时间
  release_date TIMESTAMP,
  update_size TEXT,                -- 更新包大小

  -- 更新内容
  update_content TEXT,
  key_features JSONB,              -- 核心功能列表

  -- AI分析
  user_feedback TEXT,              -- positive/neutral/negative
  importance TEXT,                 -- high/medium/low
  competitive_analysis TEXT,       -- 竞品对比分析
  technical_highlights JSONB,      -- 技术亮点
  market_impact TEXT,              -- 市场影响

  -- 来源
  source TEXT,
  source_url TEXT,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_ota_brand ON ota_updates(brand);
CREATE INDEX idx_ota_date ON ota_updates(release_date DESC);
CREATE INDEX idx_ota_type ON ota_updates(update_type);
```

### 3. intelligence_reports (情报报告表)

存储生成的周报、月报等分析报告。

```sql
CREATE TABLE intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_type TEXT NOT NULL,       -- weekly/monthly/special
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- 报告内容
  overview TEXT,                   -- 概述
  highlights JSONB,                -- 亮点
  by_category JSONB,               -- 分领域动态
  predictions JSONB,               -- 趋势预测

  -- 统计
  data_period_start TIMESTAMP,
  data_period_end TIMESTAMP,
  intelligence_count INTEGER,

  -- 元数据
  generated_by TEXT,               -- AI模型
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 关键改进

### 1. 时效性优化
- `time_sensitivity`: 标识突发/热点/常规/归档
- `valid_until`: 情报有效期
- `publish_time`: 原始发布时间（优先于采集时间）

### 2. 准确性提升
- `source_credibility`: 来源可信度评级
- `confidence`: AI分析置信度
- `ai_analyzed`: 是否经过AI验证

### 3. 洞察质量增强
- `key_insights`: 结构化关键洞察
- `industry_impact`: 产业影响评估
- `competitive_dynamics`: 竞争格局变化
- `related_*`: 关联公司/技术/产品

### 4. 情感分析精细化
- `sentiment`: 情感倾向
- `sentiment_score`: 情感分数（0-1）
- 支持中性情感的细分

### 5. 重要性分级细化
- `importance`: critical/high/medium/low
- `importance_score`: 重要度分数
- Critical级别用于突发重大事件

---

## 数据迁移

从旧版迁移数据：

```sql
-- 迁移旧数据（保留原有字段）
INSERT INTO industry_intelligence (
  title, content, source, source_url, category,
  sentiment, importance, created_at
)
SELECT
  title, content, source, source_url, category,
  sentiment, importance, created_at
FROM old_industry_news;

-- 更新AI分析字段（需要重新运行AI分析）
UPDATE industry_intelligence
SET ai_analyzed = false
WHERE summary IS NULL;
```

---

## 查询示例

### 获取热点情报
```sql
SELECT * FROM industry_intelligence
WHERE time_sensitivity IN ('breaking', 'trending')
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY importance_score DESC;
```

### 获取传感器领域高价值情报
```sql
SELECT * FROM industry_intelligence
WHERE category = 'sensor'
  AND importance IN ('critical', 'high')
  AND source_credibility IN ('official', 'tier1')
ORDER BY created_at DESC;
```

### 获取最新OTA更新
```sql
SELECT * FROM ota_updates
WHERE release_date > NOW() - INTERVAL '7 days'
ORDER BY release_date DESC;
```

### 统计本周情报分布
```sql
SELECT
  category,
  importance,
  COUNT(*) as count
FROM industry_intelligence
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY category, importance;
```

---

## 注意事项

1. **AI分析字段**: 需要运行 `npm run intel:crawl` 填充
2. **source_credibility**: 根据来源自动判断，可手动调整
3. **time_sensitivity**: 系统自动判断，可手动标记
4. **JSONB字段**: 使用GIN索引优化查询性能
