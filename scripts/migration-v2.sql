-- 数据库迁移 V2 - 行业情报系统优化
-- 执行方式: 在 Supabase SQL Editor 中执行

-- ===========================================
-- 1. 扩展 industry_intelligence 表
-- ===========================================

-- 新增字段：来源可信度、AI分析、时效性等
ALTER TABLE industry_intelligence
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS source_credibility TEXT,
ADD COLUMN IF NOT EXISTS publish_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS sub_category TEXT,
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT,
ADD COLUMN IF NOT EXISTS importance_score FLOAT,
ADD COLUMN IF NOT EXISTS key_insights JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS industry_impact TEXT,
ADD COLUMN IF NOT EXISTS tech_innovation TEXT,
ADD COLUMN IF NOT EXISTS market_trend TEXT,
ADD COLUMN IF NOT EXISTS competitive_dynamics TEXT,
ADD COLUMN IF NOT EXISTS related_companies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_technologies JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS related_products JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS time_sensitivity TEXT DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS ai_analyzed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_provider TEXT,
ADD COLUMN IF NOT EXISTS confidence FLOAT,

-- 前沿程度评分字段 (新增)
ADD COLUMN IF NOT EXISTS frontier_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS frontier_level TEXT DEFAULT '常规',
ADD COLUMN IF NOT EXISTS frontier_badge TEXT,
ADD COLUMN IF NOT EXISTS frontier_keywords JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS dimension TEXT,
ADD COLUMN IF NOT EXISTS collected_at TIMESTAMP DEFAULT NOW();

-- 创建新索引
CREATE INDEX IF NOT EXISTS idx_intel_source_credibility ON industry_intelligence(source_credibility);
CREATE INDEX IF NOT EXISTS idx_intel_time_sensitivity ON industry_intelligence(time_sensitivity);
CREATE INDEX IF NOT EXISTS idx_intel_ai_analyzed ON industry_intelligence(ai_analyzed);
CREATE INDEX IF NOT EXISTS idx_intel_confidence ON industry_intelligence(confidence DESC);

-- 前沿程度索引 (新增)
CREATE INDEX IF NOT EXISTS idx_intel_frontier_score ON industry_intelligence(frontier_score DESC);
CREATE INDEX IF NOT EXISTS idx_intel_frontier_level ON industry_intelligence(frontier_level);
CREATE INDEX IF NOT EXISTS idx_intel_dimension ON industry_intelligence(dimension);

-- 为JSONB字段创建GIN索引（优化JSON查询）
CREATE INDEX IF NOT EXISTS idx_intel_insights ON industry_intelligence USING GIN (key_insights);
CREATE INDEX IF NOT EXISTS idx_intel_companies ON industry_intelligence USING GIN (related_companies);
CREATE INDEX IF NOT EXISTS idx_intel_technologies ON industry_intelligence USING GIN (related_technologies);
CREATE INDEX IF NOT EXISTS idx_intel_frontier_keywords ON industry_intelligence USING GIN (frontier_keywords);

-- ===========================================
-- 2. 创建 OTA 更新表
-- ===========================================

CREATE TABLE IF NOT EXISTS ota_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基础信息
  brand TEXT NOT NULL,
  model TEXT,
  version TEXT NOT NULL,
  version_number TEXT,
  update_type TEXT, -- major/minor/hotfix

  -- 更新时间
  release_date TIMESTAMP,
  update_size TEXT,

  -- 更新内容
  update_content TEXT,
  key_features JSONB DEFAULT '[]'::jsonb,

  -- AI分析
  user_feedback TEXT,
  importance TEXT,
  competitive_analysis TEXT,
  technical_highlights JSONB DEFAULT '[]'::jsonb,
  market_impact TEXT,

  -- 来源
  source TEXT,
  source_url TEXT,

  -- 时间戳
  created_at TIMESTAMP DEFAULT NOW()
);

-- OTA表索引
CREATE INDEX IF NOT EXISTS idx_ota_brand ON ota_updates(brand);
CREATE INDEX IF NOT EXISTS idx_ota_date ON ota_updates(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_ota_type ON ota_updates(update_type);
CREATE INDEX IF NOT EXISTS idx_ota_version ON ota_updates(version);

-- ===========================================
-- 3. 创建情报报告表
-- ===========================================

CREATE TABLE IF NOT EXISTS intelligence_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  report_type TEXT NOT NULL, -- weekly/monthly/special
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- 报告内容
  overview TEXT,
  highlights JSONB DEFAULT '[]'::jsonb,
  by_category JSONB DEFAULT '{}'::jsonb,
  predictions JSONB DEFAULT '[]'::jsonb,

  -- 统计
  data_period_start TIMESTAMP,
  data_period_end TIMESTAMP,
  intelligence_count INTEGER,

  -- 元数据
  generated_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 报告表索引
CREATE INDEX IF NOT EXISTS idx_reports_type ON intelligence_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_date ON intelligence_reports(created_at DESC);

-- ===========================================
-- 4. 创建更新时间触发器
-- ===========================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为 industry_intelligence 表添加触发器
DROP TRIGGER IF EXISTS update_industry_intelligence_updated_at ON industry_intelligence;
CREATE TRIGGER update_industry_intelligence_updated_at
  BEFORE UPDATE ON industry_intelligence
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- 5. 设置RLS策略（行级安全）
-- ===========================================

-- 开启RLS
ALTER TABLE industry_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE intelligence_reports ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户读取
DROP POLICY IF EXISTS "Allow anonymous read" ON industry_intelligence;
CREATE POLICY "Allow anonymous read" ON industry_intelligence
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read ota" ON ota_updates;
CREATE POLICY "Allow anonymous read ota" ON ota_updates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow anonymous read reports" ON intelligence_reports;
CREATE POLICY "Allow anonymous read reports" ON intelligence_reports
  FOR SELECT USING (true);

-- ===========================================
-- 6. 迁移旧数据（如有）
-- ===========================================

-- 为旧数据设置默认值
UPDATE industry_intelligence
SET ai_analyzed = false,
    source_credibility = 'tier2',
    time_sensitivity = 'normal'
WHERE ai_analyzed IS NULL;

-- ===========================================
-- 迁移完成
-- ===========================================

SELECT '迁移完成！' as status;
