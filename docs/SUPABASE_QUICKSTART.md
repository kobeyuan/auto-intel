# Supabase 快速配置指南

## 📌 重要提示

**我无法直接帮你注册 Supabase 账户，但我会准备好一切，你只需要按照步骤操作！**

---

## 第 1 步：注册并创建项目（2 分钟）

### 1.1 打开 Supabase
访问：https://supabase.com

### 1.2 注册账户
- 点击右上角 "Start your project"
- 选择：
  - **Continue with GitHub**（推荐）
  - 或用邮箱注册
- 如果是邮箱注册，需要验证邮箱

### 1.3 创建新项目
- 点击 "New Project"
- 填写信息：

| 项目 | 填写内容 |
|------|---------|
| **Name** | `auto-intel` |
| **Database Password** | 设置一个强密码，**务必保存**！<br>例如：`MyStr0ngP@ssw0rd` |
| **Region** | 选择 `Singapore`（新加坡）<br>离中国最近，访问最快 |
| **Pricing Plan** | 选择 `Free`（免费） |

- 点击 "Create new project"
- 等待 1-2 分钟，项目创建完成

---

## 第 2 步：获取 API 配置（1 分钟）

### 2.1 打开 API 设置
1. 项目创建后，在左侧菜单点击 **Settings**
2. 点击 **API**

### 2.2 复制两个配置

#### 📋 第 1 项：Project URL
- 在 "Project URL" 下面的输入框中
- 复制完整内容
- 格式类似：`https://xxxxyyzz.supabase.co`
- **保存到记事本**

#### 📋 第 2 项：anon public key
- 找到 "Project API keys" 部分
- 在 "anon public" 下面
- 点击复制按钮
- 格式类似：`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **保存到记事本**

---

## 第 3 步：运行 SQL 初始化脚本（2 分钟）

### 3.1 打开 SQL Editor
1. 在左侧菜单点击 **SQL Editor**
2. 点击 "New query" 按钮

### 3.2 粘贴 SQL 脚本

#### 方法 1：直接复制（推荐）
打开项目文件：
```
/workspace/projects/auto-intel/supabase-init.sql
```
- 选中全部内容（Ctrl+A）
- 复制（Ctrl+C）

#### 方法 2：使用我准备好的完整 SQL
复制下面这段完整内容：

```sql
-- Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 创建产品表
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('autonomous-driving', 'smart-cockpit')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建舆情表
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

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_sentiments_product_id ON sentiments(product_id);
CREATE INDEX IF NOT EXISTS idx_sentiments_sentiment ON sentiments(sentiment);
CREATE INDEX IF NOT EXISTS idx_sentiments_published_at ON sentiments(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- 4. 插入示例产品
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

-- 5. 插入示例舆情数据
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

### 3.3 粘贴到 SQL Editor
- 在 SQL Editor 的编辑器中
- 右键 → 粘贴（Ctrl+V）

### 3.4 运行
- 点击右下角的 **Run** 按钮（或按 Ctrl+Enter）
- 等待执行完成

### 3.5 验证结果
- 应该看到 "Success" 提示
- 如果有错误，查看错误信息并告诉我

---

## 第 4 步：检查数据（可选）

### 4.1 打开 Table Editor
1. 点击左侧菜单的 **Table Editor**
2. 你应该能看到：
   - `products` 表
   - `sentiments` 表

### 4.2 检查数据
- 点击 `products` 表
- 应该有 10 条产品数据
- 点击 `sentiments` 表
- 应该有 4 条舆情数据

---

## 第 5 步：发送配置给我（30 秒）

完成上述步骤后，**把这两项配置发给我**：

```
1. Project URL：https://xxxxyyzz.supabase.co
2. Anon Key：eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

收到后，我会帮你配置到项目中！

---

## 📋 配置示例

### 正确的格式

✅ **Project URL**：
```
https://abc123def456.supabase.co
```

✅ **Anon Key**：
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTnI0
```

### 错误的格式

❌ 不要只给 ID：
```
abc123def456
```

❌ 不要用 service_role key：
```
eyJpc3MiOiJzdXBhYmFzZS1kZW1v...（这个是服务端用的）
```

---

## ⚠️ 常见问题

### 1. 项目创建失败
- 检查是否已登录
- 检查网络连接
- 尝试刷新页面

### 2. SQL 运行失败
- 检查 SQL 是否完整复制
- 查看错误信息
- 尝试分多次运行

### 3. 表没有数据
- 确认 SQL 执行成功
- 刷新 Table Editor 页面

---

## ✅ 成功标志

如果以下都完成，说明配置成功：

- [ ] 项目已创建（名称：auto-intel）
- [ ] 已获取 Project URL
- [ ] 已获取 anon public key
- [ ] SQL 脚本执行成功
- [ ] products 表有 10 条数据
- [ ] sentiments 表有 4 条数据

---

## 📞 遇到问题？

如果遇到任何问题，告诉我：
1. 卡在哪个步骤
2. 错误信息是什么
3. 截图（如果可能）

我会帮你解决！🎋
