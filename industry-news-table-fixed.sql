-- 1. 首先检查表是否存在，如果不存在则创建
DO $$ 
BEGIN
    -- 创建行业新闻表（如果不存在）
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'industry_news') THEN
        CREATE TABLE industry_news (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT,
          source TEXT,
          source_url TEXT UNIQUE,
          category TEXT CHECK (category IN ('technology', 'product', 'policy', 'funding', 'partnership', 'other')),
          keywords TEXT[],
          sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
          importance TEXT DEFAULT 'medium' CHECK (importance IN ('high', 'medium', 'low')),
          published_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE '表 industry_news 创建成功';
    ELSE
        RAISE NOTICE '表 industry_news 已存在';
    END IF;
END $$;

-- 2. 创建索引（如果不存在）
DO $$ 
BEGIN
    -- idx_industry_news_published_at
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'industry_news' 
        AND indexname = 'idx_industry_news_published_at'
    ) THEN
        CREATE INDEX idx_industry_news_published_at ON industry_news(published_at DESC);
        RAISE NOTICE '索引 idx_industry_news_published_at 创建成功';
    ELSE
        RAISE NOTICE '索引 idx_industry_news_published_at 已存在';
    END IF;
    
    -- idx_industry_news_category
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'industry_news' 
        AND indexname = 'idx_industry_news_category'
    ) THEN
        CREATE INDEX idx_industry_news_category ON industry_news(category);
        RAISE NOTICE '索引 idx_industry_news_category 创建成功';
    ELSE
        RAISE NOTICE '索引 idx_industry_news_category 已存在';
    END IF;
    
    -- idx_industry_news_sentiment
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'industry_news' 
        AND indexname = 'idx_industry_news_sentiment'
    ) THEN
        CREATE INDEX idx_industry_news_sentiment ON industry_news(sentiment);
        RAISE NOTICE '索引 idx_industry_news_sentiment 创建成功';
    ELSE
        RAISE NOTICE '索引 idx_industry_news_sentiment 已存在';
    END IF;
    
    -- idx_industry_news_importance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'industry_news' 
        AND indexname = 'idx_industry_news_importance'
    ) THEN
        CREATE INDEX idx_industry_news_importance ON industry_news(importance);
        RAISE NOTICE '索引 idx_industry_news_importance 创建成功';
    ELSE
        RAISE NOTICE '索引 idx_industry_news_importance 已存在';
    END IF;
END $$;

-- 3. 启用 RLS（行级安全）
DO $$ 
BEGIN
    -- 检查 RLS 是否已启用
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'industry_news' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE industry_news ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'RLS 已启用';
    ELSE
        RAISE NOTICE 'RLS 已启用';
    END IF;
END $$;

-- 4. 创建安全策略（如果不存在）
DO $$ 
BEGIN
    -- 检查 SELECT 策略是否存在
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'industry_news' 
        AND policyname = '允许匿名读取行业新闻'
    ) THEN
        CREATE POLICY "允许匿名读取行业新闻" ON industry_news
          FOR SELECT USING (true);
        RAISE NOTICE 'SELECT 策略创建成功';
    ELSE
        RAISE NOTICE 'SELECT 策略已存在';
    END IF;
    
    -- 检查 INSERT 策略是否存在
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'industry_news' 
        AND policyname = '允许服务角色写入行业新闻'
    ) THEN
        CREATE POLICY "允许服务角色写入行业新闻" ON industry_news
          FOR INSERT WITH CHECK (true);
        RAISE NOTICE 'INSERT 策略创建成功';
    ELSE
        RAISE NOTICE 'INSERT 策略已存在';
    END IF;
END $$;

-- 5. 插入示例数据（如果不存在）
INSERT INTO industry_news (title, content, source, source_url, category, keywords, sentiment, importance, published_at)
VALUES
  (
    '特斯拉发布最新自动驾驶系统FSD V12',
    '特斯拉近日发布了全自动驾驶系统FSD V12版本，采用了端到端神经网络架构，大幅提升了城市道路的自动驾驶能力。',
    '36氪',
    'https://36kr.com/p/1234567890',
    'technology',
    ARRAY['特斯拉', '自动驾驶', 'FSD', '神经网络'],
    'positive',
    'high',
    '2026-02-25 10:00:00+08'
  ),
  (
    '华为发布新一代智能座舱解决方案',
    '华为在智能汽车解决方案发布会上推出了新一代智能座舱系统，搭载鸿蒙OS 4.0，支持多屏协同和智能语音交互。',
    '虎嗅',
    'https://huxiu.com/article/1234567',
    'product',
    ARRAY['华为', '智能座舱', '鸿蒙OS', '车联网'],
    'positive',
    'high',
    '2026-02-24 14:30:00+08'
  ),
  (
    '工信部发布智能网联汽车数据安全标准',
    '工业和信息化部发布了《智能网联汽车数据安全技术要求》国家标准，规范了车辆数据采集、存储和使用。',
    '工信部网站',
    'https://www.miit.gov.cn/xxxxx',
    'policy',
    ARRAY['工信部', '数据安全', '智能网联汽车', '国家标准'],
    'neutral',
    'high',
    '2026-02-23 09:00:00+08'
  ),
  (
    '小鹏汽车完成新一轮50亿元融资',
    '小鹏汽车宣布完成新一轮50亿元战略融资，将主要用于自动驾驶技术研发和产能扩张。',
    '钛媒体',
    'https://tmtpost.com/123456',
    'funding',
    ARRAY['小鹏汽车', '融资', '自动驾驶', '战略投资'],
    'positive',
    'medium',
    '2026-02-22 16:45:00+08'
  ),
  (
    '蔚来与宁德时代达成电池技术合作',
    '蔚来汽车与宁德时代签署战略合作协议，共同研发下一代高性能动力电池技术。',
    '汽车之家',
    'https://autohome.com.cn/news/123456',
    'partnership',
    ARRAY['蔚来', '宁德时代', '电池技术', '合作'],
    'positive',
    'medium',
    '2026-02-21 11:20:00+08'
  ),
  (
    '某自动驾驶公司测试车发生事故',
    '某自动驾驶公司在道路测试过程中发生碰撞事故，目前相关部门已介入调查。',
    '第一电动网',
    'https://d1ev.com/news/123456',
    'technology',
    ARRAY['自动驾驶', '事故', '安全测试', '调查'],
    'negative',
    'high',
    '2026-02-20 15:10:00+08'
  )
ON CONFLICT (source_url) DO NOTHING;

-- 6. 显示当前表结构
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'industry_news'
ORDER BY ordinal_position;

-- 7. 显示表中的数据数量
SELECT COUNT(*) as total_records FROM industry_news;