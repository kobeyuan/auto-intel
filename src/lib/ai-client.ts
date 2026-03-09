// 统一 AI 客户端 - 支持 Kimi、Gemini 等多个模型切换

export type AIModel = 'kimi' | 'gemini' | 'openai'

export interface AIMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface AIResponse {
  content: string
  model: string
  provider: AIModel
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AIClientOptions {
  model?: AIModel
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

// 模型配置
const MODEL_CONFIGS: Record<AIModel, { url: string; key: string; defaultModel: string }> = {
  kimi: {
    url: process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1',
    key: process.env.KIMI_API_KEY || '',
    defaultModel: process.env.KIMI_MODEL || 'moonshot-v1-8k'
  },
  gemini: {
    url: process.env.GEMINI_API_URL || 'https://new.lemonapi.site/v1',
    key: process.env.GEMINI_API_KEY || '',
    defaultModel: process.env.GEMINI_MODEL || '[L]gemini-2.5-pro'
  },
  openai: {
    url: process.env.OPENAI_API_URL || 'https://api.openai.com/v1',
    key: process.env.OPENAI_API_KEY || '',
    defaultModel: process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
  }
}

// 默认使用的模型（从环境变量读取，默认为 kimi）
let defaultModel: AIModel = (process.env.DEFAULT_AI_MODEL as AIModel) || 'kimi'

/**
 * 设置默认使用的 AI 模型
 */
export function setDefaultAIModel(model: AIModel) {
  defaultModel = model
  console.log(`✅ 默认 AI 模型已设置为: ${model}`)
}

/**
 * 获取当前默认模型
 */
export function getDefaultAIModel(): AIModel {
  return defaultModel
}

/**
 * 获取所有可用的模型列表
 */
export function getAvailableModels(): { id: AIModel; name: string; configured: boolean }[] {
  return [
    { id: 'gemini', name: 'Gemini', configured: !!MODEL_CONFIGS.gemini.key },
    { id: 'kimi', name: 'Kimi (Moonshot)', configured: !!MODEL_CONFIGS.kimi.key },
    { id: 'openai', name: 'OpenAI', configured: !!MODEL_CONFIGS.openai.key }
  ]
}

/**
 * 统一的聊天接口 - 支持自动切换模型
 */
export async function chatWithAI(
  messages: AIMessage[],
  options: AIClientOptions & { provider?: AIModel } = {}
): Promise<AIResponse | null> {
  const provider = options.provider || defaultModel
  const config = MODEL_CONFIGS[provider]

  if (!config.key) {
    console.error(`${provider} API key not configured`)
    // 尝试切换到其他可用模型
    const available = getAvailableModels().filter(m => m.configured && m.id !== provider)
    if (available.length > 0) {
      console.log(`🔄 尝试切换到 ${available[0].id}...`)
      return chatWithAI(messages, { ...options, provider: available[0].id })
    }
    return null
  }

  let {
    temperature = 0.7,
    maxTokens,
    stream = false
  } = options

  // kimi-k2.5 模型只支持 temperature=1
  if (provider === 'kimi' && config.defaultModel === 'kimi-k2.5') {
    temperature = 1
  }

  try {
    const response = await fetch(`${config.url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: config.defaultModel,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`${provider} API error: ${response.status}`, error)
      return null
    }

    const data = await response.json()

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || config.defaultModel,
      provider,
      usage: data.usage
    }
  } catch (error) {
    console.error(`${provider} API request failed:`, error)
    return null
  }
}

/**
 * 简单对话 - 自动使用默认模型
 */
export async function askAI(
  prompt: string,
  options: Omit<AIClientOptions, 'model'> & { provider?: AIModel; systemPrompt?: string } = {}
): Promise<string | null> {
  const messages: AIMessage[] = []

  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  const response = await chatWithAI(messages, options)
  return response?.content || null
}

/**
 * 使用指定模型对话
 */
export async function askKimi(prompt: string, options: Omit<AIClientOptions, 'model'> = {}): Promise<string | null> {
  return askAI(prompt, { ...options, provider: 'kimi' })
}

export async function askGemini(prompt: string, options: Omit<AIClientOptions, 'model'> = {}): Promise<string | null> {
  return askAI(prompt, { ...options, provider: 'gemini' })
}

export async function askOpenAI(prompt: string, options: Omit<AIClientOptions, 'model'> = {}): Promise<string | null> {
  return askAI(prompt, { ...options, provider: 'openai' })
}

/**
 * AI 分析新闻情感
 */
export async function analyzeNewsWithAI(
  title: string,
  content: string,
  provider?: AIModel
): Promise<{
  sentiment: 'positive' | 'neutral' | 'negative'
  importance: 'high' | 'medium' | 'low'
  keywords: string[]
  summary: string
} | null> {
  const prompt = `请分析以下新闻，返回 JSON 格式结果：

标题：${title}
内容：${content}

请返回以下格式的 JSON：
{
  "sentiment": "positive|neutral|negative",
  "importance": "high|medium|low",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "summary": "一句话总结"
}`

  const response = await askAI(prompt, {
    provider,
    temperature: 0.3,
    systemPrompt: '你是一个专业的新闻分析助手，擅长分析新闻的情感倾向、重要性和提取关键词。只返回 JSON 格式，不要其他解释。'
  })

  if (!response) return null

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch {
    console.error('Failed to parse AI response:', response)
    return null
  }
}

/**
 * 批量分析 - 自动负载均衡
 */
export async function batchAnalyzeWithAI(
  items: Array<{ title: string; content: string }>,
  options: { preferredProvider?: AIModel } = {}
): Promise<Array<{
  sentiment: 'positive' | 'neutral' | 'negative'
  importance: 'high' | 'medium' | 'low'
  keywords: string[]
  summary: string
} | null>> {
  const results: Array<{
    sentiment: 'positive' | 'neutral' | 'negative'
    importance: 'high' | 'medium' | 'low'
    keywords: string[]
    summary: string
  } | null> = []

  const providers = getAvailableModels()
    .filter(m => m.configured)
    .map(m => m.id)

  if (providers.length === 0) {
    console.error('No AI providers configured')
    return items.map(() => null)
  }

  let providerIndex = 0

  for (const item of items) {
    const provider = options.preferredProvider || providers[providerIndex % providers.length]
    const result = await analyzeNewsWithAI(item.title, item.content, provider)
    results.push(result)

    providerIndex++

    // 添加延迟避免限流
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  return results
}

// 导出类型和配置
export { MODEL_CONFIGS, defaultModel }
