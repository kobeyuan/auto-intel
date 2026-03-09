// AI 客户端使用示例

import {
  // 通用接口
  askAI,
  chatWithAI,
  analyzeNewsWithAI,
  batchAnalyzeWithAI,

  // 指定模型接口
  askKimi,
  askGemini,
  askOpenAI,

  // 配置
  setDefaultAIModel,
  getDefaultAIModel,
  getAvailableModels,

  // 类型
  AIModel,
  AIMessage
} from './ai-client'

// ============================================
// 示例 1: 使用默认模型（自动 fallback）
// ============================================
async function example1_basic() {
  // 使用默认模型（初始为 gemini）
  const reply = await askAI('你好，请介绍一下自己')
  console.log(reply)
}

// ============================================
// 示例 2: 明确指定模型
// ============================================
async function example2_specifyModel() {
  // 使用 Kimi
  const kimiReply = await askKimi('你好，我是Kimi')
  console.log('Kimi:', kimiReply)

  // 使用 Gemini
  const geminiReply = await askGemini('你好，我是Gemini')
  console.log('Gemini:', geminiReply)

  // 或者在 askAI 中指定
  const reply = await askAI('你好', { provider: 'kimi' })
}

// ============================================
// 示例 3: 切换默认模型
// ============================================
async function example3_switchDefault() {
  // 查看当前默认模型
  console.log('当前默认:', getDefaultAIModel()) // 'gemini'

  // 切换到 Kimi
  setDefaultAIModel('kimi')

  // 之后的 askAI 都会使用 Kimi
  const reply = await askAI('现在我是默认用Kimi了')
  console.log(reply)

  // 查看所有可用模型
  const models = getAvailableModels()
  console.log(models)
  // [
  //   { id: 'gemini', name: 'Gemini', configured: true },
  //   { id: 'kimi', name: 'Kimi (Moonshot)', configured: false },
  //   { id: 'openai', name: 'OpenAI', configured: false }
  // ]
}

// ============================================
// 示例 4: 多轮对话
// ============================================
async function example4_conversation() {
  const messages: AIMessage[] = [
    { role: 'system', content: '你是一个专业的汽车分析师' },
    { role: 'user', content: '分析一下电动车市场' },
    { role: 'assistant', content: '电动车市场正在快速增长...' },
    { role: 'user', content: '具体有哪些品牌表现好？' }
  ]

  const response = await chatWithAI(messages, {
    provider: 'gemini',
    temperature: 0.7
  })

  console.log(response?.content)
}

// ============================================
// 示例 5: 新闻分析
// ============================================
async function example5_newsAnalysis() {
  // 分析单条新闻
  const analysis = await analyzeNewsWithAI(
    '特斯拉发布新款Model 3',
    '特斯拉今日发布了新款Model 3，续航里程提升20%，售价降低10%...',
    'gemini'  // 指定使用 Gemini
  )

  console.log(analysis)
  // {
  //   sentiment: 'positive',
  //   importance: 'high',
  //   keywords: ['特斯拉', 'Model 3', '续航'],
  //   summary: '特斯拉发布新款Model 3，性能提升价格下降'
  // }
}

// ============================================
// 示例 6: 批量分析（自动负载均衡）
// ============================================
async function example6_batchAnalysis() {
  const newsList = [
    { title: '新闻1', content: '内容1' },
    { title: '新闻2', content: '内容2' },
    { title: '新闻3', content: '内容3' },
    { title: '新闻4', content: '内容4' },
  ]

  // 自动在多个模型间分配请求
  const results = await batchAnalyzeWithAI(newsList)

  // 或者指定优先模型
  const results2 = await batchAnalyzeWithAI(newsList, {
    preferredProvider: 'kimi'
  })
}

// ============================================
// 示例 7: 错误处理和 fallback
// ============================================
async function example7_fallback() {
  // 如果配置的模型不可用，会自动尝试其他模型
  const reply = await askAI('你好', { provider: 'kimi' })

  // 如果 Kimi 未配置或失败，会自动切换到 Gemini
  // 如果 Gemini 也失败，会返回 null

  if (!reply) {
    console.log('所有模型都不可用')
  }
}

// ============================================
// 推荐用法
// ============================================

// 1. 简单查询 - 使用默认模型
export async function quickAsk(prompt: string) {
  return askAI(prompt)
}

// 2. 需要特定能力的场景 - 明确指定模型
export async function analyzeWithGemini(title: string, content: string) {
  // Gemini 在某些场景下表现更好
  return analyzeNewsWithAI(title, content, 'gemini')
}

export async function chatWithKimi(messages: AIMessage[]) {
  // Kimi 中文对话能力强
  return chatWithAI(messages, { provider: 'kimi' })
}

// 3. 批量处理 - 自动负载均衡
export async function batchProcess(items: any[]) {
  return batchAnalyzeWithAI(items)
}

// 导出示例
export {
  example1_basic,
  example2_specifyModel,
  example3_switchDefault,
  example4_conversation,
  example5_newsAnalysis,
  example6_batchAnalysis,
  example7_fallback
}
