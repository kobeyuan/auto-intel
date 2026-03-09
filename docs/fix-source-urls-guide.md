# 修复原文链接指南

## 问题原因

原文链接不可用是因为数据库中存储的是**模拟数据**，URL 使用的是占位符（如 `example.com`）。

## 解决方案

### 方案一：修复现有数据（推荐）

为现有数据生成真实的搜索链接：

```bash
npm run db:fix-urls
```

这会：
- 为每条数据生成对应来源的搜索链接
- 36氪 → 36氪搜索页
- 汽车之家 → 汽车之家搜索页
- 其他 → Google 搜索链接

### 方案二：删除模拟数据，重新采集真实数据

**步骤 1：删除模拟数据**
```bash
npm run db:clean-mock
```

**步骤 2：执行数据库迁移（如果还没执行）**
1. 打开 Supabase Dashboard: https://supabase.com/dashboard/project/eotyzutqjsowbexabzms
2. 进入 SQL Editor
3. 复制 `scripts/migration-v2.sql` 内容并执行

**步骤 3：重新采集真实数据**
```bash
# 采集传感器情报
npm run intel:sensor -- --save

# 采集OTA情报
npm run intel:ota -- --save

# 或采集全部
npm run intel:crawl -- --save
```

> ⚠️ 注意：Brave Search API 需要网络连接正常。如果 API 调用失败，会回退到模拟数据。

### 方案三：手动添加真实数据

**通过 Supabase Dashboard 手动插入：**

1. 访问 https://supabase.com/dashboard/project/eotyzutqjsowbexabzms
2. 进入 Table Editor → `industry_intelligence`
3. 点击 "Insert row"
4. 填写真实数据：
   - `title`: 标题
   - `source_url`: 真实的原文链接
   - `source`: 来源名称
   - `category`: 类别 (sensor/autonomous-driving/cockpit/ota)
   - `importance`: 重要度 (high/medium/low)
   - `sentiment`: 情感 (positive/neutral/negative)

## 验证修复

刷新页面后，情报卡片应该显示：
- ✅ "查看原文" 可点击链接
- ❌ 不再显示 "原文链接暂不可用"

## 批量导入真实链接

如果你有真实的文章链接列表，可以创建一个 CSV 导入脚本：

```javascript
// scripts/import-real-urls.js
const realUrls = [
  { title: '华为发布192线激光雷达', url: 'https://real-news-site.com/article/123' },
  // ...
];

// 批量更新数据库
```

需要我帮你创建批量导入脚本吗？
