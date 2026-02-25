// 飞书推送功能
import { getSupabase } from './supabase'

const FEISHU_WEBHOOK_URL = process.env.FEISHU_WEBHOOK_URL || ''

interface FeishuMessage {
  msg_type: 'text' | 'post' | 'interactive'
  content: any
}

// 发送文本消息到飞书
export async function sendToFeishu(text: string) {
  if (!FEISHU_WEBHOOK_URL) {
    console.warn('FEISHU_WEBHOOK_URL not configured')
    return { success: false, message: '飞书 Webhook 未配置' }
  }

  const message: FeishuMessage = {
    msg_type: 'text',
    content: {
      text: text
    }
  }

  try {
    const response = await fetch(FEISHU_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    })

    const result = await response.json()
    return { success: response.ok, data: result }
  } catch (error) {
    console.error('Feishu push error:', error)
    return { success: false, error }
  }
}

// 推送舆情摘要
export async function pushSentimentSummary(sentiment: any) {
  const emoji = sentiment.sentiment === 'positive' ? '🟢' : sentiment.sentiment === 'negative' ? '🔴' : '⚪'

  const text = `${emoji} 新的舆情监控\n\n` +
    `标题：${sentiment.title}\n` +
    `情感：${sentiment.sentiment}\n` +
    `来源：${sentiment.source}\n` +
    `置信度：${(sentiment.confidence * 100).toFixed(0)}%\n\n` +
    `内容摘要：${sentiment.content.substring(0, 100)}...`

  return sendToFeishu(text)
}

// 推送日报
export async function pushDailyReport(stats: any) {
  const text = `📊 智能驾驶情报日报\n\n` +
    `产品总数：${stats.totalProducts}\n` +
    `舆情总数：${stats.totalSentiments}\n` +
    `🟢 正面：${stats.positiveCount}\n` +
    `⚪ 中立：${stats.neutralCount}\n` +
    `🔴 负面：${stats.negativeCount}\n\n` +
    `时间：${new Date().toLocaleDateString('zh-CN')}`

  return sendToFeishu(text)
}
