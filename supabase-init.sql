-- Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 先删除现有表（如果存在）
DROP TABLE IF EXISTS sentiments CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- 2. 创建产品表
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('autonomous-driving', 'smart-cockpit')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建舆情表
CREATE TABLE IF NOT EXISTS sentiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  source_url TEXT,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  keywords TEXT[]
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_sentiments_product_id ON sentiments(product_id);
CREATE INDEX IF NOT EXISTS idx_sentiments_sentiment ON sentiments(sentiment);
CREATE INDEX IF NOT EXISTS idx_sentiments_published_at ON sentiments(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 5. 插入示例产品
INSERT INTO products (name, brand, category, description) VALUES
  ('FSD Beta', 'Tesla', 'autonomous-driving', '完全自动驾驶Beta版'),
  ('City NOA', '理想汽车', 'autonomous-driving', '城市导航辅助驾驶'),
  ('NIO Pilot', '蔚来汽车', 'autonomous-driving', '蔚来自动驾驶系统'),
  ('XNGP', '小鹏汽车', 'autonomous-driving', '全场景智能辅助驾驶'),
  ('ADS 2.0', '华为', 'autonomous-driving', '华为高阶智能驾驶系统'),
  ('鸿蒙智能座舱', '华为', 'smart-cockpit', '基于鸿蒙系统的智能座舱'),
  ('理想座舱', '理想汽车', 'smart-cockpit', '理想汽车智能座舱系统'),
  ('PanoCinema', '蔚来汽车', 'smart-cockpit', '蔚来全景数字座舱'),
  ('Xmart OS', '小鹏汽车', 'smart-cockpit', '小鹏智能座舱系统'),
  ('车机OS', '特斯拉', 'smart-cockpit', '特斯拉车载操作系统');

-- 6. 插入示例舆情数据
INSERT INTO sentiments (product_id, title, content, source, source_url, sentiment, confidence, published_at, keywords)
SELECT
  id,
  '用户体验提升显著',
  '最新版本的系统更新带来了显著的体验提升，界面更加流畅，响应速度更快。',
  '微博',
  'https://weibo.com/example/1',
  'positive',
  0.85,
  NOW() - INTERVAL '1 day',
  ARRAY['体验', '流畅', '更新']
FROM products WHERE name = 'FSD Beta';

INSERT INTO sentiments (product_id, title, content, source, source_url, sentiment, confidence, published_at, keywords)
SELECT
  id,
  '城市路况表现优秀',
  '在城市复杂路况下表现非常稳定，识别准确率高。',
  '知乎',
  'https://zhihu.com/example/2',
  'positive',
  0.90,
  NOW() - INTERVAL '2 days',
  ARRAY['城市路况', '稳定', '准确']
FROM products WHERE name = 'City NOA';

INSERT INTO sentiments (product_id, title, content, source, source_url, sentiment, confidence, published_at, keywords)
SELECT
  id,
  '存在误识别情况',
  '在某些特殊场景下仍存在误识别的问题，需要进一步优化。',
  '小红书',
  'https://xiaohongshu.com/example/3',
  'negative',
  0.75,
  NOW() - INTERVAL '3 days',
  ARRAY['误识别', '优化', '问题']
FROM products WHERE name = 'NIO Pilot';

INSERT INTO sentiments (product_id, title, content, source, source_url, sentiment, confidence, published_at, keywords)
SELECT
  id,
  '鸿蒙生态整合流畅',
  '鸿蒙智能座舱与手机、平板等设备的生态整合非常流畅。',
  '微博',
  'https://weibo.com/example/4',
  'positive',
  0.88,
  NOW() - INTERVAL '1 day',
  ARRAY['鸿蒙', '生态', '流畅']
FROM products WHERE name = '鸿蒙智能座舱';

-- 7. 验证数据
SELECT 'Products count:' as info, COUNT(*) as count FROM products
UNION ALL
SELECT 'Sentiments count:', COUNT(*) FROM sentiments;

-- 8. 显示示例数据
SELECT 'Sample products:' as info;
SELECT * FROM products LIMIT 5;

SELECT 'Sample sentiments:' as info;
SELECT * FROM sentiments LIMIT 5;
