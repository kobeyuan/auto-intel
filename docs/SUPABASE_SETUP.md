# Supabase 配置指南

## 创建 Supabase 项目

### 1. 注册并创建项目

1. 访问 [Supabase](https://supabase.com)
2. 点击 "Start your project"
3. 使用 GitHub 或邮箱注册
4. 创建新项目：
   - **项目名称**：`auto-intel`
   - **数据库密码**：设置一个强密码并保存
   - **地区**：选择离你最近的地区（如 Singapore）

### 2. 获取项目 URL 和 API Key

1. 项目创建后，进入 **Project Settings**
2. 找到 **API** 部分
3. 复制以下信息：
   - **Project URL**（类似：`https://xxx.supabase.co`）
   - **anon public** key（以 `eyJ` 开头）

### 3. 创建数据库表

1. 进入 **SQL Editor**
2. 点击 "New query"
3. 粘贴以下 SQL 并运行：

```sql
-- 创建产品表
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('autonomous-driving', 'smart-cockpit')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建舆情表
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_sentiments_product_id ON sentiments(product_id);
CREATE INDEX IF NOT EXISTS idx_sentiments_sentiment ON sentiments(sentiment);
CREATE INDEX IF NOT EXISTS idx_sentiments_published_at ON sentiments(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 插入示例产品
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

-- 插入示例舆情数据
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
```

### 4. 配置 Row Level Security (可选)

如果需要更严格的安全控制，可以启用 RLS：

```sql
-- 启用 RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiments ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取（公开数据）
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Sentiments are viewable by everyone"
  ON sentiments FOR SELECT
  USING (true);

-- 限制写入（仅允许服务端）
CREATE POLICY "Only service can insert products"
  ON products FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Only service can insert sentiments"
  ON sentiments FOR INSERT
  WITH CHECK (false);
```

### 5. 验证表创建

1. 进入 **Table Editor**
2. 你应该能看到 `products` 和 `sentiments` 两张表
3. 点击查看数据，确认示例数据已插入

---

## 配置项目环境变量

1. 在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
BRAVE_API_KEY=BSAJodIqkC38RnlMhH7d_b67JTIfTLV
FEISHU_WEBHOOK_URL=
```

2. 替换：
   - `your-project.supabase.co` 为你的 Project URL
   - `your-anon-key` 为你的 anon public key

3. 重启开发服务器：

```bash
npm run dev
```

---

## 常见问题

### 1. 连接失败

- 检查 URL 和 API Key 是否正确
- 确认 Supabase 项目已启动
- 检查网络连接

### 2. 数据没有显示

- 确认 SQL 脚本已成功执行
- 检查 Table Editor 中是否有数据
- 查看浏览器控制台是否有错误

### 3. API 权限错误

- 确认使用的是 `anon public` key，不是 `service_role` key
- 检查 RLS 策略是否阻止了访问
