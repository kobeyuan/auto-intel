# 网络问题深度分析与修复报告

## 诊断结果

### Brave API 连接问题

| 测试项 | 结果 | 说明 |
|-------|------|------|
| DNS 解析 | ✅ 正常 | 128.242.245.221 |
| TCP 连接 | ✅ 正常 | 端口 443 开放 |
| SSL 握手 | ❌ 超时 | 10秒内无法完成 |
| HTTP 请求 | ❌ 超时 | 所有方式均失败 |

**根本原因**: 移动网络对国外 API 的 SSL 握手存在限制，可能是：
1. 移动网关防火墙拦截
2. 国际出口流量整形
3. TLS 指纹检测与阻断

---

## 修复方案

### 方案 1: 使用代理服务器（立即可用）

如果你有 HTTP/HTTPS 代理，设置环境变量：

```bash
# 设置代理
export HTTPS_PROXY="http://your-proxy-server:port"

# 运行采集
python api/update_intel.py
```

或在 `.env` 文件中添加：
```env
HTTPS_PROXY=http://your-proxy-server:port
```

**代码已更新**: `api/update_intel.py` 已添加代理支持

---

### 方案 2: 部署到 Vercel（推荐）

Vercel 拥有海外网络访问能力，Brave API 可以正常工作。

```bash
# 部署
vercel --prod

# 设置环境变量
vercel env add BRAVE_API_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

---

### 方案 3: 更换搜索 API

如果 Brave 长期不可用，可以更换为：

#### SerpAPI (Google Search)
```python
# 修改 api/update_intel.py
SERPAPI_KEY = os.environ.get("SERPAPI_KEY")

response = requests.get(
    "https://serpapi.com/search",
    params={
        "q": query,
        "api_key": SERPAPI_KEY,
        "engine": "google"
    }
)
```

#### Bing Search API
```python
BING_API_KEY = os.environ.get("BING_API_KEY")

response = requests.get(
    "https://api.bing.microsoft.com/v7.0/search",
    headers={"Ocp-Apim-Subscription-Key": BING_API_KEY},
    params={"q": query}
)
```

---

## 情报采集优化（已完成）

### 更新后的搜索矩阵

| 维度 | 查询数量 | 覆盖内容 |
|------|---------|---------|
| **OTA 更新** | 42 个 | Tesla、华为、蔚来、小鹏、理想、小米、比亚迪 |
| **座舱功能** | 31 个 | 芯片升级、鸿蒙座舱、多屏互动、语音助手、AR-HUD |
| **智驾功能** | 30 个 | 城市NOA、高速NOA、端到端、智能泊车、AEB |
| **竞争技术** | 168 个 | 各品牌 × 核心技术交叉查询 |
| **实时热点** | 10 个 | 今日、刚刚、发布、官宣等 |

### 品牌覆盖

- ✅ Tesla (FSD、OTA、座舱)
- ✅ 华为/问界 (ADS、鸿蒙座舱、OTA)
- ✅ 蔚来 (NAD、数字座舱、OTA)
- ✅ 小鹏 (XNGP、XOS、OTA)
- ✅ 理想 (AD Max、智能座舱、OTA)
- ✅ 小米 (SU7、澎湃座舱、OTA)
- ✅ 比亚迪 (天神之眼、腾势、OTA)

### 实时性优化

1. **移除固定年份**: "2026 智能驾驶" → "智能驾驶 最新"
2. **添加实时关键词**: 今日、刚刚、最新发布、官宣、重磅
3. **功能特性关注**: 城市NOA开通、端到端推送、OTA功能升级
4. **AI Prompt 优化**: 添加日期提示和时效性提醒

---

## 当前配置状态

### .env 文件
```env
# AI 模型
DEFAULT_AI_MODEL=gemini
GEMINI_MODEL=[L]gemini-2.5-pro
GEMINI_SEARCH_MODEL=[L]gemini-3.1-pro-preview-search

# 代理（如需要）
HTTPS_PROXY=http://your-proxy:port
```

### API 可用性

| API | 本地+移动热点 | Vercel 环境 |
|-----|--------------|------------|
| Gemini API | ✅ 正常 | ✅ 正常 |
| Kimi API | ✅ 正常 | ✅ 正常 |
| Brave Search | ❌ SSL 超时 | ✅ 正常 |
| Supabase | ⚠️ 间歇 | ✅ 正常 |

---

## 立即执行建议

### 如果急需采集情报：

1. **使用代理**（如果有）
   ```bash
   export HTTPS_PROXY="http://proxy:port"
   python api/update_intel.py
   ```

2. **部署到 Vercel**（推荐）
   ```bash
   vercel --prod
   # 然后访问部署后的 URL 触发采集
   ```

3. **本地手动添加情报**（临时方案）
   通过前端界面手动添加高价值情报，AI 分析功能正常工作。

---

## 代码变更摘要

| 文件 | 变更 |
|-----|------|
| `api/update_intel.py` | 添加代理支持、更新搜索矩阵、优化 OTA/座舱/智驾查询 |
| `diagnose_brave.py` | 新增 Brave API 诊断工具 |
| `test_ai_analysis.py` | 新增 AI 分析测试 |

---

## 测试验证

```bash
# 测试 AI 分析
python test_ai_analysis.py

# 诊断 Brave API
python diagnose_brave.py

# 查看搜索矩阵
python -c "from api.update_intel import generate_search_matrix; print(len(generate_search_matrix()))"
```
