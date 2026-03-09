// Gemini API 工具库
// ⚠️ 已弃用: 请使用 ai-client.ts 作为统一入口，支持多模型切换
// import { askGemini, chatWithAI, setDefaultAIModel } from './ai-client'

const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://new.lemonapi.site/v1'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
const DEFAULT_MODEL = process.env.GEMINI_MODEL || '[L]gemini-2.5-pro'

export interface GeminiMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface GeminiResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

/**
 * 调用 Gemini API 进行对话
 */
export async function chatWithGemini(
  messages: GeminiMessage[],
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
  } = {}
): Promise<GeminiResponse | null> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured')
    return null
  }

  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens,
    stream = false
  } = options

  try {
    const response = await fetch(`${GEMINI_API_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error(`Gemini API error: ${response.status}`, error)
      return null
    }

    const data = await response.json()

    return {
      content: data.choices?.[0]?.message?.content || '',
      model: data.model || model,
      usage: data.usage
    }
  } catch (error) {
    console.error('Gemini API request failed:', error)
    return null
  }
}

/**
 * 单条消息快速对话
 */
export async function askGemini(
  prompt: string,
  options: {
    model?: string
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
  } = {}
): Promise<string | null> {
  const messages: GeminiMessage[] = []

  if (options.systemPrompt) {
    messages.push({ role: 'system', content: options.systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  const response = await chatWithGemini(messages, options)
  return response?.content || null
}

/**
 * 使用 Gemini 分析新闻情感
 */
export async function analyzeNewsWithGemini(
  title: string,
  content: string
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

  const response = await askGemini(prompt, {
    temperature: 0.3,
    systemPrompt: '你是一个专业的新闻分析助手，擅长分析新闻的情感倾向、重要性和提取关键词。只返回 JSON 格式，不要其他解释。'
  })

  if (!response) return null

  try {
    // 提取 JSON 部分
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return null
  } catch {
    console.error('Failed to parse Gemini response:', response)
    return null
  }
}

/**
 * 获取可用模型列表
 */
export async function listGeminiModels(): Promise<string[]> {
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY not configured')
    return []
  }

  try {
    const response = await fetch(`${GEMINI_API_URL}/models`, {
      headers: {
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      }
    })

    if (!response.ok) {
      console.error(`Failed to fetch models: ${response.status}`)
      return []
    }

    const data = await response.json()
    return data.data?.map((m: any) => m.id) || []
  } catch (error) {
    console.error('Failed to list models:', error)
    return []
  }
}

// 默认模型列表（基于 API 返回）
export const AVAILABLE_MODELS = [
  '[L]gemini-2.5-pro',
  '[L]gemini-2.5-pro-maxthinking',
  '[L]gemini-2.5-pro-search',
  '[L]gemini-2.5-flash',
  '[L]gemini-2.5-flash-maxthinking',
  '[L]gemini-2.5-flash-search',
  '[L]gemini-3-flash-preview',
  '[L]gemini-3-flash-preview-search',
  '[L]gemini-3-pro-preview',
  '[L]gemini-3-pro-preview-search',
  '[L]gemini-3.1-pro-preview',
  '[L]流式抗截断/gemini-2.5-pro',
  '[L]流式抗截断/gemini-2.5-pro-maxthinking',
  '[L]流式抗截断/gemini-2.5-pro-search',
]
