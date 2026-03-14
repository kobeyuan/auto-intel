-- 修复 industry_intelligence 表结构，匹配战略指挥中心需求
ALTER TABLE industry_intelligence
ADD COLUMN IF NOT EXISTS importance TEXT,           -- 战略权重 (high/medium/low)
ADD COLUMN IF NOT EXISTS quality_score FLOAT,      -- 情报质量分 (0-10)
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb, -- 扩展元数据 (tags, ai_raw)
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,     -- 是否经过 AI 深度研判
ADD COLUMN IF NOT EXISTS sentiment TEXT DEFAULT 'neutral';   -- 情感倾向

-- 确保索引存在以优化性能
CREATE INDEX IF NOT EXISTS idx_intel_importance ON industry_intelligence(importance);
CREATE INDEX IF NOT EXISTS idx_intel_quality_score ON industry_intelligence(quality_score DESC);
